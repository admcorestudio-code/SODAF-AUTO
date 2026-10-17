-- SODAF · 17 octobre 2026 · Onglet « Mécanique » : carnet de la voiture, atelier du samedi, contrôle avant achat.
-- Pas de compte pour la mécanicienne au début : l'équipe note pour elle. Rien ne se supprime (statuts « annulé » au lieu d'effacer).
-- Idempotent (peut être collé deux fois).

-- 1. Carnet de la voiture : chaque contrôle, entretien ou réparation (avec le compteur)
create table if not exists public.entretiens (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  jour date not null default current_date,
  auteur uuid not null default auth.uid() references public.profils(id),
  type text not null check (type in ('Contrôle du samedi', 'Contrôle du mois', 'Vidange + filtre', 'Filtre à air', 'Pneus (permutation)', 'Bougies', 'Plaquettes', 'Liquides (frein, refroidissement)', 'Réparation', 'Autre')),
  km integer check (km is null or km between 0 and 2000000),
  note text check (note is null or length(note) <= 500),
  cout integer check (cout is null or cout between 0 and 5000000),
  photo text check (photo is null or photo like 'entretien/%')
);
alter table public.entretiens enable row level security;
drop policy if exists "voiture : lire" on public.entretiens;
create policy "voiture : lire" on public.entretiens for select to authenticated using (prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']));
drop policy if exists "voiture : noter" on public.entretiens;
create policy "voiture : noter" on public.entretiens for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) and auteur = auth.uid() and jour between current_date - 31 and current_date);
-- photos du carnet : dans l'espace « depenses », dossier entretien/
drop policy if exists "voiture : photo" on storage.objects;
create policy "voiture : photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'entretien' and prive.a_role(array['secretariat', 'moniteur']));
drop policy if exists "voiture : voir les photos" on storage.objects;
create policy "voiture : voir les photos" on storage.objects for select to authenticated
  using (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'entretien' and prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']));

-- 2. Atelier du samedi : 8 places, géré par le secrétariat
create table if not exists public.ateliers (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  samedi date not null check (extract(isodow from samedi) = 6),
  eleve_id bigint not null references public.eleves(id),
  par uuid not null default auth.uid() references public.profils(id),
  statut text not null default 'inscrit' check (statut in ('inscrit', 'present', 'absent', 'annule')),
  maj_le timestamptz,
  unique (samedi, eleve_id)
);
alter table public.ateliers enable row level security;
drop policy if exists "atelier : lire" on public.ateliers;
create policy "atelier : lire" on public.ateliers for select to authenticated using (prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']));
drop policy if exists "atelier : inscrire" on public.ateliers;
create policy "atelier : inscrire" on public.ateliers for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant', 'secretariat']) and par = auth.uid() and statut = 'inscrit' and samedi >= current_date);
drop policy if exists "atelier : modifier" on public.ateliers;
create policy "atelier : modifier" on public.ateliers for update to authenticated
  using (prive.a_role(array['admin', 'gerant', 'secretariat'])) with check (prive.a_role(array['admin', 'gerant', 'secretariat']));

create or replace function prive.trg_atelier_places()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.maj_le := case when tg_op = 'UPDATE' then now() else new.maj_le end;
  if new.statut in ('inscrit', 'present') and (tg_op = 'INSERT' or old.statut not in ('inscrit', 'present')) then
    perform 1 from public.ateliers where samedi = new.samedi for update;
    if (select count(*) from public.ateliers where samedi = new.samedi and statut in ('inscrit', 'present') and id <> coalesce(new.id, -1)) >= 8 then
      raise exception 'atelier complet (8 places)';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists atelier_places on public.ateliers;
create trigger atelier_places before insert or update on public.ateliers for each row execute function prive.trg_atelier_places();

-- 3. Contrôle avant achat (voiture 15 000 F, moto 10 000 F ; part de la mécanicienne 10 000 / 7 000)
create table if not exists public.controles (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  auteur uuid not null default auth.uid() references public.profils(id),
  client text not null check (length(client) between 2 and 120),
  telephone text not null check (telephone ~ '^\+?[0-9 ]{8,20}$'),
  vehicule text not null check (vehicule in ('Voiture', 'Moto')),
  lieu text check (lieu is null or length(lieu) <= 120),
  prix integer not null check (prix between 0 and 500000),
  part integer not null check (part between 0 and 500000),
  note text check (note is null or length(note) <= 500),
  statut text not null default 'demande' check (statut in ('demande', 'paye', 'rdv', 'fait', 'annule')),
  paye_ref text check (paye_ref is null or length(paye_ref) <= 60),
  paye_le timestamptz,
  rdv timestamptz,
  avis text check (avis is null or avis in ('Acheter', 'Négocier', 'Ne pas acheter')),
  fait_le timestamptz,
  part_versee_le timestamptz,
  part_versee_ref text check (part_versee_ref is null or length(part_versee_ref) <= 60)
);
alter table public.controles enable row level security;
drop policy if exists "contrôle : lire" on public.controles;
create policy "contrôle : lire" on public.controles for select to authenticated using (prive.a_role(array['admin', 'gerant', 'secretariat']));
drop policy if exists "contrôle : nouvelle demande" on public.controles;
create policy "contrôle : nouvelle demande" on public.controles for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant', 'secretariat']) and auteur = auth.uid() and statut = 'demande'
              and paye_le is null and fait_le is null and part_versee_le is null and part_versee_ref is null);

-- Étapes : paiement reçu → rendez-vous → contrôle fait (secrétariat, gérante, direction) ; annulation possible avant « fait »
create or replace function public.controle_etape(p_id bigint, p_statut text, p_ref text, p_rdv timestamptz, p_avis text, p_note text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare c public.controles;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  select * into c from public.controles where id = p_id for update;
  if not found then raise exception 'demande introuvable'; end if;
  if c.statut in ('fait', 'annule') then raise exception 'demande déjà terminée'; end if;
  if p_statut = 'paye' then
    if c.statut <> 'demande' then raise exception 'paiement déjà noté'; end if;
    if nullif(trim(coalesce(p_ref, '')), '') is null then raise exception 'référence du paiement obligatoire (SMS Mixx ou reçu)'; end if;
    update public.controles set statut = 'paye', paye_ref = trim(p_ref), paye_le = now() where id = p_id;
  elsif p_statut = 'rdv' then
    if c.statut not in ('paye', 'rdv') then raise exception 'paiement d''abord'; end if;
    if p_rdv is null then raise exception 'date du rendez-vous obligatoire'; end if;
    update public.controles set statut = 'rdv', rdv = p_rdv where id = p_id;
  elsif p_statut = 'fait' then
    if c.statut not in ('paye', 'rdv') then raise exception 'paiement d''abord'; end if;
    if p_avis is null or p_avis not in ('Acheter', 'Négocier', 'Ne pas acheter') then raise exception 'avis obligatoire'; end if;
    update public.controles set statut = 'fait', avis = p_avis, fait_le = now(), note = coalesce(nullif(trim(coalesce(p_note, '')), ''), note) where id = p_id;
  elsif p_statut = 'annule' then
    update public.controles set statut = 'annule', note = coalesce(nullif(trim(coalesce(p_note, '')), ''), note) where id = p_id;
  else raise exception 'étape inconnue';
  end if;
end $$;
revoke all on function public.controle_etape(bigint, text, text, timestamptz, text, text) from public, anon;
grant execute on function public.controle_etape(bigint, text, text, timestamptz, text, text) to authenticated;

-- Part de la mécanicienne versée (gérante ou direction)
create or replace function public.controle_part_versee(p_id bigint, p_ref text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la gérante et à la direction' using errcode = '42501'; end if;
  update public.controles set part_versee_le = now(), part_versee_ref = nullif(trim(coalesce(p_ref, '')), '')
   where id = p_id and statut = 'fait' and part_versee_le is null;
  if not found then raise exception 'contrôle introuvable, pas encore fait, ou part déjà versée'; end if;
end $$;
revoke all on function public.controle_part_versee(bigint, text) from public, anon;
grant execute on function public.controle_part_versee(bigint, text) to authenticated;

-- 4. Sauvegarde du dimanche : ajouter les trois nouvelles tables
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''entretiens''' in d) = 0 then
    d := replace(d, '''frais''', '''frais'',''entretiens'',''ateliers'',''controles''');
    execute d;
  end if;
end $$;
