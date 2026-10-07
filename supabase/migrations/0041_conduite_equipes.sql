-- 0041 · Conduite en groupe de 4 (version retenue le 6 octobre 2026) et nouvelle grille de prix
-- Un seul moniteur, une voiture, 8 équipes de 4 élèves, blocs de 2 h :
--   lundi et jeudi : équipes 1 (6 h 30), 2 (8 h 45), 3 (15 h 45)
--   mardi et vendredi : équipes 4 (6 h 30), 5 (8 h 45), 6 (15 h 45)
--   mercredi et samedi : équipes 7 (6 h 30), 8 (8 h 45)
--   mercredi 15 h 45 : « Rattrapage et séances en plus », 4 places (réservé aux rattrapages jusqu'au mardi 18 h)
-- Chaque bloc = 4 lignes dans creneaux_conduite (une par place). Un élève placé dans une équipe reçoit ses blocs
-- à sa place, 2 par semaine, jusqu'au nombre prévu par sa formule (12 pour la formation complète).
-- Absence prévenue (« Absent ») : le bloc est rendu, rattrapage le mercredi. « Absent sans prévenir » : le bloc est perdu.
-- Nouveau groupe de code E (mercredi et samedi, 11 h), fermé au départ comme D : il s'ouvre depuis l'outil.
-- Rien n'est supprimé : les anciens créneaux d'1 h à venir passent en « Annulé ».

-- 1. Les équipes
create table if not exists public.equipes_conduite (
  id smallint primary key check (id between 1 and 20),
  nom text not null check (length(nom) <= 40),
  jours smallint[] not null check (array_length(jours, 1) between 1 and 3),
  heure text not null check (heure in ('6 h 30', '8 h 45', '15 h 45')),
  places smallint not null default 4 check (places between 1 and 6),
  actif boolean not null default true,
  ordre smallint not null default 0
);
alter table public.equipes_conduite enable row level security;
create policy "équipe : lire" on public.equipes_conduite for select to authenticated using (prive.est_equipe());
-- Pas d'écriture directe.
insert into public.equipes_conduite (id, nom, jours, heure, places, actif, ordre) values
  (1, 'Équipe 1', '{1,4}', '6 h 30', 4, true, 1), (2, 'Équipe 2', '{1,4}', '8 h 45', 4, true, 2), (3, 'Équipe 3', '{1,4}', '15 h 45', 4, true, 3),
  (4, 'Équipe 4', '{2,5}', '6 h 30', 4, true, 4), (5, 'Équipe 5', '{2,5}', '8 h 45', 4, true, 5), (6, 'Équipe 6', '{2,5}', '15 h 45', 4, true, 6),
  (7, 'Équipe 7', '{3,6}', '6 h 30', 4, true, 7), (8, 'Équipe 8', '{3,6}', '8 h 45', 4, true, 8)
on conflict (id) do nothing;

-- 2. Les blocs : équipe, place (1 à 4), type de bloc ; nouveau statut « Absent sans prévenir »
alter table public.creneaux_conduite
  add column if not exists equipe smallint references public.equipes_conduite(id),
  add column if not exists place smallint check (place between 1 and 6),
  add column if not exists bloc text check (bloc in ('equipe', 'mercredi'));
alter table public.creneaux_conduite drop constraint if exists creneaux_conduite_jour_heure_key;
alter table public.creneaux_conduite drop constraint if exists creneaux_conduite_jour_heure_place_key;
alter table public.creneaux_conduite add constraint creneaux_conduite_jour_heure_place_key unique nulls not distinct (jour, heure, place);
alter table public.creneaux_conduite drop constraint if exists creneaux_conduite_statut_check;
alter table public.creneaux_conduite add constraint creneaux_conduite_statut_check
  check (statut in ('Libre', 'Réservé', 'Fait', 'Absent', 'Absent sans prévenir', 'Annulé'));
create index if not exists creneaux_conduite_equipe_idx on public.creneaux_conduite (equipe, place, jour);

-- 3. Fiche élève : son équipe et sa place
alter table public.eleves
  add column if not exists equipe smallint references public.equipes_conduite(id),
  add column if not exists equipe_place smallint check (equipe_place between 1 and 6),
  add column if not exists equipe_depuis timestamptz;
alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb
              and dossier_envoye_le is null and dossier_relance_le is null and jeton is null
              and provenance is null and dernier_appel_le is null and dossier_relances = 0
              and examen_etape is null and examen_paye = false and examen_docs = '{}'::jsonb and examen_paiement is null
              and groupe_code is null and groupe_depuis is null and evaluation is null and evaluation_le is null
              and solde_rappels = 0 and solde_rappel_le is null and groupe_msg_le is null
              and photo is null and photo_le is null and photo_accord_le is null
              and equipe is null and equipe_place is null and equipe_depuis is null);

-- 4. Blocs prévus par formule (calculés depuis le reçu d'inscription)
--    complète, tarif étudiant 12 · gagnant du tirage 13 (une séance en plus offerte) · courte 6 · remise à niveau 4 · théorie seule 0
--    (anciennes formules gardées pour les anciens reçus) + 1 par séance en plus payée (5 000 F)
create or replace function prive.quota_conduite(p_eleve bigint)
returns int language sql stable security definer set search_path = '' as $$
  with ins as (
    select p.formation from public.paiements p
     where p.eleve_id = p_eleve and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
     order by p.cree_le desc limit 1),
  base as (
    select case
      when f ilike '%remise%' then 4
      when f ilike '%pack%' then 18
      when f ilike '%courte%' then 6
      when f ilike '%moto%' or f ilike 'permis a%' then 6
      when f ilike '%théorique%' then 0
      when f ilike '%tirage%' then 13
      when f ilike '%complète%' or f ilike '%accélérée%' then 12
      else null end as n
    from (select formation as f from ins) x)
  select case when (select n from base) is null then null
              else (select n from base) + coalesce((select sum(greatest(1, round(p.montant / 5000.0)))::int from public.paiements p
                     where p.eleve_id = p_eleve and coalesce(p.annule, false) = false and p.motif = 'Séance de conduite supplémentaire'), 0)
         end
$$;
revoke all on function prive.quota_conduite(bigint) from public;

-- Blocs déjà pris : faits, perdus (absent sans prévenir) ou réservés à venir
create or replace function prive.blocs_pris(e bigint, sauf bigint)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.creneaux_conduite c
   where c.eleve_id = e and c.id <> coalesce(sauf, 0)
     and (c.statut in ('Fait', 'Absent sans prévenir') or (c.statut = 'Réservé' and c.jour >= current_date))
$$;
revoke all on function prive.blocs_pris(bigint, bigint) from public;

-- 5. Réservation : formation soldée, blocs restants, et règle du mercredi 15 h 45
create or replace function prive.conduite_solde_ok()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r numeric; n int; q int;
begin
  if new.eleve_id is null or new.statut <> 'Réservé' then return new; end if;
  if tg_op = 'UPDATE' and new.eleve_id is not distinct from old.eleve_id then return new; end if;
  select count(*) into n from public.paiements p
   where p.eleve_id = new.eleve_id and coalesce(p.annule, false) = false and p.reste is not null;
  if n = 0 then
    raise exception 'Réservation impossible : aucun paiement de formation enregistré pour cet élève' using errcode = 'P0001';
  end if;
  select p.reste into r from public.paiements p
   where p.eleve_id = new.eleve_id and coalesce(p.annule, false) = false and p.reste is not null
   order by p.cree_le desc limit 1;
  if r > 0 then
    raise exception 'Réservation impossible : solde de formation non payé (% F)', r using errcode = 'P0001';
  end if;
  q := prive.quota_conduite(new.eleve_id);
  if q is not null and prive.blocs_pris(new.eleve_id, new.id) >= q then
    raise exception 'Réservation impossible : ses % blocs sont déjà faits ou réservés. Séance en plus : 5 000 F.', q using errcode = 'P0001';
  end if;
  if new.bloc = 'mercredi'
     and now() < (((new.jour - 1)::timestamp + time '18:00') at time zone 'Africa/Lome')
     and not exists (select 1 from public.creneaux_conduite c where c.eleve_id = new.eleve_id and c.statut = 'Absent') then
    raise exception 'Jusqu''au mardi 18 h, le mercredi 15 h 45 est réservé aux rattrapages (élèves absents qui ont prévenu).' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function prive.conduite_solde_ok() from public;

-- 6. Créer les blocs entre deux dates (4 places par bloc), sans toucher à ce qui existe
create or replace function prive.blocs_jours(de date, a date)
returns int language plpgsql security definer set search_path = public as $$
declare d date := de; dow int; t record; k int; n int := 0; m int;
begin
  while d <= a loop
    dow := extract(isodow from d);
    if dow < 7 and not exists (select 1 from jours_feries where jour = d) then
      for t in select * from equipes_conduite where actif and dow::smallint = any (jours) order by ordre loop
        for k in 1 .. t.places loop
          insert into creneaux_conduite (jour, heure, equipe, place, bloc) values (d, t.heure, t.id, k, 'equipe') on conflict do nothing;
          get diagnostics m = row_count; n := n + m;
        end loop;
      end loop;
      if dow = 3 then
        for k in 1 .. 4 loop
          insert into creneaux_conduite (jour, heure, equipe, place, bloc) values (d, '15 h 45', null, k, 'mercredi') on conflict do nothing;
          get diagnostics m = row_count; n := n + m;
        end loop;
      end if;
    end if;
    d := d + 1;
  end loop;
  return n;
end $$;
revoke all on function prive.blocs_jours(date, date) from public;

-- 7. Réserver les blocs restants d'un élève placé (à sa place, dans son équipe, à partir de demain)
create or replace function prive.equipe_completer(e bigint)
returns int language plpgsql security definer set search_path = public as $$
declare el record; q int; manque int; r record; n int := 0;
begin
  select * into el from eleves where id = e;
  if el.equipe is null or el.equipe_place is null or el.statut not in ('Inscrit', 'En formation') then return 0; end if;
  q := coalesce(prive.quota_conduite(e), 12);
  manque := q - prive.blocs_pris(e, null);
  if manque <= 0 then return 0; end if;
  for r in select c.id from creneaux_conduite c
            where c.equipe = el.equipe and c.place = el.equipe_place and c.bloc = 'equipe'
              and c.statut = 'Libre' and c.eleve_id is null and c.jour > current_date
            order by c.jour limit manque for update skip locked loop
    update creneaux_conduite set eleve_id = e, statut = 'Réservé', confirme_le = null, rappel_le = null, modifie_le = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function prive.equipe_completer(bigint) from public;

-- 8. Placer un élève dans une équipe (secrétariat, gérante, direction)
--    On prend la place qui se libère le plus tôt ; ses anciens blocs à venir sont rendus.
create or replace function public.equipe_placer(p_eleve bigint, p_equipe smallint)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare t record; el record; s int; k int; d date; n int; f text;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  select * into t from equipes_conduite where id = p_equipe and actif for update;
  if not found then raise exception 'Équipe inconnue ou fermée.'; end if;
  select * into el from eleves where id = p_eleve for update;
  if not found then raise exception 'Élève introuvable.'; end if;
  if el.statut not in ('Inscrit', 'En formation') then raise exception 'Seul un élève inscrit ou en formation peut être placé en conduite.'; end if;
  s := prive.solde_eleve(p_eleve);
  if s is null then raise exception 'Aucun reçu de formation pour cet élève : fais d''abord son reçu.'; end if;
  if s > 0 then raise exception 'Formation pas encore soldée (reste % F) : la conduite commence après le solde.', s; end if;
  select formation into f from paiements where eleve_id = p_eleve and not annule and motif like 'Droit d''inscription%' order by cree_le desc limit 1;
  if f ilike '%étudiant%' and exists (
       select 1 from creneaux_conduite c join paiements p on p.eleve_id = c.eleve_id and not p.annule and p.motif like 'Droit d''inscription%' and p.formation ilike '%étudiant%'
        where c.equipe = p_equipe and c.statut = 'Réservé' and c.jour > current_date and c.eleve_id <> p_eleve) then
    raise exception 'Tarif étudiant : un seul étudiant par équipe. Choisis une autre équipe.';
  end if;
  -- Ses blocs d'équipe à venir sont rendus (changement d'équipe)
  update creneaux_conduite set eleve_id = null, statut = 'Libre', confirme_le = null, rappel_le = null, modifie_le = now()
   where eleve_id = p_eleve and bloc = 'equipe' and statut = 'Réservé' and jour > current_date;
  -- La place qui se libère le plus tôt
  select c.place, min(c.jour) into k, d from creneaux_conduite c
   where c.equipe = p_equipe and c.bloc = 'equipe' and c.statut = 'Libre' and c.eleve_id is null and c.jour > current_date
   group by c.place order by min(c.jour), c.place limit 1;
  if k is null then raise exception 'Cette équipe est complète sur le planning préparé. Choisis une autre équipe.'; end if;
  update eleves set equipe = p_equipe, equipe_place = k, equipe_depuis = now() where id = p_eleve;
  n := prive.equipe_completer(p_eleve);
  insert into suivi (eleve_id, type, note) values (p_eleve, 'Note', 'Placé en conduite : ' || t.nom || ', place ' || k || ' (' || n || ' blocs réservés à partir du ' || to_char(d, 'DD/MM') || ')');
  return jsonb_build_object('equipe', p_equipe, 'place', k, 'blocs', n, 'debut', d);
end $$;
revoke all on function public.equipe_placer(bigint, smallint) from public, anon;
grant execute on function public.equipe_placer(bigint, smallint) to authenticated;

-- 9. Retirer un élève de son équipe (abandon, fin, changement de planning) : ses blocs à venir sont rendus
create or replace function public.equipe_retirer(p_eleve bigint)
returns int language plpgsql volatile security definer set search_path = public as $$
declare n int; t text;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  select q.nom into t from eleves e join equipes_conduite q on q.id = e.equipe where e.id = p_eleve;
  update creneaux_conduite set eleve_id = null, statut = 'Libre', confirme_le = null, rappel_le = null, modifie_le = now()
   where eleve_id = p_eleve and bloc = 'equipe' and statut = 'Réservé' and jour > current_date;
  get diagnostics n = row_count;
  update eleves set equipe = null, equipe_place = null where id = p_eleve;
  insert into suivi (eleve_id, type, note) values (p_eleve, 'Note', 'Retiré de la conduite' || coalesce(' (' || t || ')', '') || ' : ' || n || ' blocs rendus');
  return n;
end $$;
revoke all on function public.equipe_retirer(bigint) from public, anon;
grant execute on function public.equipe_retirer(bigint) to authenticated;

-- 10. Préparation du mois : blocs d'équipe au lieu des créneaux d'1 h, puis blocs des élèves déjà placés
create or replace function prive.generer_mois(debut date)
returns text language plpgsql security definer set search_path = public as $function$
declare
  d date; fin date := (date_trunc('month', debut) + interval '1 month - 1 day')::date;
  dow int; nc int := 0; ns int := 0; nw int := 0; n int; g record; s int; e record; nb int := 0;
begin
  d := date_trunc('month', debut)::date;
  while d <= fin loop
    dow := extract(isodow from d);
    if dow = 1 then
      s := prive.semaine_boucle(d);
      insert into devoir_semaines (lundi, lettre, theme)
      values (d, case when s < 5 then chr(65 + 2 * s) end,
              prive.theme_cours(2 * s) || ' · ' || prive.theme_cours(2 * s + 1))
      on conflict do nothing;
      get diagnostics n = row_count; nw := nw + n;
    end if;
    if dow = 3 and d >= current_date and not exists (select 1 from jours_feries where jour = d) then
      insert into seances_code (jour, type, heure, groupe) values (d, 'Rattrapage et examen blanc', '14 h 30 – 15 h 30', null) on conflict do nothing;
      get diagnostics n = row_count; ns := ns + n;
    end if;
    d := d + 1;
  end loop;
  nc := prive.blocs_jours(greatest(date_trunc('month', debut)::date, current_date), fin);
  for g in select id from groupes_code where actif order by ordre loop
    ns := ns + prive.seances_groupe(g.id, greatest(date_trunc('month', debut)::date, current_date), fin);
  end loop;
  for e in select id from eleves where equipe is not null and statut in ('Inscrit', 'En formation') loop
    begin
      nb := nb + prive.equipe_completer(e.id);
    exception when others then null;  -- un élève qui doit encore payer ne bloque pas la préparation du mois
    end;
  end loop;
  return format('%s : %s places de conduite, %s séances de code, %s semaines, %s blocs d''élèves', to_char(debut, 'YYYY-MM'), nc, ns, nw, nb);
end $function$;

-- 11. Groupe de code E : mercredi et samedi, 11 h – 12 h (fermé au départ, s'ouvre depuis l'outil comme D)
insert into public.groupes_code (id, nom, jours, heure, places, actif, ordre)
values ('E', 'Groupe E (matin)', '{3,6}', '11 h – 12 h', 6, false, 5)
on conflict (id) do nothing;

-- 12. Réorganisation : les anciens créneaux d'1 h à venir passent en « Annulé » (rien n'est supprimé)
update public.creneaux_conduite
   set statut = 'Annulé', note = 'Réorganisation : conduite en groupe de 4', modifie_le = now()
 where bloc is null and jour >= current_date and statut in ('Libre', 'Réservé');

-- 13. Blocs d'équipe d'aujourd'hui à la fin du mois prochain
select prive.blocs_jours(current_date, (date_trunc('month', current_date) + interval '2 month - 1 day')::date);

-- 14. Sauvegarde : ajouter les équipes
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''equipes_conduite''' in d) = 0 then
    d := replace(d, '''tirage_participants''', '''tirage_participants'',''equipes_conduite''');
    execute d;
  end if;
end $$;
