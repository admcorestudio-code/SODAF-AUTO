-- 0016 · Lien de reçu court (n° + code secret) et compteur de relances « Paiement en attente »
alter table public.paiements add column if not exists jeton text check (jeton ~ '^[A-Za-z0-9]{6,32}$');
alter table public.eleves add column if not exists dossier_relances smallint not null default 0 check (dossier_relances between 0 and 10);

alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb
              and dossier_envoye_le is null and dossier_relance_le is null and jeton is null
              and provenance is null and dernier_appel_le is null and dossier_relances = 0
              and examen_etape is null and examen_paye = false and examen_docs = '{}'::jsonb and examen_paiement is null);

-- Page publique du reçu : seulement avec le bon n° ET le bon code
create or replace function public.recu_info(p_no text, p_jeton text)
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'a', json_build_array(p.numero, to_char(p.cree_le at time zone 'Africa/Lome', 'YYYY-MM-DD"T"HH24:MI'), p.eleve_nom,
                          regexp_replace(regexp_replace(coalesce(p.telephone, ''), '\D', '', 'g'), '^228', ''),
                          coalesce(p.formation, ''), coalesce(p.prix, 0), p.motif, p.montant, p.mode, coalesce(p.reste, -1), coalesce(p.note, '')),
    'annule', p.annule)
  from public.paiements p
  where p.numero = p_no and p.jeton is not null and p.jeton = p_jeton
  limit 1
$$;
revoke all on function public.recu_info(text, text) from public;
grant execute on function public.recu_info(text, text) to anon, authenticated;
