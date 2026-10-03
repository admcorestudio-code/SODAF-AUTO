-- Parcours secrétariat : Accueil (Nouveau) → Appels (Contacté) → En formation (Inscrit / En formation / Permis obtenu) → Archivés (Abandon + motif)
alter table public.eleves
  add column if not exists accueil_le timestamptz,
  add column if not exists appels smallint not null default 0 check (appels between 0 and 20),
  add column if not exists rappel text check (rappel in ('matin','apres-midi')),
  add column if not exists dossier jsonb not null default '{}'::jsonb,
  add column if not exists archive_motif text check (archive_motif in ('Rétractation','Faux numéro','Injoignable','Plus tard')),
  add column if not exists archive_le timestamptz;

alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb);

create table if not exists public.suivi (
  id bigint generated always as identity primary key,
  eleve_id bigint not null references public.eleves(id),
  le timestamptz not null default now(),
  type text not null check (type in ('Accueil envoyé','Appel réussi','Appel sans réponse','Relance envoyée','Note','Étape')),
  note text check (length(note) <= 500),
  fait_par uuid default auth.uid()
);
create index if not exists suivi_eleve_idx on public.suivi(eleve_id, le desc);
alter table public.suivi enable row level security;
create policy "équipe : lire" on public.suivi for select to authenticated using (prive.est_equipe());
create policy "équipe : ajouter" on public.suivi for insert to authenticated with check (prive.est_equipe());
grant select, insert on public.suivi to authenticated;
