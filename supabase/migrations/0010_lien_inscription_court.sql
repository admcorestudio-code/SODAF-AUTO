-- Lien court d'inscription (autosodaf.com/#inscrire-<n°>-<code>) : la page récupère seulement le prénom,
-- la formation et le numéro Mixx, et uniquement si le code secret est le bon.
create or replace function public.inscription_info(p_id bigint, p_jeton text)
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'p', split_part(trim(e.nom), ' ', 1),
    'f', coalesce(e.formation, ''),
    'm', coalesce((select r.valeur from public.reglages r where r.cle = 'mixx_numero'), ''),
    'n', coalesce((select r.valeur from public.reglages r where r.cle = 'mixx_nom'), ''))
  from public.eleves e
  where e.id = p_id and e.jeton is not null and e.jeton = p_jeton and e.statut = 'Contacté'
$$;
revoke all on function public.inscription_info(bigint, text) from public;
grant execute on function public.inscription_info(bigint, text) to anon, authenticated;
