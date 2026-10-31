-- 0093 · Tirage filmé à l'agence (31 oct. 2026) : pas de live (le compte TikTok n'a pas encore 1 000 abonnés).
-- L'Ambassadeur tire les 2 gagnants d'un coup devant la caméra ; le secrétariat vérifie les cartes ensuite ;
-- une carte pas valide → un gagnant de remplacement est tiré. Appliqué par Claude.
create or replace function public.tirage_tirer(p_campagne text)
 returns bigint language plpgsql security definer set search_path to '' as $function$
declare g bigint;
begin
  if not prive.a_role(array['admin', 'gerant', 'ambassadeur']) then raise exception 'Seuls la direction et l''Ambassadeur tirent le gagnant.' using errcode = '42501'; end if;
  if (select count(*) from public.tirage_participants where campagne = p_campagne and statut in ('valide', 'gagnant')) >= 2 then raise exception 'Les 2 gagnants de ce mois sont déjà tirés.'; end if;
  select id into g from public.tirage_participants where campagne = p_campagne and statut = 'inscrit' order by random() limit 1 for update skip locked;
  if g is null then raise exception 'Plus aucun participant à tirer pour ce mois.'; end if;
  update public.tirage_participants set statut = 'gagnant', tire_le = now(), tire_par = auth.uid() where id = g;
  return g;
end $function$;

-- Tirage le PREMIER SAMEDI du mois à 20 h (décision du 31 oct. 2026 ; premier : samedi 7 novembre 2026).
-- Campagne = mois du prochain tirage ; inscriptions ouvertes tous les jours sauf le jour du tirage.
create or replace function prive.tirage_jour(p_mois date)
 returns date language sql immutable set search_path to '' as $function$
  select (date_trunc('month', p_mois)::date + ((6 - extract(dow from date_trunc('month', p_mois))::int + 7) % 7))::date
$function$;
create or replace function prive.tirage_campagne()
 returns text language sql stable set search_path to '' as $function$
  with d as (select (now() at time zone 'Africa/Lome')::date as j)
  select to_char(case when j <= prive.tirage_jour(j) then j else (date_trunc('month', j) + interval '1 month')::date end, 'YYYY-MM') from d
$function$;
create or replace function prive.tirage_ouvert()
 returns boolean language sql stable set search_path to '' as $function$
  with d as (select (now() at time zone 'Africa/Lome')::date as j)
  select j <> prive.tirage_jour(j) from d
$function$;
-- tirage_participer : message « C'est le jour du tirage : les inscriptions rouvrent demain » (reste identique).
