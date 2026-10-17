-- 0051 · « Formule courte » devient « Formule rapide » (17 oct. 2026)
-- Les nouveaux reçus s'appellent « Formule rapide (permis B) » : la base doit leur compter 6 blocs, comme les anciens reçus « Formule courte ».
-- Seule la fonction de comptage des blocs change. Rien n'est supprimé.
create or replace function prive.quota_conduite(p_eleve bigint)
returns int language sql stable security definer set search_path = '' as $$
  with ins as (
    select p.formation from public.paiements p
     where p.eleve_id = p_eleve and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
     order by p.cree_le desc limit 1),
  base as (
    select case
      when f ilike '%remise%' then 4
      when f ilike '%pack%' then 18
      when f ilike '%courte%' or f ilike '%rapide%' then 6
      when f ilike '%moto%' or f ilike 'permis a%' then 6
      when f ilike '%théorique%' then 0
      when f ilike '%tirage%' then 13
      when f ilike '%complète%' or f ilike '%accélérée%' then 12
      else null end as n
    from (select formation as f from ins) x)
  select case when (select n from base) is null then null
              else (select n from base) + coalesce((select sum(greatest(1, round(p.montant / 5000.0)))::int from public.paiements p
                     where p.eleve_id = p_eleve and coalesce(p.annule, false) = false and p.motif = 'Séance de conduite supplémentaire'), 0)
         end
$$;
