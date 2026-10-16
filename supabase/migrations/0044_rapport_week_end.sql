-- 0044 : rapport de la semaine envoyé le week-end (16 octobre 2026)
-- Le rapport d'une semaine ne peut partir qu'à partir de son samedi (heure de Lomé = UTC).
-- Une semaine oubliée reste à envoyer ensuite, à tout moment (rapport en retard).

drop policy if exists "gérance : envoyer le rapport" on public.rapports;
create policy "gérance : envoyer le rapport" on public.rapports for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant']) and auteur = auth.uid() and lu_le is null
              and semaine + 5 <= current_date);

-- Samedi 9 h : le bouton s'ouvre, rappel à la gérante si le rapport de la semaine n'est pas parti
select cron.schedule('sodaf-rapport-samedi', '0 9 * * 6', $c$
  select prive.notifier(jsonb_build_object('type', 'rapport_rappel'))
   where exists (select 1 from public.profils where role = 'gerant' and actif)
     and not exists (select 1 from public.rapports where semaine = date_trunc('week', current_date)::date)
$c$);

-- Lundi 9 h : rappel si le rapport de la semaine passée n'a pas été envoyé (rapport en retard)
select cron.schedule('sodaf-rapport-lundi', '0 9 * * 1', $c$
  select prive.notifier(jsonb_build_object('type', 'rapport_rappel'))
   where exists (select 1 from public.profils where role = 'gerant' and actif)
     and (date_trunc('week', current_date)::date - 7) >= date '2026-10-12'
     and not exists (select 1 from public.rapports where semaine = date_trunc('week', current_date)::date - 7)
$c$);
