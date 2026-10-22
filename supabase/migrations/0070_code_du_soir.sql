-- 0070 · Code du soir (décision du propriétaire, 22 oct. 2026)
-- Pour ceux qui travaillent la journée : cours de code de 18 h à 19 h, du lundi au vendredi.
--   Groupe F (soir) : lundi + jeudi · Groupe G (soir) : mardi + vendredi · mercredi 18 h : rattrapage du code + examen blanc.
--   Même programme que les autres groupes (même cours la même semaine), 6 places par groupe.
-- Placement automatique : un élève marqué « code le soir » ne va que dans un groupe du soir, les autres jamais dans un groupe du soir.
-- Rien n'est supprimé. Idempotent.

alter table public.groupes_code add column if not exists soir boolean not null default false;
alter table public.eleves add column if not exists code_soir boolean not null default false;

insert into public.groupes_code (id, nom, jours, heure, places, actif, ordre, soir) values
  ('F', 'Groupe F (soir)', '{1,4}', '18 h – 19 h', 6, true, 6, true),
  ('G', 'Groupe G (soir)', '{2,5}', '18 h – 19 h', 6, true, 7, true)
on conflict (id) do nothing;

-- Deux rattrapages le mercredi (14 h 30 et 18 h) : l'heure entre dans la règle d'unicité
alter table public.seances_code drop constraint if exists seances_code_jour_type_groupe_key;
alter table public.seances_code drop constraint if exists seances_code_jour_type_groupe_heure_key;
alter table public.seances_code add constraint seances_code_jour_type_groupe_heure_key unique nulls not distinct (jour, type, groupe, heure);

-- Préparation du mois : ajoute le rattrapage du mercredi soir
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
      insert into seances_code (jour, type, heure, groupe) values (d, 'Rattrapage et examen blanc', '18 h – 19 h', null) on conflict do nothing;
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

-- Placement automatique : soir avec soir, journée avec journée
create or replace function public.code_placer()
returns table (eleve_id bigint, groupe text)
language plpgsql volatile security definer set search_path = public as $$
declare e record; g text;
begin
  if not prive.est_equipe() then raise exception 'accès refusé' using errcode = '42501'; end if;
  perform 1 from groupes_code for update;  -- un seul placement à la fois
  for e in
    select el.id, el.code_soir from eleves el
     where el.groupe_code is null and prive.en_code(el) and not prive.place_suspendue(el.id)
     order by prive.date_inscription(el.id) nulls last, el.id
  loop
    select gc.id into g from groupes_code gc
     where gc.actif and gc.soir = e.code_soir and prive.occupation_groupe(gc.id) < gc.places order by gc.ordre limit 1;
    continue when g is null;
    update eleves set groupe_code = g, groupe_depuis = now(), groupe_msg_le = null where id = e.id and groupe_code is null;
    if found then
      insert into suivi (eleve_id, type, note) values (e.id, 'Note', 'Placé automatiquement au code : ' || (select nom from groupes_code where id = g));
      eleve_id := e.id; groupe := g; return next;
    end if;
  end loop;
end $$;
revoke all on function public.code_placer() from public, anon;
grant execute on function public.code_placer() to authenticated;

-- Séances du soir déjà prévues jusqu'à la fin du mois prochain
do $$
declare fin date := (date_trunc('month', current_date) + interval '2 months - 1 day')::date; d date := current_date + 1;
begin
  perform prive.seances_groupe('F', current_date + 1, fin);
  perform prive.seances_groupe('G', current_date + 1, fin);
  while d <= fin loop
    if extract(isodow from d) = 3 and not exists (select 1 from public.jours_feries where jour = d) then
      insert into public.seances_code (jour, type, heure, groupe) values (d, 'Rattrapage et examen blanc', '18 h – 19 h', null) on conflict do nothing;
    end if;
    d := d + 1;
  end loop;
end $$;
