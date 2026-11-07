-- 0110 (7 nov. 2026) : le mercredi devient un jour comme les autres (décision du propriétaire).
-- Plus de « cours ouvert à tous » le mercredi : un vrai groupe, « Groupe C (mercredi) », 6 places,
-- 14 h 30 = 1er cours de la semaine, 18 h = 2e cours (même rythme que les autres groupes, comme le dimanche).
-- Pas de placement automatique (il a un cours à 18 h) : le secrétariat le choisit dans la fiche, pour ceux qui préfèrent le mercredi.
-- Un cours manqué se refait au tour suivant du programme (12 cours en 6 semaines).
-- Rien n'est supprimé : les cours ouverts déjà prévus passent à « Annulé ».

insert into public.groupes_code (id, nom, jours, heure, places, actif, ordre, soir, dimanche)
values ('C', 'Groupe C (mercredi)', '{3}', '14 h 30 et 18 h', 6, true, 3, false, false)
on conflict (id) do update set nom = excluded.nom, jours = excluded.jours, heure = excluded.heure, places = excluded.places,
  actif = true, ordre = excluded.ordre, soir = false, dimanche = false;

-- Séances d'un groupe : un groupe d'un seul jour (mercredi, dimanche) fait les 2 cours de la semaine ce jour-là
create or replace function prive.seances_groupe(g text, de date, a date)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare d date := de; r record; n int := 0; k int; c int; s int;
begin
  select * into r from groupes_code where id = g;
  if not found then return 0; end if;
  while d <= a loop
    if extract(isodow from d)::smallint = any (r.jours) and not exists (select 1 from jours_feries where jour = d) then
      if coalesce(array_length(r.jours, 1), 0) = 1 then
        s := prive.semaine_boucle(d - (extract(isodow from d)::int - 1));
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

-- Plus de cours ouvert le mercredi (la fonction reste, elle ne crée plus rien)
create or replace function prive.cours_ouverts(de date, a date) returns integer
language plpgsql security definer set search_path to 'public' as $$
begin
  return 0;
end $$;

-- Placement automatique : jamais dans un groupe d'un seul jour (mercredi, dimanche)
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
     where gc.actif and not gc.dimanche and coalesce(array_length(gc.jours, 1), 0) > 1 and gc.soir = e.code_soir
       and prive.occupation_groupe(gc.id) < gc.places order by gc.ordre limit 1;
    continue when g is null;
    update eleves set groupe_code = g, groupe_depuis = now(), groupe_msg_le = null where id = e.id and groupe_code is null;
    if found then
      insert into suivi (eleve_id, type, note) values (e.id, 'Note', 'Placé automatiquement au code : ' || (select nom from groupes_code where id = g));
      eleve_id := e.id; groupe := g; return next;
    end if;
  end loop;
end $$;

-- Les cours ouverts encore prévus : annulés (jamais supprimés)
update public.seances_code set statut = 'Annulé'
 where type = 'Cours ouvert' and statut = 'Prévu' and jour >= current_date;

-- Les mercredis du Groupe C : jusqu'au dernier jour déjà préparé pour les groupes
select prive.seances_groupe('C', current_date, (select coalesce(max(jour), current_date) from public.seances_code where groupe is not null));
