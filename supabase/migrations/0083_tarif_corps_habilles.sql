-- Tarif corps habillés (28 oct. 2026) : 50 000 F + 5 000 F d'inscription, même formation que la complète
-- (12 cours de code en salle, 12 séances de conduite de 2 h). Preuve : carte professionnelle + CNI.
-- Le nom contient « complète » : prive.quota_conduite donne déjà 12 séances, prive.conduite_solde_ok exige les cours 1 à 9 comme pour tous.
create or replace function prive.formule_prix(p_formule text)
 returns table(prix integer, ins integer)
 language sql immutable set search_path to ''
as $function$
  select x.p, x.i from (values ('Formation complète (permis B)', 55000, 5000), ('Formule rapide (permis B)', 35000, 5000),
    ('Formation complète, tarif étudiant (permis B)', 30000, 5000), ('Formation complète, corps habillés (permis B)', 50000, 5000),
    ('Formation complète, gagnant du tirage (permis B)', 15000, 0),
    ('Remise à niveau', 25000, 0), ('Formation privée (permis B)', 85000, 5000)) x(f, p, i) where x.f = p_formule
$function$;

-- Tâche de vérification envoyée à la gérante : rappeler aussi la carte professionnelle.
create or replace function public.inscription_correction_demander(p_id bigint, p_motif text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare w public.inscriptions_web; g uuid; t bigint; m text := trim(coalesce(p_motif, ''));
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if length(m) < 3 then raise exception 'Écris ce qui ne va pas (ex. il est étudiant).'; end if;
  select * into w from public.inscriptions_web where id = p_id for update;
  if not found or w.statut = 'Rejeté' then raise exception 'inscription introuvable'; end if;
  if exists (select 1 from public.paiements where eleve_id = w.eleve_id and not annule) then
    raise exception 'Un reçu est déjà fait : demande d''abord l''annulation du reçu à la gérante.';
  end if;
  if w.correction_demande_le is not null and w.corrige_le is null then raise exception 'Déjà signalé : la gérante vérifie.'; end if;
  select id into g from public.profils where role = 'gerant' and actif order by nom limit 1;
  if g is null then select id into g from public.profils where role = 'admin' and actif order by nom limit 1; end if;
  insert into public.taches (par, pour, titre, etape)
  values (auth.uid(), g, left('SO' || w.eleve_id || ' : vérifier la formule. Il a choisi « ' || replace(w.formule, ' (permis B)', '') || ' » sur son lien d''inscription. Le secrétariat signale : ' || m ||
          '. Appelle le client (carte d''étudiant à voir si tarif étudiant, carte professionnelle si corps habillés), puis fiche de l''élève → Corriger la formule.', 600), 'afaire')
  returning id into t;
  update public.inscriptions_web set correction_motif = m, correction_demande_le = now(), correction_demande_par = auth.uid(), correction_tache = t,
         corrige_le = null, corrige_par = null, correction_note = null
   where id = p_id;
  if g <> auth.uid() then perform prive.tache_notif(t, 'nouvelle'); end if;
end $function$;
