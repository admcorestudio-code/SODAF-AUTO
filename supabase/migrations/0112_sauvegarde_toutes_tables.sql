-- 0112 (7 nov. 2026) : la sauvegarde du dimanche ne couvrait que les tables d'octobre.
-- prive.export_csv accepte maintenant toutes les tables créées depuis (tâches, commissions, tirage, mécanique, ambassadeurs…).
create or replace function prive.export_csv(tbl text, depuis date default null, jusqua date default null)
returns text language plpgsql stable security definer set search_path to '' as $function$
declare res text; q text; filtre text := '';
begin
  if tbl not in ('eleves','paiements','creneaux_conduite','seances_code','presences','devoir_resultats','devoir_semaines','jours_feries',
                 'profils','reglages','suivi','inscriptions_web','groupes_code','messages','canaux',
                 'ecoutes','lectures','connexions','decisions','demandes','rapports','taches','commissions','tirage_participants',
                 'equipes_conduite','ateliers','carburant','entretiens','controles','frais','materiel','agence_jours','amb_rotation',
                 'com_actions','com_taches','code_rattrapages') then
    raise exception 'table non autorisée : %', tbl;
  end if;
  if tbl in ('creneaux_conduite','seances_code','paiements') and (depuis is not null or jusqua is not null) then
    filtre := format(' where jour >= %L and jour <= %L', coalesce(depuis,'1900-01-01'::date), coalesce(jusqua,'2999-12-31'::date));
  end if;
  q := format($f$
    with r as (select row_number() over () n, row_to_json(t)::jsonb j from public.%I t %s),
    k as (select array_agg(key order by key) ks from (select distinct jsonb_object_keys(j) key from r) x),
    c as (select n, (select string_agg('"' || replace(coalesce(r.j->>key,''),'"','""') || '"', ',' order by key) from unnest((select ks from k)) key) l from r)
    select coalesce((select array_to_string(ks, ',') from k), '(table vide)') || coalesce(E'\n' || (select string_agg(l, E'\n' order by n) from c), '')
  $f$, tbl, filtre);
  execute q into res;
  return res;
end $function$;
