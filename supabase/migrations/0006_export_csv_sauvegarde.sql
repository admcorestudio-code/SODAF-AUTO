-- Export CSV d'une table (pour la sauvegarde hebdomadaire vers Google Drive). Schéma privé : non appelable depuis le site.
create or replace function prive.export_csv(tbl text, depuis date default null, jusqua date default null)
returns text language plpgsql stable security definer set search_path = '' as $$
declare res text; q text; filtre text := '';
begin
  if tbl not in ('eleves','paiements','creneaux_conduite','seances_code','presences','devoir_resultats','devoir_semaines','jours_feries','profils','reglages') then
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
end $$;
revoke all on function prive.export_csv(text, date, date) from public, anon, authenticated;
