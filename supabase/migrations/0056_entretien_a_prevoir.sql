-- SODAF · 18 octobre 2026 · Entretiens à prévoir : la mécanicienne est prévenue avant le samedi.
-- 1. Numéro WhatsApp de la mécanicienne (réglage meca_tel), enregistré par le secrétariat, la gérante ou la direction.
-- 2. Calcul des entretiens à prévoir (même règle que l'écran : moins de 600 km ou 8 jours, ou dépassé).
-- 3. Jeudi 9 h (Lomé) : notification au secrétariat et à la gérante s'il y a quelque chose à prévoir.
-- Idempotent.

create or replace function public.meca_tel_regler(p_tel text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare t text := regexp_replace(coalesce(p_tel, ''), '\D', '', 'g');
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  t := regexp_replace(t, '^228', '');
  if length(t) <> 8 then raise exception 'numéro : 8 chiffres'; end if;
  insert into public.reglages (cle, valeur) values ('meca_tel', '+228' || t)
  on conflict (cle) do update set valeur = excluded.valeur;
end $$;
revoke all on function public.meca_tel_regler(text) from public, anon;
grant execute on function public.meca_tel_regler(text) to authenticated;

create or replace function prive.entretiens_a_prevoir()
returns jsonb language sql stable security definer set search_path = '' as $$
  with km as (
    select greatest(coalesce((select max(km) from public.carburant), 0), coalesce((select max(km) from public.entretiens), 0)) v
  ), regles(type, n, unite) as (
    values ('Vidange + filtre', 5000, 'km'), ('Filtre à air', 10000, 'km'), ('Pneus (permutation)', 10000, 'km'), ('Bougies', 20000, 'km'),
           ('Contrôle du mois', 31, 'j'), ('Liquides (frein, refroidissement)', 730, 'j')
  ), der as (
    select r.type, r.n, r.unite,
           (select e.km from public.entretiens e where e.type = r.type and e.km is not null order by e.jour desc, e.le desc limit 1) dkm,
           (select e.jour from public.entretiens e where e.type = r.type order by e.jour desc, e.le desc limit 1) djour
      from regles r
  ), calc as (
    select type,
           case when unite = 'km' and dkm is not null and (select v from km) > 0 then dkm + n - (select v from km) end reste_km,
           case when unite = 'j' and djour is not null then (djour + n) - current_date end reste_j
      from der
  )
  select coalesce(jsonb_agg(jsonb_build_object('type', type,
           'texte', case when reste_km is not null then (case when reste_km < 0 then 'dépassé de ' || -reste_km || ' km' else 'dans ' || reste_km || ' km' end)
                         else (case when reste_j < 0 then 'en retard de ' || -reste_j || ' j' when reste_j = 0 then 'aujourd''hui' else 'dans ' || reste_j || ' j' end) end)
         order by coalesce(reste_km / 75, reste_j)), '[]'::jsonb)
    from calc
   where (reste_km is not null and reste_km < 600) or (reste_j is not null and reste_j <= 8)
$$;

do $$ begin perform cron.unschedule('sodaf-entretien-jeudi'); exception when others then null; end $$;
select cron.schedule('sodaf-entretien-jeudi', '0 9 * * 4', $c$
  select prive.notifier(jsonb_build_object('type', 'entretien', 'liste', prive.entretiens_a_prevoir()))
   where jsonb_array_length(prive.entretiens_a_prevoir()) > 0
$c$);
