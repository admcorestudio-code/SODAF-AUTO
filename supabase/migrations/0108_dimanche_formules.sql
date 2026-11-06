-- 0108 (6 nov. 2026) : le dimanche n'est pas un jour de travail, l'équipe se déplace exprès.
-- Décision du propriétaire : le dimanche, seulement la formation complète (55 000 F) et la formation privée (85 000 F).
-- Les autres (étudiant, rapide, remise à niveau, tirage, code seul, séance à l'unité) viennent en semaine,
-- ou passent à la formation complète (changement de formule, la différence à payer).

create or replace function prive.dimanche_ok(e bigint) returns boolean
language sql stable security definer set search_path to '' as $$
  select coalesce((select p.formation in ('Formation complète (permis B)', 'Formation privée (permis B)')
                     from public.paiements p
                    where p.eleve_id = e and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
                    order by p.cree_le desc limit 1), false)
$$;

-- Conduite du dimanche
create or replace function prive.conduite_dimanche() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if extract(isodow from new.jour) <> 7 or new.statut = 'Libre' then return new; end if;
  if new.eleve_id is not null and new.statut = 'Réservé'
     and (tg_op = 'INSERT' or new.eleve_id is distinct from old.eleve_id or old.statut is distinct from 'Réservé')
     and not prive.dimanche_ok(new.eleve_id) then
    raise exception 'Le dimanche : seulement la formation complète (55 000 F) ou la formation privée (85 000 F). Sinon, une séance en semaine.' using errcode = 'P0001';
  end if;
  if new.eleve_id is null and coalesce(new.note, '') like 'À l''unité%' and (tg_op = 'INSERT' or new.note is distinct from old.note) then
    raise exception 'Pas de séance à l''unité le dimanche : seulement la formation complète ou la formation privée.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace trigger conduite_dimanche before insert or update on public.creneaux_conduite
  for each row execute function prive.conduite_dimanche();

-- Groupe du dimanche (code) : seulement la formation complète (la privée a son code en particulier)
create or replace function prive.groupe_dimanche() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if new.groupe_code is not null and new.groupe_code is distinct from old.groupe_code
     and exists (select 1 from public.groupes_code g where g.id = new.groupe_code and g.dimanche)
     and not prive.dimanche_ok(new.id) then
    raise exception 'Le groupe du dimanche : seulement la formation complète (55 000 F). Les autres formules viennent en semaine.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace trigger eleve_groupe_dimanche before update of groupe_code on public.eleves
  for each row execute function prive.groupe_dimanche();
