-- 0024 · Rappels de paiement du solde (2 rappels espacés de 7 jours, puis place au code suspendue)
alter table public.eleves
  add column if not exists solde_rappels smallint not null default 0 check (solde_rappels between 0 and 10),
  add column if not exists solde_rappel_le timestamptz;
alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb
              and dossier_envoye_le is null and dossier_relance_le is null and jeton is null
              and provenance is null and dernier_appel_le is null and dossier_relances = 0
              and examen_etape is null and examen_paye = false and examen_docs = '{}'::jsonb and examen_paiement is null
              and groupe_code is null and groupe_depuis is null and evaluation is null and evaluation_le is null
              and solde_rappels = 0 and solde_rappel_le is null);
