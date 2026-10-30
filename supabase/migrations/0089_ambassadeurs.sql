-- 0089 · Deux ambassadeurs, deux rôles qui tournent chaque mois (30 oct. 2026, décision du propriétaire). Appliqué par Claude.
-- Ambassadeur Terrain (agence mercredi et vendredi, live et tirage, universités, affiches, partages) / Ambassadeur Digital (tournage, montage, publications, pubs payantes, messages).
alter table public.com_actions drop constraint com_actions_type_check,
  add constraint com_actions_type_check check (type in ('TikTok', 'Statut WhatsApp', 'Atelier filmé', 'Live du tirage', 'Pub étudiants', 'Autre',
    'Sortie terrain', 'Affiches posées', 'Partage groupes WhatsApp', 'Facebook / Instagram', 'Pub payante'));

-- Rotation : une seule ligne. Le mois « debut », terrain = Terrain et digital = Digital ; les mois suivants, les rôles s'inversent un mois sur deux.
create table if not exists public.amb_rotation (
  id int primary key default 1 check (id = 1),
  debut text not null check (debut ~ '^\d{4}-\d{2}$'),
  terrain uuid references public.profils(id),
  digital uuid references public.profils(id),
  le timestamptz not null default now(),
  par uuid default auth.uid()
);
alter table public.amb_rotation enable row level security;
create policy "ambassadeurs : lire la rotation" on public.amb_rotation for select to authenticated using (prive.est_membre());

create or replace function public.amb_rotation_regler(p_terrain uuid, p_digital uuid)
 returns void language plpgsql security definer set search_path to '' as $function$
declare m text := to_char(now() at time zone 'Africa/Lome', 'YYYY-MM');
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_terrain is null or not exists (select 1 from public.profils where id = p_terrain and role = 'ambassadeur' and actif) then raise exception 'Choisis l''Ambassadeur Terrain.'; end if;
  if p_digital is not null and (p_digital = p_terrain or not exists (select 1 from public.profils where id = p_digital and role = 'ambassadeur' and actif)) then raise exception 'Choisis un autre ambassadeur pour le Digital.'; end if;
  insert into public.amb_rotation (id, debut, terrain, digital, le, par) values (1, m, p_terrain, p_digital, now(), auth.uid())
  on conflict (id) do update set debut = excluded.debut, terrain = excluded.terrain, digital = excluded.digital, le = now(), par = auth.uid();
end $function$;
