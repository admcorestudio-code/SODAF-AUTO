-- Formation privée : seul dans la voiture (28 oct. 2026).
-- Une séance privée = 1 h seul avec le moniteur, elle prend 2 places du bloc de 2 h (comme la séance à l'unité).
-- On ne mélange pas : un bloc avec une séance seule (privée ou à l'unité) ne reçoit pas d'élèves en groupe, et inversement.
-- Un bloc reçoit au plus 2 séances seules (une par heure). La 2e place est gardée automatiquement :
-- eleve_id vide, statut « Réservé », note « Seul en voiture : SO<n° élève> » ; elle se libère toute seule avec la séance.

create or replace function prive.est_privee(e bigint)
 returns boolean
 language sql stable security definer set search_path to ''
as $function$
  select coalesce((select p.formation ilike '%privée%' from public.paiements p
                    where p.eleve_id = e and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
                    order by p.cree_le desc limit 1), false)
$function$;

create or replace function prive.conduite_solde_ok()
 returns trigger
 language plpgsql security definer set search_path to ''
as $function$
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
  rat := new.bloc = 'mercredi' and prive.rattrapages_dus(new.eleve_id, new.id) > 0;
  new.note := case when rat then 'Rattrapage' when new.note = 'Rattrapage' then null else new.note end;
  q := prive.quota_conduite(new.eleve_id);
  if not rat and q is not null and prive.blocs_pris(new.eleve_id, new.id) >= q then
    if prive.rattrapages_dus(new.eleve_id, new.id) > 0 then
      raise exception 'Réservation impossible : il a manqué un rendez-vous. Il le rattrape le mercredi à 15 h 45.' using errcode = 'P0001';
    end if;
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
  if new.bloc = 'mercredi' and not rat
     and now() < (((new.jour - 1)::timestamp + time '18:00') at time zone 'Africa/Lome') then
    raise exception 'Jusqu''au mardi 18 h, le mercredi 15 h 45 est réservé aux rattrapages (élèves qui ont manqué un rendez-vous).' using errcode = 'P0001';
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
end $function$;

-- Garde (ou libère) automatiquement la 2e place d'une séance privée.
create or replace function prive.seul_place()
 returns trigger
 language plpgsql security definer set search_path to ''
as $function$
declare k text;
begin
  if pg_trigger_depth() > 1 then return null; end if;
  if tg_op = 'UPDATE' and old.eleve_id is not null and old.statut in ('Réservé', 'Fait', 'Absent')
     and (new.eleve_id is distinct from old.eleve_id or new.statut not in ('Réservé', 'Fait', 'Absent')) then
    update public.creneaux_conduite set statut = case when new.statut = 'Annulé' then 'Annulé' else 'Libre' end, note = null, modifie_le = now()
     where id = (select c.id from public.creneaux_conduite c
                  where c.jour = old.jour and c.heure = old.heure and c.eleve_id is null
                    and c.note = 'Seul en voiture : SO' || old.eleve_id and c.statut = 'Réservé'
                  order by c.place desc nulls last limit 1);
  end if;
  if new.eleve_id is not null and new.statut in ('Réservé', 'Fait', 'Absent') and prive.est_privee(new.eleve_id) then
    k := 'Seul en voiture : SO' || new.eleve_id;
    if not exists (select 1 from public.creneaux_conduite c
                    where c.jour = new.jour and c.heure = new.heure and c.eleve_id is null and c.note = k and c.statut = 'Réservé') then
      update public.creneaux_conduite set statut = 'Réservé', note = k, confirme_le = null, rappel_le = null, modifie_le = now()
       where id = (select c.id from public.creneaux_conduite c
                    where c.jour = new.jour and c.heure = new.heure and c.id <> new.id and c.eleve_id is null and c.statut = 'Libre'
                    order by c.place desc nulls last limit 1);
    end if;
  end if;
  return null;
end $function$;

drop trigger if exists seul_place on public.creneaux_conduite;
create trigger seul_place after insert or update of eleve_id, statut on public.creneaux_conduite
  for each row execute function prive.seul_place();
