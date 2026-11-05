-- 0098 (5 nov. 2026) : la Publicité (créations, affiches et vidéos publiées) est visible par toute l'équipe.
-- Le moniteur (et la gérante pour les fichiers) peuvent maintenant lire les publications notées et leurs fichiers.
-- Seuls les ambassadeurs notent une publication (inchangé).
alter policy "com : lire" on public.com_actions
  using (prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur', 'ambassadeur']));
alter policy "ambassadeurs : voir les captures" on storage.objects
  using (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'pub' and prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur', 'ambassadeur']));
