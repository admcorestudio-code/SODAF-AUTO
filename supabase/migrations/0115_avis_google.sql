-- 0115 (7 nov. 2026) : demander un avis Google depuis la fiche de l'élève (bouton WhatsApp) ; avis_le = date de la demande.
alter table public.eleves add column if not exists avis_le timestamptz;
