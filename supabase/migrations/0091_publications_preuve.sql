-- 0091 · Ambassadeurs : chacun publie ce qu'il crée, avec une preuve (31 oct. 2026). Appliqué par Claude.
-- Relations : affiches (statut WhatsApp, TikTok, Facebook / Instagram). Contenu : vidéos (statut, TikTok, Facebook / Instagram, pub payante Meta).
-- Preuve obligatoire : capture d'écran pour un statut WhatsApp, lien pour le reste. La direction voit chaque publication de la semaine.
alter table public.com_actions add column if not exists format text check (format is null or format in ('affiche', 'video')),
  add column if not exists capture text check (capture is null or capture like 'pub/%');
alter table public.com_actions add constraint com_actions_preuve check (format is null or (case when type = 'Statut WhatsApp' then capture is not null else lien is not null end));
create policy "ambassadeurs : capture" on storage.objects for insert to authenticated with check (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'pub' and prive.a_role(array['admin', 'ambassadeur']));
create policy "ambassadeurs : voir les captures" on storage.objects for select to authenticated using (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'pub' and prive.a_role(array['admin', 'ambassadeur', 'secretariat']));
