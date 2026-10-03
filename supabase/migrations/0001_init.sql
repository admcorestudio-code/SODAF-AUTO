-- SODAF Auto-École · structure de la base (Supabase / PostgreSQL)
-- Brouillon v1, 3 octobre 2026. Chaque changement futur = un nouveau fichier numéroté (0002_…, 0003_…),
-- jamais de modification à la main en production.

-- 1. Équipe : un profil par compte (toi, la secrétaire, le moniteur)
create table public.profils (
  id uuid primary key references auth.users on delete cascade,
  nom text not null,
  role text not null check (role in ('admin', 'secretariat', 'moniteur'))
);

-- Fonction utilitaire : la personne connectée fait-elle partie de l'équipe ?
create or replace function public.est_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profils where id = auth.uid())
$$;

-- 2. Élèves (pré-inscriptions du site + élèves inscrits)
create table public.eleves (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  nom text not null check (length(nom) between 3 and 80),
  telephone text check (telephone ~ '^\+228[0-9]{8}$'),
  quartier text,
  formation text,
  creneau_prefere text,
  paiement_prefere text,
  message text check (length(message) <= 1000),
  source text default 'site',
  statut text not null default 'Nouveau' check (statut in ('Nouveau', 'Contacté', 'Inscrit', 'En formation', 'Permis obtenu', 'Abandon')),
  notes text
);

-- 3. Planning conduite
create table public.creneaux_conduite (
  id bigint generated always as identity primary key,
  jour date not null,
  heure text not null,
  statut text not null default 'Libre' check (statut in ('Libre', 'En attente', 'Réservé', 'Fait', 'Absent', 'Annulé')),
  eleve_id bigint references public.eleves,
  nom_externe text,
  tel_externe text,
  note text,
  unique (jour, heure)
);

-- 4. Cours de code et présences
create table public.seances_code (
  id bigint generated always as identity primary key,
  jour date not null,
  type text not null check (type in ('Cours complet', 'Récap et devoir', 'Entraînement examen', 'Examen blanc')),
  heure text not null,
  theme text,
  statut text not null default 'Prévu' check (statut in ('Prévu', 'Fait', 'Annulé')),
  note text,
  unique (jour, type)
);
create table public.presences (
  seance_id bigint references public.seances_code on delete cascade,
  eleve_id bigint references public.eleves,
  primary key (seance_id, eleve_id)
);

-- 5. Devoirs de la semaine
create table public.devoir_semaines (
  lundi date primary key,
  lettre char(1) not null check (lettre between 'A' and 'J'),
  theme text not null
);
create table public.devoir_resultats (
  id bigint generated always as identity primary key,
  recu_le timestamptz not null default now(),
  eleve_nom text not null check (length(eleve_nom) between 3 and 80),
  devoir char(1) not null check (devoir between 'A' and 'J'),
  note int not null,
  sur int not null default 10,
  semaine date references public.devoir_semaines,
  check (note between 0 and sur and sur between 1 and 40)
);

-- 6. Paiements (un reçu par ligne)
create table public.paiements (
  id bigint generated always as identity primary key,
  numero text not null unique,
  cree_le timestamptz not null default now(),
  jour date not null default current_date,
  eleve_id bigint references public.eleves,
  eleve_nom text not null,
  telephone text,
  formation text,
  prix int,
  motif text not null,
  montant int not null check (montant > 0),
  mode text not null check (mode in ('Espèces', 'Mixx by Yas (T-Money)')),
  reste int,
  note text,
  fait_par uuid references public.profils default auth.uid()
);

-- 7. Sécurité (Row Level Security) : tout est fermé par défaut
alter table public.profils enable row level security;
alter table public.eleves enable row level security;
alter table public.creneaux_conduite enable row level security;
alter table public.seances_code enable row level security;
alter table public.presences enable row level security;
alter table public.devoir_semaines enable row level security;
alter table public.devoir_resultats enable row level security;
alter table public.paiements enable row level security;

-- Visiteurs du site (non connectés) : seulement s'inscrire et envoyer un devoir
create policy "site : pré-inscription" on public.eleves for insert to anon with check (statut = 'Nouveau' and notes is null);
create policy "site : envoi devoir" on public.devoir_resultats for insert to anon with check (true);
create policy "site : lire les semaines" on public.devoir_semaines for select to anon, authenticated using (true);

-- Équipe connectée : lire, ajouter, modifier (pas de suppression : on passe le statut à Annulé)
create policy "équipe : son profil" on public.profils for select to authenticated using (est_equipe());
do $$ declare t text; begin
  foreach t in array array['eleves','creneaux_conduite','seances_code','presences','devoir_resultats','paiements'] loop
    execute format('create policy "équipe : lire" on public.%I for select to authenticated using (est_equipe())', t);
    execute format('create policy "équipe : ajouter" on public.%I for insert to authenticated with check (est_equipe())', t);
    execute format('create policy "équipe : modifier" on public.%I for update to authenticated using (est_equipe()) with check (est_equipe())', t);
  end loop;
end $$;
create policy "équipe : semaines" on public.devoir_semaines for insert to authenticated with check (est_equipe());
