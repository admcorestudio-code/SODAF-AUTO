-- 0094 · Grand écran du tirage (1er nov. 2026). Appliqué par Claude.
-- Pour l'écran filmé : prénom, initiale du nom, université, n° de ticket, 4 derniers chiffres du téléphone. Jamais le numéro complet ni la carte.
create or replace function public.tirage_ecran(p_campagne text)
 returns table (id bigint, ticket bigint, prenoms text, nom text, universite text, tel4 text, statut text, tire_le timestamptz)
 language sql stable security definer set search_path to '' as $function$
  select t.id, row_number() over (order by t.id), t.prenoms, left(t.nom, 1), t.universite, right(t.telephone, 4), t.statut, t.tire_le
    from public.tirage_participants t
   where t.campagne = p_campagne and prive.a_role(array['admin', 'gerant', 'secretariat', 'ambassadeur'])
   order by t.id
$function$;
