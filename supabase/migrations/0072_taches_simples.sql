-- 0072 : moins d'étapes pour l'argent (décision du propriétaire, 24 octobre 2026 : « trop de tâches pour valider un paiement »)
-- Avant : accorder (Gérance) → payer → la personne active → facture → Fait = jusqu'à 7 gestes.
-- Après : demande (avec devis) → la direction « accorde et paie » en un geste → la personne ajoute la facture = terminé.
--   • « Activer : j'ai reçu » n'est plus nécessaire (« Je n'ai rien reçu » reste possible) ;
--   • la facture vaut « Fait » (essence : un simple « Fait », pas de facture) ;
--   • le rappel part si la facture manque 3 jours après l'envoi de l'argent.

-- 1. Facture ou ticket = tâche terminée (possible dès que l'argent est parti)
create or replace function public.tache_facture(p_id bigint, p_chemin text)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.taches;
begin
  if coalesce(p_chemin, '') = '' or p_chemin not like 'taches/%' then raise exception 'Fichier manquant'; end if;
  select * into t from public.taches where id = p_id for update;
  if not found or not t.argent or t.etape not in ('envoye', 'afaire', 'fait') then raise exception 'tâche introuvable ou argent pas encore envoyé'; end if;
  if not ((t.pour = auth.uid() and prive.est_membre()) or prive.a_role(array['admin', 'gerant'])) then raise exception 'accès refusé' using errcode = '42501'; end if;
  update public.taches set facture = p_chemin, facture_le = now(), pas_recu_le = null, pas_recu_note = null,
         active_le = coalesce(active_le, now()),
         etape = 'fait', fait_le = coalesce(fait_le, now()), fait_par = coalesce(fait_par, auth.uid())
   where id = p_id;
  if t.demande_id is not null then update public.demandes set facture = p_chemin, facture_le = now() where id = t.demande_id; end if;
  if t.etape <> 'fait' and t.par <> auth.uid() then perform prive.tache_notif(p_id, 'faite'); end if;
end $$;

-- 2. Fait : sans argent, ou essence (pas de facture) ; aussi dès que l'argent est parti
create or replace function public.tache_faite(p_id bigint, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.taches;
begin
  select * into t from public.taches where id = p_id for update;
  if not found or t.etape not in ('afaire', 'envoye') or (t.etape = 'envoye' and not t.argent) then raise exception 'tâche introuvable ou pas encore à faire'; end if;
  if not ((t.pour = auth.uid() and prive.est_membre()) or prive.a_role(array['admin', 'gerant'])) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if t.argent and not t.carburant and t.facture is null then raise exception 'Ajoute la facture ou le ticket : c''est elle qui termine la tâche.'; end if;
  update public.taches set etape = 'fait', fait_le = now(), fait_par = auth.uid(), active_le = coalesce(active_le, now()),
         pas_recu_le = null, pas_recu_note = null, fait_note = nullif(trim(coalesce(p_note, '')), '') where id = p_id;
  if t.par <> auth.uid() then perform prive.tache_notif(p_id, 'faite'); end if;
end $$;

-- 3. Prix trouvé par la gérante : la direction accorde ET paie en un geste
create or replace function public.tache_accorder_payer(p_id bigint, p_note text, p_moyen text, p_montant integer, p_recu text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  perform public.tache_accord(p_id, true, p_note);
  perform public.tache_payer(p_id, p_moyen, p_montant, null, p_recu);
end $$;

-- 4. Demande de dépense de l'équipe : la direction accorde ET paie en un geste (ou accorde seulement)
create or replace function public.demande_accorder_payer(p_id bigint, p_note text, p_moyen text, p_montant integer, p_recu text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare t bigint;
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  perform public.demande_repondre(p_id, true, p_note);           -- crée la tâche (déclencheur demande_tache)
  select id into t from public.taches where demande_id = p_id;
  if t is not null and p_moyen is not null then perform public.tache_payer(t, p_moyen, p_montant, null, p_recu); end if;
  return t;
end $$;

do $$
declare f text;
begin
  foreach f in array array['tache_accorder_payer(bigint, text, text, integer, text)', 'demande_accorder_payer(bigint, text, text, integer, text)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;

-- 5. Rappel : facture toujours pas ajoutée 3 jours après l'envoi de l'argent (une fois)
create or replace function prive.taches_relance()
returns void language sql security definer set search_path = '' as $$
  with u as (update public.taches set relance_le = now()
              where etape in ('envoye', 'afaire') and argent and not carburant and facture is null and pas_recu_le is null
                and relance_le is null and paye_le < now() - interval '3 days'
             returning id)
  select prive.tache_notif(id, 'relance') from u
$$;
