-- 0022 · Groupes de code (salle de 6 places)
-- Groupes fixes : A (lundi + jeudi) et B (mardi + vendredi) à 14 h 30, ouverts ;
-- C et D (mêmes jours à 11 h) préparés mais fermés, à ouvrir quand A et B sont pleins.
-- Mercredi 14 h 30 : séance commune « Rattrapage et examen blanc ». Plus de séance le samedi (conduite seule).
-- Rien n'est supprimé : les anciennes séances futures (sans aucune présence) passent en « Annulé ».

create table if not exists public.groupes_code (
  id text primary key check (id ~ '^[A-Z]$'),
  nom text not null check (length(nom) <= 40),
  jours smallint[] not null check (array_length(jours, 1) between 1 and 5),
  heure text not null check (length(heure) <= 30),
  places smallint not null default 6 check (places between 1 and 30),
  actif boolean not null default false,
  ordre smallint not null default 0
);
alter table public.groupes_code enable row level security;
create policy "équipe : lire" on public.groupes_code for select to authenticated using (prive.est_equipe());
create policy "équipe : modifier" on public.groupes_code for update to authenticated using (prive.est_equipe()) with check (prive.est_equipe());
insert into public.groupes_code (id, nom, jours, heure, places, actif, ordre) values
  ('A', 'Groupe A', '{1,4}', '14 h 30 – 15 h 30', 6, true, 1),
  ('B', 'Groupe B', '{2,5}', '14 h 30 – 15 h 30', 6, true, 2),
  ('C', 'Groupe C (matin)', '{1,4}', '11 h – 12 h', 6, false, 3),
  ('D', 'Groupe D (matin)', '{2,5}', '11 h – 12 h', 6, false, 4)
on conflict (id) do nothing;

alter table public.eleves add column if not exists groupe_code text references public.groupes_code(id);
alter table public.seances_code add column if not exists groupe text references public.groupes_code(id);

alter table public.seances_code drop constraint if exists seances_code_type_check;
alter table public.seances_code add constraint seances_code_type_check
  check (type in ('Cours complet', 'Récap et devoir', 'Entraînement examen', 'Examen blanc', 'Rattrapage et examen blanc'));
alter table public.seances_code drop constraint if exists seances_code_jour_type_key;
alter table public.seances_code add constraint seances_code_jour_type_groupe_key unique nulls not distinct (jour, type, groupe);

-- Séances de code d'un groupe entre deux dates (1er jour du groupe = cours, 2e jour = entraînement)
create or replace function prive.seances_groupe(g text, de date, a date)
returns int language plpgsql security definer set search_path = public as $$
declare d date := de; r record; n int := 0; k int;
begin
  select * into r from groupes_code where id = g;
  if not found then return 0; end if;
  while d <= a loop
    if extract(isodow from d)::smallint = any (r.jours) and not exists (select 1 from jours_feries where jour = d) then
      insert into seances_code (jour, type, heure, groupe)
      values (d, case when extract(isodow from d)::smallint = r.jours[1] then 'Cours complet' else 'Entraînement examen' end, r.heure, g)
      on conflict do nothing;
      get diagnostics k = row_count; n := n + k;
    end if;
    d := d + 1;
  end loop;
  return n;
end $$;
revoke all on function prive.seances_groupe(text, date, date) from public;

create or replace function prive.generer_mois(debut date)
returns text language plpgsql security definer set search_path = public as $function$
declare
  d date; fin date := (date_trunc('month', debut) + interval '1 month - 1 day')::date;
  dow int; h text; nc int := 0; ns int := 0; nw int := 0; n int; g record;
  depart date := (select valeur::date from reglages where cle = 'devoir_debut');
  themes text[] := array['Signalisation et marquages','Les panneaux','Intersections et priorités','Qui passe en premier ?','Feux, passages à niveau et agents','Le poste de conduite','Vitesse, distances et stationnement','Secourisme routier','Assurance et conduire chez nous','Mécanique et tableau de bord'];
begin
  d := date_trunc('month', debut)::date;
  while d <= fin loop
    dow := extract(isodow from d);
    if dow = 1 then
      n := greatest(0, (d - depart) / 7) % 10;
      insert into devoir_semaines values (d, chr(65 + n), themes[n + 1]) on conflict do nothing;
      get diagnostics n = row_count; nw := nw + n;
    end if;
    if dow < 7 and not exists (select 1 from jours_feries where jour = d) then
      foreach h in array case when dow = 6 then array['6 h 30','7 h 30','8 h 45','9 h 45','10 h 45']
                              else array['6 h 30','7 h 30','8 h 45','9 h 45','15 h 45','16 h 45'] end loop
        insert into creneaux_conduite (jour, heure) values (d, h) on conflict do nothing;
        get diagnostics n = row_count; nc := nc + n;
      end loop;
      if dow = 3 and d >= current_date then
        insert into seances_code (jour, type, heure, groupe) values (d, 'Rattrapage et examen blanc', '14 h 30 – 15 h 30', null) on conflict do nothing;
        get diagnostics n = row_count; ns := ns + n;
      end if;
    end if;
    d := d + 1;
  end loop;
  for g in select id from groupes_code where actif order by ordre loop
    ns := ns + prive.seances_groupe(g.id, greatest(date_trunc('month', debut)::date, current_date), fin);
  end loop;
  return format('%s : %s créneaux, %s séances, %s semaines', to_char(debut, 'YYYY-MM'), nc, ns, nw);
end $function$;

-- Ouvrir / fermer un groupe depuis l'espace équipe (séances créées jusqu'au dernier mois déjà préparé)
create or replace function public.groupe_ouvrir(p_id text, p_actif boolean)
returns int language plpgsql volatile security definer set search_path = public as $$
declare fin date; n int := 0;
begin
  if not prive.est_equipe() then raise exception 'accès refusé' using errcode = '42501'; end if;
  update groupes_code set actif = p_actif where id = p_id;
  if not found then return 0; end if;
  if p_actif then
    select coalesce(max(jour), current_date) into fin from creneaux_conduite;
    n := prive.seances_groupe(p_id, current_date, fin);
    update seances_code set statut = 'Prévu', note = null where groupe = p_id and jour >= current_date and statut = 'Annulé' and note = 'Groupe fermé';
  else
    update seances_code s set statut = 'Annulé', note = 'Groupe fermé'
     where s.groupe = p_id and s.jour >= current_date and s.statut = 'Prévu'
       and not exists (select 1 from presences p where p.seance_id = s.id);
  end if;
  return n;
end $$;
revoke all on function public.groupe_ouvrir(text, boolean) from public, anon;
grant execute on function public.groupe_ouvrir(text, boolean) to authenticated;

-- Réorganisation : anciennes séances futures sans présence → Annulé, puis nouvelles séances d'octobre et novembre
update seances_code s set statut = 'Annulé', note = 'Réorganisation : groupes de code'
 where s.groupe is null and s.jour >= current_date and s.statut = 'Prévu' and s.type <> 'Rattrapage et examen blanc'
   and not exists (select 1 from presences p where p.seance_id = s.id);
select prive.generer_mois(date_trunc('month', current_date)::date);
select prive.generer_mois((date_trunc('month', current_date) + interval '1 month')::date);
