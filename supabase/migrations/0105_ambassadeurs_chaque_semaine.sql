-- 0105 (5 nov. 2026) : les deux ambassadeurs changent de rôle chaque semaine (le lundi), plus chaque mois. Décision du propriétaire.
-- debut = le lundi de la semaine de référence (AAAA-MM-JJ) ; les semaines suivantes, les rôles s'inversent une semaine sur deux.
-- Sans ligne, l'écran fait tourner tout seul (premier compte aux Relations la semaine du 2 nov. 2026). La direction peut « Échanger cette semaine ».
alter table public.amb_rotation drop constraint if exists amb_rotation_debut_check;
alter table public.amb_rotation add constraint amb_rotation_debut_check check (debut ~ '^\d{4}-\d{2}(-\d{2})?$');

create or replace function public.amb_rotation_regler(p_terrain uuid, p_digital uuid)
 returns void language plpgsql security definer set search_path to '' as $function$
declare m text := to_char(date_trunc('week', (now() at time zone 'Africa/Lome'))::date, 'YYYY-MM-DD');
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_terrain is null or not exists (select 1 from public.profils where id = p_terrain and role = 'ambassadeur' and actif) then raise exception 'Choisis l''Ambassadeur Relations.'; end if;
  if p_digital is not null and (p_digital = p_terrain or not exists (select 1 from public.profils where id = p_digital and role = 'ambassadeur' and actif)) then raise exception 'Choisis un autre ambassadeur pour le Contenu.'; end if;
  insert into public.amb_rotation (id, debut, terrain, digital, le, par) values (1, m, p_terrain, p_digital, now(), auth.uid())
  on conflict (id) do update set debut = excluded.debut, terrain = excluded.terrain, digital = excluded.digital, le = now(), par = auth.uid();
end $function$;
