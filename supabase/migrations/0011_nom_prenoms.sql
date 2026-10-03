-- Pré-inscription : nom et prénoms séparés (la colonne « nom » garde le nom complet « Prénoms NOM » pour l'affichage)
alter table public.eleves
  add column if not exists nom_famille text check (length(nom_famille) <= 60),
  add column if not exists prenoms text check (length(prenoms) <= 80);
alter table public.inscriptions_web add column if not exists telephone text check (length(telephone) <= 20);

-- La page d'inscription reprend ce que l'élève a déjà donné (seulement avec le bon code secret)
create or replace function public.inscription_info(p_id bigint, p_jeton text)
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'p', coalesce(nullif(split_part(trim(coalesce(e.prenoms, '')), ' ', 1), ''), split_part(trim(e.nom), ' ', 1)),
    'f', coalesce(e.formation, ''),
    'nf', coalesce(e.nom_famille, ''),
    'pr', coalesce(e.prenoms, ''),
    'nc', e.nom,
    't', coalesce(e.telephone, ''),
    'q', coalesce(e.quartier, ''),
    'm', coalesce((select r.valeur from public.reglages r where r.cle = 'mixx_numero'), ''),
    'n', coalesce((select r.valeur from public.reglages r where r.cle = 'mixx_nom'), ''))
  from public.eleves e
  where e.id = p_id and e.jeton is not null and e.jeton = p_jeton and e.statut = 'Contacté'
$$;
