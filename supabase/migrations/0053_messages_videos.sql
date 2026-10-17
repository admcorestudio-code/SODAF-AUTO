-- SODAF · 17 octobre 2026 · Vidéos dans Messages (l'Ambassadeur fait valider ses vidéos par la gérante avant de publier)
-- Espace « messages » : vidéos acceptées (mp4, mov, webm, 3gp), 50 Mo au plus par fichier (l'application garde 10 Mo pour les autres fichiers).
update storage.buckets
   set file_size_limit = 52428800,
       allowed_mime_types = (select array_agg(distinct t) from unnest(coalesce(allowed_mime_types, '{}') || array['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp']) t)
 where id = 'messages';
