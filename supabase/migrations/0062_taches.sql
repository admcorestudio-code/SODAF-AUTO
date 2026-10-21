-- 0062 : onglet « À faire » (décisions du propriétaire, 21 octobre 2026)
-- Une tâche vient de trois endroits :
--   1. une demande de dépense ACCORDÉE devient toute seule une tâche (pour la personne qui l'a demandée) ;
--   2. la direction écrit une tâche (pour n'importe qui), avec ou sans argent ; si elle ne connaît pas le prix,
--      la gérante le cherche (montant + devis), puis la direction accorde ou refuse ;
--   3. la gérante donne une tâche sans argent au secrétariat, au moniteur ou à l'Ambassadeur.
-- Argent : la direction envoie depuis le compte marchand Mixx, puis « Paiement effectué » avec le reçu Mixx joint.
-- La personne ouvre le reçu et touche « Activer » (j'ai bien reçu) ou « Pas reçu ». Après l'achat : facture, puis « Fait ».
-- Étapes : prix → accord → payer → envoye → afaire → fait (ou refusee / annulee). Rien ne se supprime.

create table if not exists public.taches (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  par uuid not null references public.profils(id),
  pour uuid not null references public.profils(id),
  titre text not null check (length(titre) between 3 and 600),
  pour_le date,
  argent boolean not null default false,
  carburant boolean not null default false,
  etape text not null check (etape in ('prix', 'accord', 'payer', 'envoye', 'afaire', 'fait', 'refusee', 'annulee')),
  montant integer check (montant is null or montant > 0),
  devis text check (length(devis) <= 300),
  demande_id bigint unique references public.demandes(id),
  com_tache_id bigint unique references public.com_taches(id),
  prix_le timestamptz, prix_par uuid references public.profils(id),
  accord_le timestamptz, accord_par uuid references public.profils(id), accord_note text check (length(accord_note) <= 300),
  paye_le timestamptz, paye_par uuid references public.profils(id),
  paye_moyen text check (paye_moyen in ('Mixx', 'Moov Money', 'Espèces', 'Autre')),
  paye_montant integer check (paye_montant is null or paye_montant > 0),
  paye_ref text check (length(paye_ref) <= 80),
  paye_recu text check (length(paye_recu) <= 300),
  active_le timestamptz,
  pas_recu_le timestamptz, pas_recu_note text check (length(pas_recu_note) <= 300),
  relance_le timestamptz,
  facture text check (length(facture) <= 300), facture_le timestamptz,
  fait_le timestamptz, fait_par uuid references public.profils(id), fait_note text check (length(fait_note) <= 300),
  annule_le timestamptz, annule_par uuid references public.profils(id)
);
create index if not exists taches_pour_idx on public.taches (pour, etape);
create index if not exists taches_etape_idx on public.taches (etape);
alter table public.taches enable row level security;

-- Lecture : la direction et la gérante voient tout ; les autres, ce qu'on leur a donné et ce qu'ils ont donné.
-- Aucune écriture directe : tout passe par les fonctions ci-dessous (droits et étapes contrôlés).
drop policy if exists "tâches : lire" on public.taches;
create policy "tâches : lire" on public.taches for select to authenticated
  using (prive.a_role(array['admin', 'gerant']) or (prive.est_membre() and (pour = auth.uid() or par = auth.uid())));

-- Notification d'une tâche (quoi : nouvelle, prix, accord, refus, argent, pas_recu, faite, relance)
create or replace function prive.tache_notif(p_id bigint, p_quoi text)
returns void language sql security definer set search_path = '' as $$
  select prive.notifier(jsonb_build_object('type', 'tache', 'id', p_id, 'quoi', p_quoi))
$$;

-- 1. Créer une tâche (direction : pour tous, avec ou sans argent ; gérante : sans argent, pour l'équipe)
create or replace function public.tache_creer(p_pour uuid, p_titre text, p_pour_le date, p_argent boolean, p_montant integer)
returns bigint language plpgsql security definer set search_path = '' as $$
declare r text; v_id bigint; v_etape text; v_titre text := trim(coalesce(p_titre, ''));
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la direction et à la gérante' using errcode = '42501'; end if;
  if length(v_titre) < 3 then raise exception 'Écris la tâche.'; end if;
  select role into r from public.profils where id = p_pour and actif;
  if r is null then raise exception 'Choisis pour qui.'; end if;
  if prive.a_role(array['gerant']) then
    if coalesce(p_argent, false) then raise exception 'Une tâche qui coûte de l''argent : passe par « Proposer un achat ».'; end if;
    if r not in ('gerant', 'secretariat', 'moniteur', 'ambassadeur') then raise exception 'La gérante donne des tâches au secrétariat, au moniteur et à l''Ambassadeur.'; end if;
  end if;
  if coalesce(p_argent, false) and p_pour = auth.uid() then raise exception 'Une tâche avec de l''argent se donne à quelqu''un de l''équipe.'; end if;
  if p_montant is not null and p_montant <= 0 then raise exception 'Montant invalide.'; end if;
  v_etape := case when not coalesce(p_argent, false) then 'afaire' when p_montant is null then 'prix' else 'payer' end;
  insert into public.taches (par, pour, titre, pour_le, argent, etape, montant, accord_le, accord_par)
  values (auth.uid(), p_pour, v_titre, p_pour_le, coalesce(p_argent, false), v_etape,
          case when coalesce(p_argent, false) then p_montant end,
          case when v_etape = 'payer' then now() end, case when v_etape = 'payer' then auth.uid() end)
  returning id into v_id;
  if v_etape = 'prix' then perform prive.tache_notif(v_id, 'prix');
  elsif p_pour <> auth.uid() then perform prive.tache_notif(v_id, 'nouvelle'); end if;
  return v_id;
end $$;

-- 2. La gérante a trouvé le prix (montant + devis ou ticket) → la direction accorde ou refuse
create or replace function public.tache_prix(p_id bigint, p_montant integer, p_devis text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['gerant', 'admin']) then raise exception 'réservé à la gérante' using errcode = '42501'; end if;
  if p_montant is null or p_montant <= 0 then raise exception 'Écris le montant.'; end if;
  if coalesce(p_devis, '') = '' then raise exception 'Ajoute le devis ou une photo du prix.'; end if;
  if p_devis not like 'taches/%' then raise exception 'pièce invalide'; end if;
  update public.taches set montant = p_montant, devis = p_devis, etape = 'accord', prix_le = now(), prix_par = auth.uid()
   where id = p_id and etape = 'prix';
  if not found then raise exception 'tâche introuvable ou prix déjà trouvé'; end if;
  perform prive.tache_notif(p_id, 'accord');
end $$;

-- 3. La direction accorde (→ argent à envoyer) ou refuse
create or replace function public.tache_accord(p_id bigint, p_ok boolean, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  update public.taches set etape = case when p_ok then 'payer' else 'refusee' end, accord_le = now(), accord_par = auth.uid(),
         accord_note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_id and etape = 'accord';
  if not found then raise exception 'tâche introuvable ou déjà traitée'; end if;
  if not p_ok then perform prive.tache_notif(p_id, 'refus'); end if;
end $$;

-- 4. Paiement effectué (direction) : moyen, montant, référence, reçu Mixx (obligatoire sauf espèces)
--    Aussi possible pour renvoyer l'argent après un « Pas reçu ».
create or replace function public.tache_payer(p_id bigint, p_moyen text, p_montant integer, p_ref text, p_recu text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_moyen not in ('Mixx', 'Moov Money', 'Espèces', 'Autre') then raise exception 'Choisis le moyen de paiement.'; end if;
  if p_montant is null or p_montant <= 0 then raise exception 'Écris le montant envoyé.'; end if;
  if p_moyen <> 'Espèces' and coalesce(p_recu, '') = '' then raise exception 'Joins le reçu du paiement.'; end if;
  if p_recu is not null and p_recu not like 'taches/%' then raise exception 'pièce invalide'; end if;
  update public.taches set etape = 'envoye', paye_le = now(), paye_par = auth.uid(), paye_moyen = p_moyen, paye_montant = p_montant,
         paye_ref = nullif(trim(coalesce(p_ref, '')), ''), paye_recu = nullif(p_recu, ''),
         pas_recu_le = null, pas_recu_note = null, relance_le = null
   where id = p_id and argent and (etape = 'payer' or (etape = 'envoye' and pas_recu_le is not null));
  if not found then raise exception 'tâche introuvable ou déjà payée'; end if;
  perform prive.tache_notif(p_id, 'argent');
end $$;

-- 5. La personne a bien reçu l'argent : elle active la tâche
create or replace function public.tache_activer(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.est_membre() then raise exception 'accès refusé' using errcode = '42501'; end if;
  update public.taches set etape = 'afaire', active_le = now(), pas_recu_le = null, pas_recu_note = null
   where id = p_id and etape = 'envoye' and pour = auth.uid();
  if not found then raise exception 'tâche introuvable ou déjà activée'; end if;
end $$;

-- 6. Rien n'est arrivé : la direction est prévenue
create or replace function public.tache_pas_recu(p_id bigint, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.est_membre() then raise exception 'accès refusé' using errcode = '42501'; end if;
  update public.taches set pas_recu_le = now(), pas_recu_note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_id and etape = 'envoye' and pour = auth.uid();
  if not found then raise exception 'tâche introuvable'; end if;
  perform prive.tache_notif(p_id, 'pas_recu');
end $$;

-- 7. Facture ou ticket après l'achat (aussi recopiée sur la demande de dépense d'origine)
create or replace function public.tache_facture(p_id bigint, p_chemin text)
returns void language plpgsql security definer set search_path = '' as $$
declare d bigint;
begin
  if coalesce(p_chemin, '') = '' or p_chemin not like 'taches/%' then raise exception 'Fichier manquant'; end if;
  update public.taches set facture = p_chemin, facture_le = now()
   where id = p_id and argent and etape in ('afaire', 'fait')
     and (pour = auth.uid() or prive.a_role(array['admin', 'gerant'])) and prive.est_membre()
  returning demande_id into d;
  if not found then raise exception 'tâche introuvable ou argent pas encore reçu'; end if;
  if d is not null then update public.demandes set facture = p_chemin, facture_le = now() where id = d; end if;
end $$;

-- 8. Fait (facture obligatoire quand il y a eu de l'argent, sauf essence)
create or replace function public.tache_faite(p_id bigint, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.taches;
begin
  select * into t from public.taches where id = p_id for update;
  if not found or t.etape <> 'afaire' then raise exception 'tâche introuvable ou pas encore à faire'; end if;
  if not ((t.pour = auth.uid() and prive.est_membre()) or prive.a_role(array['admin', 'gerant'])) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if t.argent and not t.carburant and t.facture is null then raise exception 'Ajoute d''abord la facture ou le ticket.'; end if;
  update public.taches set etape = 'fait', fait_le = now(), fait_par = auth.uid(), fait_note = nullif(trim(coalesce(p_note, '')), '') where id = p_id;
  if t.par <> auth.uid() then perform prive.tache_notif(p_id, 'faite'); end if;
end $$;

-- 9. Annuler (celui qui a donné la tâche, ou la direction), tant que l'argent n'est pas parti
create or replace function public.tache_annuler(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.taches set etape = 'annulee', annule_le = now(), annule_par = auth.uid()
   where id = p_id and (etape in ('prix', 'accord', 'payer') or (etape = 'afaire' and not argent))
     and ((par = auth.uid() and prive.a_role(array['admin', 'gerant'])) or prive.a_role(array['admin']));
  if not found then raise exception 'Impossible d''annuler : argent déjà envoyé, tâche finie, ou pas ta tâche.'; end if;
end $$;

do $$
declare f text;
begin
  foreach f in array array['tache_creer(uuid, text, date, boolean, integer)', 'tache_prix(bigint, integer, text)', 'tache_accord(bigint, boolean, text)',
                           'tache_payer(bigint, text, integer, text, text)', 'tache_activer(bigint)', 'tache_pas_recu(bigint, text)',
                           'tache_facture(bigint, text)', 'tache_faite(bigint, text)', 'tache_annuler(bigint)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;
revoke all on function prive.tache_notif(bigint, text) from public, anon, authenticated;

-- 10. Demande de dépense accordée → tâche « argent à envoyer » pour la personne qui a demandé
--     (si la direction a fait la demande elle-même : pour la gérante)
create or replace function prive.trg_demande_tache()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_pour uuid := new.auteur;
begin
  if new.type = 'Dépense' and new.statut = 'accordee' and old.statut is distinct from 'accordee' then
    if exists (select 1 from public.profils where id = new.auteur and role = 'admin') then
      v_pour := coalesce((select id from public.profils where role = 'gerant' and actif order by nom limit 1), new.auteur);
    end if;
    insert into public.taches (par, pour, titre, argent, carburant, etape, montant, devis, demande_id, accord_le, accord_par, accord_note)
    values (coalesce(new.repondu_par, new.auteur), v_pour,
            left(case when new.nature = 'Carburant' then 'Essence en plus : ' else '' end || new.texte, 600),
            true, new.nature = 'Carburant', 'payer', new.montant, new.devis, new.id, coalesce(new.repondu_le, now()), new.repondu_par, new.reponse)
    on conflict (demande_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists demande_tache on public.demandes;
create trigger demande_tache after update of statut on public.demandes for each row execute function prive.trg_demande_tache();

-- Facture ajoutée depuis l'ancienne carte de la demande → recopiée sur la tâche
create or replace function prive.trg_demande_facture_tache()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.facture is distinct from old.facture and new.facture is not null then
    update public.taches set facture = new.facture, facture_le = coalesce(new.facture_le, now())
     where demande_id = new.id and facture is distinct from new.facture;
  end if;
  return new;
end $$;
drop trigger if exists demande_facture_tache on public.demandes;
create trigger demande_facture_tache after update of facture on public.demandes for each row execute function prive.trg_demande_facture_tache();

-- 11. Argent envoyé mais pas activé après 24 h : rappel (une fois) à la personne et à la direction
create or replace function prive.taches_relance()
returns void language sql security definer set search_path = '' as $$
  with u as (update public.taches set relance_le = now()
              where etape = 'envoye' and pas_recu_le is null and relance_le is null and paye_le < now() - interval '24 hours'
             returning id)
  select prive.tache_notif(id, 'relance') from u
$$;
select cron.unschedule('sodaf-taches-relance') where exists (select 1 from cron.job where jobname = 'sodaf-taches-relance');
select cron.schedule('sodaf-taches-relance', '17 * * * *', $c$ select prive.taches_relance() $c$);

-- 12. Pièces des tâches (reçu Mixx, prix, facture) : dossier « taches » de l'espace privé « depenses »
drop policy if exists "tâches : ajouter une pièce" on storage.objects;
create policy "tâches : ajouter une pièce" on storage.objects for insert to authenticated
  with check (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'taches' and prive.est_membre());
drop policy if exists "tâches : voir ses pièces" on storage.objects;
create policy "tâches : voir ses pièces" on storage.objects for select to authenticated
  using (bucket_id = 'depenses' and prive.est_membre() and exists (
    select 1 from public.taches t where (t.pour = auth.uid() or t.par = auth.uid())
       and (t.paye_recu = storage.objects.name or t.facture = storage.objects.name or t.devis = storage.objects.name)));

-- 13. Les tâches de l'Ambassadeur (Communication) rejoignent « À faire » (l'ancienne table reste, rien ne s'efface)
insert into public.taches (le, par, pour, titre, pour_le, etape, fait_le, fait_par, com_tache_id)
select c.le, c.par, a.id, c.texte, c.pour_le, case when c.fait_le is null then 'afaire' else 'fait' end, c.fait_le, c.fait_par, c.id
  from public.com_taches c
  cross join lateral (select id from public.profils where role = 'ambassadeur' and actif order by nom limit 1) a
 where not exists (select 1 from public.taches t where t.com_tache_id = c.id);

-- 14. Sauvegarde du dimanche : ajouter la table taches
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''taches''' in d) = 0 and position('''rapports''' in d) > 0 then
    d := replace(d, '''rapports''', '''rapports'',''taches''');
    execute d;
  end if;
end $$;
