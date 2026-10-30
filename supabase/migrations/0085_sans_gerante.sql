-- 0085 · Plus de gérante (30 oct. 2026, décision du propriétaire)
-- - Les demandes d'argent de l'équipe vont directement à la direction (plus de passerelle).
--   Prix inconnu : le secrétariat trouve lui-même le prix et le devis (demande_prix), la demande part alors chez la direction.
-- - Tâche « prix à trouver » : c'est la personne à qui la tâche est donnée qui trouve le prix (tache_prix).
-- - Le secrétariat reprend : rapport de la semaine, petits frais, vérification du gagnant du tirage, parrainage.
--   La direction seule tire le gagnant et annule un reçu.
-- - Agence : les jours où le secrétariat a cours, c'est la direction par défaut (avant : la gérante).
-- - Canal « Gérante ↔ Ambassadeur » → « Direction ↔ Ambassadeur ». Compte de la gérante désactivé (jamais supprimé).

-- 1. Demandes de dépense : directement chez la direction, sauf prix inconnu (le secrétariat le complète d'abord)
create or replace function prive.trg_depense_devis()
 returns trigger language plpgsql security definer set search_path to '' as $function$
begin
  if new.type = 'Dépense' and coalesce(new.nature, 'Autre') <> 'Carburant' and coalesce(new.devis, '') = ''
     and not (new.montant is null and prive.a_role(array['secretariat'])) then
    raise exception 'Ajoute le devis (photo ou PDF).';
  end if;
  new.facture := null; new.facture_le := null;
  if prive.a_role(array['secretariat', 'moniteur']) and new.montant is null and coalesce(new.nature, 'Autre') <> 'Carburant' then
    new.etape := 'equipe'; new.transmis_le := null; new.transmis_par := null;   -- prix à trouver par l'auteur
  elsif prive.a_role(array['secretariat', 'moniteur']) then
    new.etape := 'direction'; new.transmis_le := now(); new.transmis_par := auth.uid();
  else
    new.etape := 'direction'; new.transmis_le := null; new.transmis_par := null;
  end if;
  return new;
end $function$;

create or replace function public.demande_prix(p_id bigint, p_montant integer, p_devis text)
 returns void language plpgsql security definer set search_path to '' as $function$
declare d public.demandes;
begin
  if p_montant is null or p_montant <= 0 then raise exception 'Écris le montant.'; end if;
  select * into d from public.demandes where id = p_id for update;
  if not found or d.etape <> 'equipe' or d.statut <> 'attente' then raise exception 'demande introuvable ou déjà traitée'; end if;
  if not (prive.a_role(array['admin', 'gerant']) or (prive.a_role(array['secretariat', 'moniteur']) and d.auteur = auth.uid())) then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if nullif(trim(coalesce(p_devis, '')), '') is null and coalesce(d.devis, '') = '' then raise exception 'Ajoute le devis (photo ou PDF).'; end if;
  if p_devis is not null and p_devis not like 'devis/%' then raise exception 'pièce invalide'; end if;
  update public.demandes set montant = p_montant, devis = coalesce(nullif(trim(p_devis), ''), devis),
         etape = 'direction', transmis_le = now(), transmis_par = auth.uid()
   where id = p_id;
  perform prive.notifier(jsonb_build_object('type', 'demande', 'id', p_id));
end $function$;

-- Demandes encore « chez la gérante » avec un montant : elles passent chez la direction
update public.demandes set etape = 'direction', transmis_le = now()
 where etape = 'equipe' and statut = 'attente' and (montant is not null or nature = 'Carburant');

-- 2. Tâche « prix à trouver » : la personne à qui on l'a donnée trouve le prix
create or replace function public.tache_prix(p_id bigint, p_montant integer, p_devis text)
 returns void language plpgsql security definer set search_path to '' as $function$
begin
  if not (prive.a_role(array['gerant', 'admin']) or exists (select 1 from public.taches where id = p_id and pour = auth.uid())) then
    raise exception 'accès refusé' using errcode = '42501';
  end if;
  if p_montant is null or p_montant <= 0 then raise exception 'Écris le montant.'; end if;
  if coalesce(p_devis, '') = '' then raise exception 'Ajoute le devis ou une photo du prix.'; end if;
  if p_devis not like 'taches/%' then raise exception 'pièce invalide'; end if;
  update public.taches set montant = p_montant, devis = p_devis, etape = 'accord', prix_le = now(), prix_par = auth.uid()
   where id = p_id and etape = 'prix';
  if not found then raise exception 'tâche introuvable ou prix déjà trouvé'; end if;
  perform prive.tache_notif(p_id, 'accord');
end $function$;

-- Tâches encore ouvertes au nom de la gérante (sauf argent déjà envoyé sur son numéro) : au secrétariat
update public.taches set pour = (select id from public.profils where role = 'secretariat' and actif order by nom limit 1)
 where pour in (select id from public.profils where role = 'gerant')
   and etape in ('prix', 'afaire') and not (etape = 'afaire' and argent and paye_montant is not null)
   and exists (select 1 from public.profils where role = 'secretariat' and actif);

-- 3. Secrétariat : petits frais, rapport, chiffres de l'Ambassadeur
alter policy "frais : lire" on public.frais using (prive.a_role(array['admin', 'gerant', 'secretariat']));
alter policy "frais : noter" on public.frais with check (prive.a_role(array['admin', 'gerant', 'secretariat']) and auteur = auth.uid() and jour >= current_date - 31 and jour <= current_date);

alter policy "gérance : lire rapports" on public.rapports using (prive.a_role(array['admin', 'gerant', 'secretariat']));
alter policy "gérance : envoyer le rapport" on public.rapports with check (prive.a_role(array['admin', 'gerant', 'secretariat']) and auteur = auth.uid() and lu_le is null and semaine + 5 <= current_date);

alter policy "com : lire" on public.com_actions using (prive.a_role(array['admin', 'gerant', 'secretariat', 'ambassadeur']));

-- Dépenses accordées de la semaine (pour le rapport du secrétariat, qui ne lit que ses propres demandes)
create or replace function public.rapport_depenses(p_debut date, p_fin date)
 returns integer language sql stable security definer set search_path to '' as $function$
  select case when prive.a_role(array['admin', 'gerant', 'secretariat']) then
    coalesce((select sum(montant) from public.demandes where type = 'Dépense' and statut = 'accordee' and coalesce(nature, '') <> 'Carburant'
               and le >= p_debut and le < p_fin + 1), 0)::integer end
$function$;

-- 4. Tirage : le secrétariat vérifie la carte du gagnant (la direction tire)
create or replace function public.tirage_decider(p_id bigint, p_valide boolean, p_note text)
 returns void language plpgsql security definer set search_path to '' as $function$
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  update public.tirage_participants set statut = case when p_valide then 'valide' else 'refuse' end, decide_le = now(), note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_id and statut = 'gagnant';
  if not found then raise exception 'Ce participant n''est pas un gagnant en attente.'; end if;
end $function$;

create or replace function public.tirage_tirer(p_campagne text)
 returns bigint language plpgsql security definer set search_path to '' as $function$
declare g bigint;
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'Seule la direction tire le gagnant.' using errcode = '42501'; end if;
  if (select count(*) from public.tirage_participants where campagne = p_campagne and statut = 'valide') >= 2 then raise exception 'Les 2 gagnants de ce mois sont déjà validés.'; end if;
  select id into g from public.tirage_participants where campagne = p_campagne and statut = 'inscrit' order by random() limit 1 for update skip locked;
  if g is null then raise exception 'Plus aucun participant à tirer pour ce mois.'; end if;
  update public.tirage_participants set statut = 'gagnant', tire_le = now(), tire_par = auth.uid() where id = g;
  return g;
end $function$;

-- 5. Parrainage : le secrétariat paie la commission (il gère les espèces)
create or replace function public.commission_payer(p_id bigint, p_mode text, p_reference text)
 returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  update commissions set statut = 'payee', paye_le = now(), paye_par = auth.uid(), mode = p_mode, reference = nullif(trim(coalesce(p_reference, '')), '')
   where id = p_id and statut = 'a_payer';
  if not found then raise exception 'Cette commission n''est plus à payer.'; end if;
end $function$;

-- 6. Reçus : la direction seule annule (textes)
create or replace function public.recu_annulation_decider(p_id bigint, p_ok boolean, p_note text)
 returns void language plpgsql security definer set search_path to '' as $function$
declare p public.paiements;
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'Seule la direction peut annuler un reçu.' using errcode = '42501'; end if;
  select * into p from public.paiements where id = p_id for update;
  if not found then raise exception 'reçu introuvable'; end if;
  if p.annule then raise exception 'Ce reçu est déjà annulé.'; end if;
  if p.annul_dem_le is null or (p.annul_refus_le is not null and p.annul_refus_le >= p.annul_dem_le) then raise exception 'Pas de demande en attente pour ce reçu.'; end if;
  if p_ok then
    update public.paiements set annule = true, annule_motif = p.annul_dem_motif, annule_le = now() where id = p_id;
  else
    update public.paiements set annul_refus_le = clock_timestamp(), annul_refus_motif = nullif(left(trim(coalesce(p_note, '')), 200), '') where id = p_id;
  end if;
  perform prive.notifier(jsonb_build_object('type', 'annulation_reponse', 'id', p_id));
end $function$;

create or replace function public.recu_annulation_demander(p_id bigint, p_motif text)
 returns void language plpgsql security definer set search_path to '' as $function$
declare p public.paiements; m text := trim(coalesce(p_motif, ''));
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if length(m) < 3 then raise exception 'Écris la raison.'; end if;
  select * into p from public.paiements where id = p_id for update;
  if not found then raise exception 'reçu introuvable'; end if;
  if p.annule then raise exception 'Ce reçu est déjà annulé.'; end if;
  if p.annul_dem_le is not null and (p.annul_refus_le is null or p.annul_refus_le < p.annul_dem_le) then raise exception 'Annulation déjà demandée : la direction doit répondre.'; end if;
  update public.paiements set annul_dem_motif = left(m, 200), annul_dem_le = clock_timestamp(), annul_dem_par = auth.uid() where id = p_id;
  perform prive.notifier(jsonb_build_object('type', 'annulation', 'id', p_id));
end $function$;

-- 7. Agence : les jours de cours du secrétariat, la direction par défaut
create or replace function public.agence_qui(d date)
 returns text language sql stable security definer set search_path to '' as $function$
  select coalesce((select qui from public.agence_jours where jour = d),
    case when extract(isodow from d) = 7 then 'ferme'
         when extract(isodow from d) in (3, 5) and prive.semaine_cours(d) then 'admin'
         else 'secretariat' end)
$function$;
create or replace function public.agence_regler(p_jour date, p_qui text, p_note text)
 returns void language plpgsql security definer set search_path to '' as $function$
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_jour is null or p_jour < current_date - 7 then raise exception 'Date incorrecte.'; end if;
  if p_qui is null then
    update public.agence_jours set qui = case when extract(isodow from p_jour) in (3, 5) and prive.semaine_cours(p_jour) then 'admin' when extract(isodow from p_jour) = 7 then 'ferme' else 'secretariat' end,
           note = 'Retour à la règle', par = auth.uid(), le = now() where jour = p_jour;
    return;
  end if;
  if p_qui not in ('secretariat', 'gerant', 'admin', 'ferme') then raise exception 'Choix inconnu.'; end if;
  insert into public.agence_jours (jour, qui, note, par) values (p_jour, p_qui, nullif(trim(coalesce(p_note, '')), ''), auth.uid())
  on conflict (jour) do update set qui = excluded.qui, note = excluded.note, par = excluded.par, le = now();
end $function$;
update public.agence_jours set qui = 'admin', le = now() where qui = 'gerant' and jour >= current_date;

-- 8. Messages : l'Ambassadeur parle directement à la direction ; l'ancienne conversation de la gérante reste lisible
update public.canaux set nom = 'Direction ↔ Ambassadeur', description = 'Privé entre la direction et l''Ambassadeur' where id = 'ambassadeur';
update public.canaux set nom = 'Ancienne gérante (archive)', description = 'Conversation gardée pour l''historique' where id = 'gerance';

-- 9. Rappels du rapport (samedi, dimanche, lundi) : au secrétariat
do $$
declare j record;
begin
  for j in select jobid, command from cron.job where jobname in ('sodaf-rapport-samedi', 'sodaf-rapport-dimanche', 'sodaf-rapport-lundi') loop
    perform cron.alter_job(j.jobid, command := replace(j.command, 'role = ''gerant'' and actif', 'role = ''secretariat'' and actif'));
  end loop;
end $$;

-- 10. Compte de la gérante : désactivé (déconnexion sous 5 minutes, plus aucune notification ; jamais supprimé)
update public.profils set actif = false where role = 'gerant';
