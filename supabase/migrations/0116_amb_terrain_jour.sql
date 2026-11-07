-- 7 nov. : journée terrain à deux (matin boutiques, marchés, commerces ; après-midi universités), jour choisi par la direction
alter table public.amb_rotation add column if not exists terrain_jour smallint check (terrain_jour between 1 and 6);
create or replace function public.amb_terrain_jour(p_jour smallint)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_jour is not null and (p_jour < 1 or p_jour > 6) then raise exception 'Jour du lundi au samedi.'; end if;
  update public.amb_rotation set terrain_jour = p_jour, le = now(), par = auth.uid() where id = 1;
  if not found then raise exception 'Règle d''abord la rotation des ambassadeurs.'; end if;
end $$;
revoke execute on function public.amb_terrain_jour(smallint) from public, anon;
grant execute on function public.amb_terrain_jour(smallint) to authenticated;
