-- SODAF · Tirage au sort étudiant : chaque mois, 2 gagnants font la formation complète à 15 000 F (inscription offerte).
-- Participation gratuite sur le site (#tirage) : nom, téléphone, université, photo de la carte d'étudiant, 18 ans ou plus.
-- Inscriptions du 2 au 28 du mois (heure de Lomé), tirage le 1er du mois suivant dans l'onglet Gérance.
-- On ne vérifie que les gagnants (photo de la carte, puis carte originale + carte d'identité à l'agence).
-- Rien ne se supprime : un gagnant refusé passe au statut « refuse » et on en tire un autre.

-- 1. Campagne en cours (mois du tirage) et ouverture des inscriptions
create or replace function prive.tirage_campagne()
returns text language sql stable set search_path = '' as $$
  select to_char(date_trunc('month', (now() at time zone 'Africa/Lome')) + interval '1 month', 'YYYY-MM')
$$;
create or replace function prive.tirage_ouvert()
returns boolean language sql stable set search_path = '' as $$
  select extract(day from (now() at time zone 'Africa/Lome')) between 2 and 28
$$;
grant execute on function prive.tirage_campagne() to anon, authenticated;
grant execute on function prive.tirage_ouvert() to anon, authenticated;

-- 2. Participants
create table if not exists public.tirage_participants (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  campagne text not null check (campagne ~ '^[0-9]{4}-[0-9]{2}$'),
  nom text not null check (length(nom) between 2 and 60),
  prenoms text not null check (length(prenoms) between 2 and 80),
  telephone text not null check (telephone ~ '^\+228[0-9]{8}$'),
  universite text not null check (length(universite) between 2 and 80),
  carte_photo text not null check (length(carte_photo) <= 200),
  statut text not null default 'inscrit' check (statut in ('inscrit', 'gagnant', 'valide', 'refuse')),
  tire_le timestamptz,
  tire_par uuid references public.profils(id),
  decide_le timestamptz,
  note text check (length(note) <= 300),
  unique (campagne, telephone)
);
alter table public.tirage_participants enable row level security;
create policy "gérance : voir les participants" on public.tirage_participants for select to authenticated
  using (prive.a_role(array['admin', 'gerant', 'secretariat']));
-- Pas d'écriture directe : tout passe par les fonctions ci-dessous.

-- 3. Photo de la carte d'étudiant : espace privé « tirage » (1 Mo, images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tirage', 'tirage', false, 1048576, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;
create policy "tirage : photo de la carte" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'tirage' and (storage.foldername(name))[1] = prive.tirage_campagne() and prive.tirage_ouvert());
create policy "tirage : l'équipe voit les cartes" on storage.objects for select to authenticated
  using (bucket_id = 'tirage' and prive.a_role(array['admin', 'gerant', 'secretariat']));

-- 4. Participer (site public) : renvoie le numéro de ticket ; une seule participation par téléphone et par mois
create or replace function public.tirage_participer(p_nom text, p_prenoms text, p_telephone text, p_universite text, p_photo text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare c text := prive.tirage_campagne(); t text := '+228' || right(regexp_replace(coalesce(p_telephone, ''), '\D', '', 'g'), 8); n bigint; r record;
begin
  if not prive.tirage_ouvert() then raise exception 'Les inscriptions sont fermées : elles rouvrent le 2 du mois.'; end if;
  if t !~ '^\+228[0-9]{8}$' then raise exception 'Numéro de téléphone invalide (8 chiffres après le +228).'; end if;
  if coalesce(p_photo, '') not like c || '/%' then raise exception 'La photo de la carte d''étudiant est obligatoire.'; end if;
  select id into r from public.tirage_participants where campagne = c and telephone = t;
  if found then
    select count(*) into n from public.tirage_participants where campagne = c and id <= r.id;
    return jsonb_build_object('numero', n, 'deja', true, 'campagne', c);
  end if;
  insert into public.tirage_participants (campagne, nom, prenoms, telephone, universite, carte_photo)
  values (c, upper(trim(p_nom)), trim(p_prenoms), t, trim(p_universite), p_photo);
  select count(*) into n from public.tirage_participants where campagne = c;
  return jsonb_build_object('numero', n, 'deja', false, 'campagne', c);
end $$;
revoke all on function public.tirage_participer(text, text, text, text, text) from public;
grant execute on function public.tirage_participer(text, text, text, text, text) to anon, authenticated;

-- 5. Compteur public (aucune donnée personnelle)
create or replace function public.tirage_infos()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('campagne', prive.tirage_campagne(), 'ouvert', prive.tirage_ouvert(),
    'participants', (select count(*) from public.tirage_participants where campagne = prive.tirage_campagne()))
$$;
revoke all on function public.tirage_infos() from public;
grant execute on function public.tirage_infos() to anon, authenticated;

-- 6. Tirage (direction et gérante) : un gagnant au hasard parmi les inscrits de la campagne
create or replace function public.tirage_tirer(p_campagne text)
returns bigint language plpgsql volatile security definer set search_path = '' as $$
declare g bigint;
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la direction et à la gérante' using errcode = '42501'; end if;
  if (select count(*) from public.tirage_participants where campagne = p_campagne and statut = 'valide') >= 2 then raise exception 'Les 2 gagnants de ce mois sont déjà validés.'; end if;
  select id into g from public.tirage_participants where campagne = p_campagne and statut = 'inscrit' order by random() limit 1 for update skip locked;
  if g is null then raise exception 'Plus aucun participant à tirer pour ce mois.'; end if;
  update public.tirage_participants set statut = 'gagnant', tire_le = now(), tire_par = auth.uid() where id = g;
  return g;
end $$;
revoke all on function public.tirage_tirer(text) from public, anon;
grant execute on function public.tirage_tirer(text) to authenticated;

-- 7. Valider ou refuser un gagnant (carte illisible, pas étudiant, nom différent…)
create or replace function public.tirage_decider(p_id bigint, p_valide boolean, p_note text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la direction et à la gérante' using errcode = '42501'; end if;
  update public.tirage_participants set statut = case when p_valide then 'valide' else 'refuse' end, decide_le = now(), note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_id and statut = 'gagnant';
  if not found then raise exception 'Ce participant n''est pas un gagnant en attente.'; end if;
end $$;
revoke all on function public.tirage_decider(bigint, boolean, text) from public, anon;
grant execute on function public.tirage_decider(bigint, boolean, text) to authenticated;

-- 8. Sauvegarde : ajouter les participants
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''tirage_participants''' in d) = 0 then
    d := replace(d, '''rapports''', '''rapports'',''tirage_participants''');
    execute d;
  end if;
end $$;
