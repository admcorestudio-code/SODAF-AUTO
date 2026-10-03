-- SODAF Auto-École · structure de la base (Supabase / PostgreSQL)
-- Migration 0001, 3 octobre 2026. Chaque changement futur = un nouveau fichier numéroté (0002_…),
-- appliqué via le même mécanisme : jamais de modification à la main en production.

-- 1. Équipe : un profil par compte (propriétaire, secrétaire, moniteur)
create table public.profils (
  id uuid primary key references auth.users on delete cascade,
  nom text not null,
  role text not null check (role in ('admin', 'secretariat', 'moniteur'))
);

create or replace function public.est_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profils where id = auth.uid())
$$;

-- 2. Réglages (date de départ du cycle des devoirs, etc.)
create table public.reglages (cle text primary key, valeur text not null);
insert into public.reglages values ('devoir_debut', '2026-10-05');

-- 3. Élèves (pré-inscriptions du site + élèves inscrits)
create table public.eleves (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  nom text not null check (length(nom) between 3 and 80),
  telephone text check (telephone ~ '^\+228[0-9]{8}$'),
  quartier text check (length(quartier) <= 80),
  formation text check (length(formation) <= 80),
  creneau_prefere text check (length(creneau_prefere) <= 40),
  paiement_prefere text check (length(paiement_prefere) <= 40),
  message text check (length(message) <= 1000),
  source text not null default 'site' check (source in ('site', 'bureau')),
  statut text not null default 'Nouveau' check (statut in ('Nouveau', 'Contacté', 'Inscrit', 'En formation', 'Permis obtenu', 'Abandon')),
  notes text
);

-- 4. Planning conduite
create table public.creneaux_conduite (
  id bigint generated always as identity primary key,
  jour date not null,
  heure text not null,
  statut text not null default 'Libre' check (statut in ('Libre', 'Réservé', 'Fait', 'Absent', 'Annulé')),
  eleve_id bigint references public.eleves,
  note text,
  modifie_le timestamptz not null default now(),
  unique (jour, heure)
);

-- 5. Cours de code et présences
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
  seance_id bigint references public.seances_code,
  eleve_id bigint references public.eleves,
  primary key (seance_id, eleve_id)
);

-- 6. Devoirs de la semaine
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
  semaine date not null,
  check (note between 0 and sur and sur between 1 and 40)
);

-- 7. Paiements (un reçu par ligne)
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

-- 8. Jours fériés (aucun créneau ni cours ces jours-là)
create table public.jours_feries (jour date primary key, nom text not null);
insert into public.jours_feries values
  ('2026-11-01', 'Toussaint'), ('2026-12-25', 'Noël'),
  ('2027-01-01', 'Jour de l''an'), ('2027-01-13', 'Fête de la libération'),
  ('2027-04-27', 'Fête de l''indépendance'), ('2027-05-01', 'Fête du travail'),
  ('2027-06-21', 'Journée des martyrs'), ('2027-08-15', 'Assomption'),
  ('2027-11-01', 'Toussaint'), ('2027-12-25', 'Noël');

-- 9. Génération d'un mois : créneaux de conduite, séances de code, semaines de devoirs
create or replace function public.generer_mois(debut date) returns text
language plpgsql security definer set search_path = public as $$
declare
  d date; fin date := (date_trunc('month', debut) + interval '1 month - 1 day')::date;
  dow int; h text; nc int := 0; ns int := 0; nw int := 0; n int;
  depart date := (select valeur::date from reglages where cle = 'devoir_debut');
  themes text[] := array['Signalisation et marquages','Les panneaux','Intersections et priorités','Qui passe en premier ?','Feux, passages à niveau et agents','Le poste de conduite','Vitesse, distances et stationnement','Secourisme routier','Assurance et conduire chez nous','Mécanique et tableau de bord'];
begin
  d := date_trunc('month', debut)::date;
  while d <= fin loop
    dow := extract(isodow from d);
    if dow = 1 then
      n := greatest(0, (d - depart) / 7) % 10;
      insert into devoir_semaines values (d, chr(65 + n), themes[n + 1]) on conflict do nothing;
      get diagnostics n = row_count; nw := nw + n;
    end if;
    if dow < 7 and not exists (select 1 from jours_feries where jour = d) then
      foreach h in array case when dow = 6 then array['6 h 30','7 h 30','8 h 45','9 h 45','10 h 45']
                              else array['6 h 30','7 h 30','8 h 45','9 h 45','15 h 45','16 h 45'] end loop
        insert into creneaux_conduite (jour, heure) values (d, h) on conflict do nothing;
        get diagnostics n = row_count; nc := nc + n;
      end loop;
      if dow in (1, 3, 5, 6) then
        insert into seances_code (jour, type, heure) values (d,
          case dow when 1 then 'Cours complet' when 3 then 'Récap et devoir' when 5 then 'Entraînement examen' else 'Examen blanc' end,
          case when dow = 6 then '10 h – 11 h' else '14 h 30 – 15 h 30' end) on conflict do nothing;
        get diagnostics n = row_count; ns := ns + n;
      end if;
    end if;
    d := d + 1;
  end loop;
  return format('%s : %s créneaux, %s séances, %s semaines', to_char(debut, 'YYYY-MM'), nc, ns, nw);
end $$;
revoke execute on function public.generer_mois(date) from public, anon, authenticated;

-- 10. Sécurité (Row Level Security) : tout est fermé par défaut
alter table public.profils enable row level security;
alter table public.reglages enable row level security;
alter table public.eleves enable row level security;
alter table public.creneaux_conduite enable row level security;
alter table public.seances_code enable row level security;
alter table public.presences enable row level security;
alter table public.devoir_semaines enable row level security;
alter table public.devoir_resultats enable row level security;
alter table public.paiements enable row level security;
alter table public.jours_feries enable row level security;

-- Visiteurs du site : seulement s'inscrire et envoyer un devoir (aucune lecture)
create policy "site : pré-inscription" on public.eleves for insert to anon
  with check (statut = 'Nouveau' and notes is null and source = 'site');
create policy "site : envoi devoir" on public.devoir_resultats for insert to anon
  with check (recu_le > now() - interval '1 minute' and semaine between current_date - 7 and current_date);

-- Équipe connectée : lire, ajouter, modifier. Aucune suppression (on passe le statut à Annulé).
create policy "équipe : profils" on public.profils for select to authenticated using (public.est_equipe());
create policy "équipe : réglages" on public.reglages for select to authenticated using (public.est_equipe());
create policy "équipe : fériés" on public.jours_feries for select to authenticated using (public.est_equipe());
create policy "équipe : lire semaines" on public.devoir_semaines for select to authenticated using (public.est_equipe());
do $$ declare t text; begin
  foreach t in array array['eleves','creneaux_conduite','seances_code','presences','devoir_resultats','paiements'] loop
    execute format('create policy "équipe : lire" on public.%I for select to authenticated using (public.est_equipe())', t);
    execute format('create policy "équipe : ajouter" on public.%I for insert to authenticated with check (public.est_equipe())', t);
    execute format('create policy "équipe : modifier" on public.%I for update to authenticated using (public.est_equipe()) with check (public.est_equipe())', t);
  end loop;
end $$;
-- Les présences se décochent : suppression autorisée pour l'équipe sur cette seule table
create policy "équipe : retirer présence" on public.presences for delete to authenticated using (public.est_equipe());

-- Pas de droits de suppression au niveau des tables (sauf présences)
revoke delete on public.eleves, public.creneaux_conduite, public.seances_code, public.devoir_resultats, public.paiements, public.devoir_semaines from anon, authenticated;
revoke all on public.profils, public.reglages, public.jours_feries from anon;
revoke insert, update, delete on public.profils, public.reglages, public.jours_feries, public.devoir_semaines from authenticated;

-- Index utiles
create index on public.creneaux_conduite (jour);
create index on public.seances_code (jour);
create index on public.devoir_resultats (semaine);
create index on public.paiements (jour);
create index on public.paiements (eleve_id);
create index on public.creneaux_conduite (eleve_id);
create index on public.presences (eleve_id);
