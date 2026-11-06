-- 0106 (5 nov. 2026) : le mercredi, code comme les autres jours (14 h 30 – 15 h 30 et 18 h – 19 h) : « Cours ouvert »,
-- le cours de la semaine (le 1er cours de la semaine, celui du lundi/mardi), ouvert à tous les inscrits, 6 places, sans réservation.
-- Le moniteur fait l'appel ; le cours compte pour les présents. Décision du propriétaire. (Pas de « rattrapage » : c'est un cours normal.)
alter table public.seances_code drop constraint if exists seances_code_type_check;
alter table public.seances_code add constraint seances_code_type_check check (type = any (array['Cours complet', 'Récap et devoir', 'Entraînement examen', 'Examen blanc', 'Rattrapage et examen blanc', 'Cours ouvert']));

create or replace function prive.cours_ouverts(de date, a date) returns integer
language plpgsql security definer set search_path to 'public' as $$
declare d date := de; n int := 0; k int; th text;
begin
  while d <= a loop
    if extract(isodow from d) = 3 and not exists (select 1 from jours_feries where jour = d) then
      th := prive.theme_cours(2 * prive.semaine_boucle(d - 2));
      insert into seances_code (jour, type, heure, groupe, theme) values (d, 'Cours ouvert', '14 h 30 – 15 h 30', null, th) on conflict do nothing;
      get diagnostics k = row_count; n := n + k;
      insert into seances_code (jour, type, heure, groupe, theme) values (d, 'Cours ouvert', '18 h – 19 h', null, th) on conflict do nothing;
      get diagnostics k = row_count; n := n + k;
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
    d := d + 1;
  end loop;
  nc := prive.blocs_jours(greatest(date_trunc('month', debut)::date, current_date), fin);
  for g in select id from groupes_code where actif order by ordre loop
    ns := ns + prive.seances_groupe(g.id, greatest(date_trunc('month', debut)::date, current_date), fin);
  end loop;
  ns := ns + prive.cours_ouverts(greatest(date_trunc('month', debut)::date, current_date), fin);
  for e in select id from eleves where equipe is not null and statut in ('Inscrit', 'En formation') loop
    begin
      nb := nb + prive.equipe_completer(e.id);
    exception when others then null;
    end;
  end loop;
  return format('%s : %s places de conduite, %s séances de code, %s semaines, %s blocs d''élèves', to_char(debut, 'YYYY-MM'), nc, ns, nw, nb);
end $$;

-- Les mercredis déjà au planning (ce mois-ci et le suivant)
select prive.cours_ouverts(current_date, (date_trunc('month', current_date) + interval '2 months - 1 day')::date);
