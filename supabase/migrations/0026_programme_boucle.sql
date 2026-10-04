-- 0026 · Code en salle : programme en boucle de 12 cours sur 6 semaines (2 cours par semaine), le même pour tous les groupes
-- Départ : lundi 5 octobre 2026 (réglage devoir_debut). Semaine k (0 à 5) : 1er jour du groupe = cours 2k+1, 2e jour = cours 2k+2.
-- Cours 1 à 10 = les 10 thèmes (un devoir par cours, lettres A à J) ; cours 11 = révision générale ; cours 12 = examen blanc.
-- Un élève peut commencer n'importe quelle semaine : en 6 semaines (son cycle de code), il voit tout le programme une fois.
-- Rien n'est supprimé : les séances futures reçoivent leur thème, devoir_semaines est mis à jour.

create or replace function prive.theme_cours(i int) returns text
language sql immutable as $$
  select (array['Signalisation et marquages', 'Les panneaux', 'Intersections et priorités', 'Qui passe en premier ?',
                'Feux, passages à niveau et agents', 'Le poste de conduite', 'Vitesse, distances et stationnement',
                'Secourisme routier', 'Assurance et conduire chez nous', 'Mécanique et tableau de bord',
                'Révision générale', 'Examen blanc'])[i + 1]
$$;

-- Semaine du programme (0 à 5) pour une date
create or replace function prive.semaine_boucle(d date) returns int
language sql stable security definer set search_path = public as $$
  select ((floor((d - coalesce((select valeur::date from reglages where cle = 'devoir_debut'), date '2026-10-05')) / 7.0)::int % 6) + 6) % 6
$$;

-- Numéro du cours (0 à 11) donné ce jour-là par un groupe qui a cours les jours j (1er jour = 1er cours de la semaine)
create or replace function prive.cours_boucle(d date, j smallint[]) returns int
language sql stable as $$
  select prive.semaine_boucle(d) * 2 + case when extract(isodow from d)::smallint = j[1] then 0 else 1 end
$$;

create or replace function prive.seances_groupe(g text, de date, a date)
returns int language plpgsql security definer set search_path = public as $$
declare d date := de; r record; n int := 0; k int; c int;
begin
  select * into r from groupes_code where id = g;
  if not found then return 0; end if;
  while d <= a loop
    if extract(isodow from d)::smallint = any (r.jours) and not exists (select 1 from jours_feries where jour = d) then
      c := prive.cours_boucle(d, r.jours);
      insert into seances_code (jour, type, heure, groupe, theme)
      values (d, case when c = 11 then 'Examen blanc' else 'Cours complet' end, r.heure, g, prive.theme_cours(c))
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
  dow int; h text; nc int := 0; ns int := 0; nw int := 0; n int; g record; s int;
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

-- Séances futures des groupes : thème et type selon la boucle
update seances_code s
   set theme = prive.theme_cours(prive.cours_boucle(s.jour, g.jours)),
       type = case when prive.cours_boucle(s.jour, g.jours) = 11 then 'Examen blanc' else 'Cours complet' end
  from groupes_code g
 where g.id = s.groupe and s.jour >= current_date and s.statut <> 'Fait';

-- Devoirs de la semaine : 2 devoirs par semaine (lettre = le 1er des deux), pas de devoir la semaine 6 (révision)
alter table public.devoir_semaines alter column lettre drop not null;
update devoir_semaines
   set lettre = case when prive.semaine_boucle(lundi) < 5 then chr(65 + 2 * prive.semaine_boucle(lundi)) end,
       theme = prive.theme_cours(2 * prive.semaine_boucle(lundi)) || ' · ' || prive.theme_cours(2 * prive.semaine_boucle(lundi) + 1)
 where lundi >= (select valeur::date from reglages where cle = 'devoir_debut');
