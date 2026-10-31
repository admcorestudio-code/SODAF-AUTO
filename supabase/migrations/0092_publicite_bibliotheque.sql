-- 0092 · Publicité (31 oct. 2026, décision du propriétaire). Appliqué par Claude.
-- Après validation de la direction (dans Messages) et publication sur TikTok, l'ambassadeur note la publication :
-- le fichier (affiche ou vidéo, rangé dans le stockage « messages », dossier ambassadeur/) + le lien TikTok. C'est tout.
-- Ces fichiers forment la bibliothèque « Publicité » (Documents et publicité → Affiches / Vidéos).
alter table public.com_actions add column if not exists fichier jsonb check (fichier is null or (fichier->>'path') like 'ambassadeur/%');
alter table public.com_actions drop constraint com_actions_preuve;
alter table public.com_actions add constraint com_actions_preuve check (format is null or capture is not null or (lien is not null and fichier is not null));
update public.canaux set nom = 'Direction ↔ Ambassadeurs', description = 'Privé entre la direction et les ambassadeurs' where id = 'ambassadeur';
