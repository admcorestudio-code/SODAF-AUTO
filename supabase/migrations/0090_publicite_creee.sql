-- 0090 · Ambassadeur Relations : il note seulement les publicités créées (affiche ou vidéo), sans lien (31 oct. 2026). Appliqué par Claude.
alter table public.com_actions drop constraint com_actions_type_check,
  add constraint com_actions_type_check check (type in ('TikTok', 'Statut WhatsApp', 'Atelier filmé', 'Live du tirage', 'Pub étudiants', 'Autre',
    'Sortie terrain', 'Affiches posées', 'Partage groupes WhatsApp', 'Facebook / Instagram', 'Pub payante', 'Publicité créée'));
