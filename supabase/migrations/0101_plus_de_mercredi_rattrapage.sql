-- 0101 (5 nov. 2026) : plus de rattrapage le mercredi (décision du propriétaire).
-- Code : un cours manqué se rattrape dans un autre groupe la même semaine (code_rattrapage, inchangé) ;
--        les séances « Rattrapage et examen blanc » du mercredi sont annulées et ne sont plus créées.
-- Conduite : le mercredi 15 h 45 devient une séance normale (équipe 9) ; un bloc manqué se rattrape
--        n'importe quel jour où il reste une place (gratuit) ; au 4e rendez-vous manqué, blocage (inchangé).
-- Rien n'est supprimé : les séances passées restent, les futures passent à « Annulé » ou changent de bloc.

insert into public.equipes_conduite (id, nom, jours, heure, places, actif, ordre)
values (9, 'Équipe 9', array[3]::smallint[], '15 h 45', 4, true, 9)
on conflict (id) do nothing;

update public.creneaux_conduite set bloc = 'equipe', equipe = 9
 where bloc = 'mercredi' and jour >= current_date;

update public.seances_code set statut = 'Annulé', note = coalesce(note || ' · ', '') || 'Plus de rattrapage le mercredi (5 nov.)'
 where groupe is null and type = 'Rattrapage et examen blanc' and statut = 'Prévu' and jour >= current_date;

create or replace function prive.blocs_jours(de date, a date) returns integer
language plpgsql security definer set search_path to 'public' as $$
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
    end if;
    d := d + 1;
  end loop;
  return n;
end $$;

create or replace function prive.generer_mois(debut date) returns text
language plpgsql security definer set search_path to 'public' as $$
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
    -- 5 nov. 2026 : plus de séance de code « Rattrapage et examen blanc » le mercredi
    d := d + 1;
  end loop;
  nc := prive.blocs_jours(greatest(date_trunc('month', debut)::date, current_date), fin);
  for g in select id from groupes_code where actif order by ordre loop
    ns := ns + prive.seances_groupe(g.id, greatest(date_trunc('month', debut)::date, current_date), fin);
  end loop;
  for e in select id from eleves where equipe is not null and statut in ('Inscrit', 'En formation') loop
    begin
      nb := nb + prive.equipe_completer(e.id);
    exception when others then null;
    end;
  end loop;
  return format('%s : %s places de conduite, %s séances de code, %s semaines, %s blocs d''élèves', to_char(debut, 'YYYY-MM'), nc, ns, nw, nb);
end $$;

create or replace function prive.conduite_solde_ok() returns trigger
language plpgsql security definer set search_path to '' as $$
declare r numeric; n int; q int; f text; m int[]; d0 date; k int; rat boolean; pv boolean; ng int; ns int; nl int;
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
  if prive.rdv_manques(new.eleve_id) >= 4 then
    raise exception 'Conduite bloquée : 4 rendez-vous manqués sans prévenir. Pour débloquer : 3 000 F (reçu « Déblocage de la conduite »).' using errcode = 'P0001';
  end if;
  -- 5 nov. 2026 : un bloc manqué se rattrape n'importe quel jour (plus seulement le mercredi)
  rat := prive.rattrapages_dus(new.eleve_id, new.id) > 0;
  new.note := case when rat then 'Rattrapage' when new.note = 'Rattrapage' then null else new.note end;
  q := prive.quota_conduite(new.eleve_id);
  if not rat and q is not null and prive.blocs_pris(new.eleve_id, new.id) >= q then
    raise exception 'Réservation impossible : ses % séances sont déjà faites ou réservées. Séance en plus : 3 000 F.', q using errcode = 'P0001';
  end if;
  select p.formation into f from public.paiements p
   where p.eleve_id = new.eleve_id and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
   order by p.cree_le desc limit 1;
  if coalesce(f, '') not ilike '%remise%' and coalesce(f, '') not ilike '%priv%' then
    m := array(select g.i + 1 from generate_series(0, 8) g(i) where not (g.i = any (prive.cours_af(new.eleve_id))) order by 1);
    if cardinality(m) > 0 then
      raise exception 'Pas encore de conduite : il doit d''abord suivre en salle les cours 1 à 9 (parties A à F du manuel). Il lui manque : %.', array_to_string(m, ', ') using errcode = 'P0001';
    end if;
  end if;
  d0 := prive.fin_formation(new.eleve_id);
  if d0 is not null and new.jour > d0 then
    raise exception 'Réservation impossible : le délai de formation se terminait le % (3 mois). La gérante peut le prolonger d''un mois depuis sa fiche.', to_char(d0, 'DD/MM/YYYY') using errcode = 'P0001';
  end if;
  if exists (select 1 from public.creneaux_conduite c
              where c.eleve_id = new.eleve_id and c.id <> new.id and c.jour = new.jour and c.heure = new.heure and c.statut in ('Réservé', 'Fait')) then
    raise exception 'Réservation impossible : il a déjà une place à cette séance.' using errcode = 'P0001';
  end if;
  select count(*) into k from public.creneaux_conduite c
   where c.eleve_id = new.eleve_id and c.id <> new.id and c.statut in ('Réservé', 'Fait')
     and date_trunc('week', c.jour) = date_trunc('week', new.jour);
  if k >= 3 then
    raise exception 'Réservation impossible : il a déjà 3 séances la semaine du % (3 au plus par semaine).', to_char(date_trunc('week', new.jour), 'DD/MM') using errcode = 'P0001';
  end if;
  -- 28 oct. : formation privée = seul dans la voiture ; on ne mélange pas séances seules et élèves en groupe.
  pv := coalesce(f, '') ilike '%privée%';
  select count(*) filter (where c.eleve_id is not null and c.statut in ('Réservé', 'Fait') and not prive.est_privee(c.eleve_id)),
         count(*) filter (where c.eleve_id is not null and c.statut in ('Réservé', 'Fait') and prive.est_privee(c.eleve_id))
           + count(distinct c.note) filter (where c.eleve_id is null and c.note like 'À l''unité : %' and c.statut <> 'Annulé'),
         count(*) filter (where c.eleve_id is null and c.statut = 'Libre')
    into ng, ns, nl
    from public.creneaux_conduite c
   where c.jour = new.jour and c.heure = new.heure and c.id <> new.id;
  if pv then
    if ng > 0 then
      raise exception 'Formation privée : il conduit seul. Cette séance a déjà des élèves en groupe : choisis une séance vide.' using errcode = 'P0001';
    end if;
    if ns >= 2 then
      raise exception 'Cette séance a déjà 2 séances seules (1 h chacune) : choisis une autre séance.' using errcode = 'P0001';
    end if;
    if nl < 1 then
      raise exception 'Formation privée : il faut 2 places libres dans la séance (il conduit 1 h seul).' using errcode = 'P0001';
    end if;
  elsif ns > 0 then
    raise exception 'Cette séance est réservée aux séances seules (formation privée ou à l''unité) : choisis une autre séance.' using errcode = 'P0001';
  end if;
  return new;
end $$;
