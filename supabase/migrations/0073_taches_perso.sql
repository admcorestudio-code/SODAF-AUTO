-- 0073 : tâches personnelles (décision du propriétaire, 24 octobre 2026)
-- Une tâche qu'on se donne à soi-même (par = pour) n'est vue que par soi : ni la direction ni la gérante ne voient celles de l'autre.
drop policy if exists "tâches : lire" on public.taches;
create policy "tâches : lire" on public.taches for select to authenticated
  using (prive.est_membre() and (
    (par = pour and pour = auth.uid())
    or (par <> pour and (prive.a_role(array['admin', 'gerant']) or pour = auth.uid() or par = auth.uid()))
  ));
