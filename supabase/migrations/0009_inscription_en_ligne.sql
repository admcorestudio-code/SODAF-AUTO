-- Inscription en ligne : chaque élève reçoit un lien personnel (n° de dossier + code secret).
alter table public.eleves add column if not exists jeton text check (jeton ~ '^[A-Za-z0-9]{10,32}$');

alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb
              and dossier_envoye_le is null and dossier_relance_le is null and jeton is null);

create table if not exists public.inscriptions_web (
  id bigint generated always as identity primary key,
  eleve_id bigint not null references public.eleves(id),
  jeton text not null,
  le timestamptz not null default now(),
  formule text not null check (length(formule) <= 80),
  prix integer not null check (prix between 0 and 1000000),
  paiement text not null check (paiement in ('moitie','total')),
  a_payer integer not null check (a_payer between 0 and 1000000),
  mode text not null check (mode in ('agence','mixx')),
  mixx_tel text check (length(mixx_tel) <= 20),
  mixx_ref text check (length(mixx_ref) <= 60),
  nom text not null check (length(nom) between 2 and 60),
  prenoms text not null check (length(prenoms) between 2 and 80),
  naissance_date date,
  naissance_lieu text check (length(naissance_lieu) <= 80),
  quartier text check (length(quartier) <= 80),
  profession text check (length(profession) <= 80),
  urgence_nom text check (length(urgence_nom) <= 80),
  urgence_tel text check (length(urgence_tel) <= 20),
  statut text not null default 'Nouveau' check (statut in ('Nouveau','Vérifié','Rejeté'))
);
create index if not exists inscriptions_web_eleve_idx on public.inscriptions_web(eleve_id, le desc);

create or replace function prive.jeton_ok(p_id bigint, p_jeton text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.eleves e where e.id = p_id and e.jeton is not null and e.jeton = p_jeton and e.statut = 'Contacté')
$$;
revoke all on function prive.jeton_ok(bigint, text) from public;
grant usage on schema prive to anon;
grant execute on function prive.jeton_ok(bigint, text) to anon;

alter table public.inscriptions_web enable row level security;
create policy "site : finaliser inscription" on public.inscriptions_web for insert to anon
  with check (statut = 'Nouveau' and le > now() - interval '1 minute' and prive.jeton_ok(eleve_id, jeton)
              and (mode = 'agence' or (mixx_tel is not null or mixx_ref is not null)));
create policy "équipe : lire" on public.inscriptions_web for select to authenticated using (prive.est_equipe());
create policy "équipe : modifier" on public.inscriptions_web for update to authenticated using (prive.est_equipe()) with check (prive.est_equipe());
grant insert on public.inscriptions_web to anon;
grant select, update on public.inscriptions_web to authenticated;
