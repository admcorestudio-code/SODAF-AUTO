-- Étape « Dossier envoyé » : l'élève a reçu fiche, planning, prix et moyens de paiement ; il réfléchit avant de payer.
alter table public.eleves
  add column if not exists dossier_envoye_le timestamptz,
  add column if not exists dossier_relance_le timestamptz;

alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb
              and dossier_envoye_le is null and dossier_relance_le is null);

-- Réglages utilisés dans les messages (modifiables sans toucher au site)
insert into public.reglages(cle, valeur) values
  ('mixx_numero', ''),
  ('mixx_nom', ''),
  ('maps_lien', 'https://www.google.com/maps/search/?api=1&query=SODAF%20Auto-%C3%89cole%2C%20412%20Avenue%20Akei%2C%20Tokoin%20Tam%C3%A9%2C%20Lom%C3%A9')
on conflict (cle) do nothing;
