-- 0107 (6 nov. 2026) : le dimanche, pour ceux qui ne peuvent venir que ce jour-là (décision du propriétaire).
-- Mêmes horaires qu'un lundi : conduite 7 h 30, 10 h, 15 h 45 ; code 14 h 30 (1er cours de la semaine) et 18 h (2e cours).
-- Le code du dimanche est un groupe à part, « Groupe H (dimanche) » : jamais de placement automatique (le secrétariat le choisit
-- à la main dans la fiche), 6 places. Pas annoncé au public pour l'instant (outil de l'équipe seulement). Agence : fermée.

alter table public.groupes_code add column if not exists dimanche boolean not null default false;

insert into public.groupes_code (id, nom, jours, heure, places, actif, ordre, soir, dimanche)
values ('H', 'Groupe H (dimanche)', '{7}', '14 h 30 et 18 h', 6, true, 8, false, true)
on conflict (id) do nothing;

-- Séances du groupe : le dimanche, deux cours (ceux de la semaine qui finit)
create or replace function prive.seances_groupe(g text, de date, a date)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare d date := de; r record; n int := 0; k int; c int; s int;
begin
  select * into r from groupes_code where id = g;
  if not found then return 0; end if;
  while d <= a loop
    if extract(isodow from d)::smallint = any (r.jours) and not exists (select 1 from jours_feries where jour = d) then
      if r.dimanche then
        s := prive.semaine_boucle(d - 6);
        insert into seances_code (jour, type, heure, groupe, theme)
        values (d, 'Cours complet', '14 h 30 – 15 h 30', g, prive.theme_cours(2 * s)) on conflict do nothing;
        get diagnostics k = row_count; n := n + k;
        insert into seances_code (jour, type, heure, groupe, theme)
        values (d, case when 2 * s + 1 = 11 then 'Examen blanc' else 'Cours complet' end, '18 h – 19 h', g, prive.theme_cours(2 * s + 1)) on conflict do nothing;
        get diagnostics k = row_count; n := n + k;
      else
        c := prive.cours_boucle(d, r.jours);
        insert into seances_code (jour, type, heure, groupe, theme)
        values (d, case when c = 11 then 'Examen blanc' else 'Cours complet' end, r.heure, g, prive.theme_cours(c))
        on conflict do nothing;
        get diagnostics k = row_count; n := n + k;
      end if;
    end if;
    d := d + 1;
  end loop;
  return n;
end $$;

-- Placement automatique : jamais dans le groupe du dimanche
create or replace function public.code_placer()
returns table(eleve_id bigint, groupe text) language plpgsql security definer set search_path to 'public' as $$
declare e record; g text;
begin
  if not prive.est_equipe() then raise exception 'accès refusé' using errcode = '42501'; end if;
  perform 1 from groupes_code for update;
  for e in
    select el.id, el.code_soir from eleves el
     where el.groupe_code is null and prive.en_code(el) and not prive.place_suspendue(el.id)
     order by prive.date_inscription(el.id) nulls last, el.id
  loop
    select gc.id into g from groupes_code gc
     where gc.actif and not gc.dimanche and gc.soir = e.code_soir and prive.occupation_groupe(gc.id) < gc.places order by gc.ordre limit 1;
    continue when g is null;
    update eleves set groupe_code = g, groupe_depuis = now(), groupe_msg_le = null where id = e.id and groupe_code is null;
    if found then
      insert into suivi (eleve_id, type, note) values (e.id, 'Note', 'Placé automatiquement au code : ' || (select nom from groupes_code where id = g));
      eleve_id := e.id; groupe := g; return next;
    end if;
  end loop;
end $$;

-- Conduite le dimanche : les mêmes créneaux qu'un lundi
insert into public.equipes_conduite (id, nom, heure, jours, places, actif, ordre)
select v.id::smallint, v.nom, v.heure, '{7}'::smallint[], 4, true, v.id::smallint
  from (values (10, 'Équipe 10 (dimanche)', '7 h 30'), (11, 'Équipe 11 (dimanche)', '10 h'), (12, 'Équipe 12 (dimanche)', '15 h 45')) v(id, nom, heure)
 where not exists (select 1 from public.equipes_conduite e where e.id = v.id);

create or replace function prive.blocs_jours(de date, a date) returns integer
language plpgsql security definer set search_path to 'public' as $$
declare d date := de; dow int; t record; k int; n int := 0; m int;
begin
  while d <= a loop
    dow := extract(isodow from d);
    if not exists (select 1 from jours_feries where jour = d) then
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

-- Les dimanches déjà au planning : jusqu'au dernier jour préparé
select prive.blocs_jours(current_date, (select coalesce(max(jour), current_date) from public.creneaux_conduite));
select prive.seances_groupe('H', current_date, (select coalesce(max(jour), current_date) from public.creneaux_conduite));
