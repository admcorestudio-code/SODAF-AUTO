-- 0072 · Rattraper un cours de code dans un autre groupe (décision du propriétaire, 23 oct. 2026)
-- Tous les groupes font le même cours la même semaine : un élève qui a raté son cours peut venir
-- au même cours dans un autre groupe, s'il reste une place (6 au plus dans la salle). Sinon : mercredi 14 h 30 ou 18 h.
-- Le secrétariat réserve la place ; le moniteur le voit dans son appel et coche sa présence (le cours compte alors).
-- Rien n'est supprimé (une réservation se met en « Annulé »). Idempotent.

create table if not exists public.code_rattrapages (
  id bigint generated always as identity primary key,
  seance_id bigint not null references public.seances_code(id),
  eleve_id bigint not null references public.eleves(id),
  statut text not null default 'Réservé' check (statut in ('Réservé', 'Annulé')),
  par uuid default auth.uid(),
  le timestamptz not null default now()
);
create unique index if not exists code_rattrapages_un on public.code_rattrapages (seance_id, eleve_id) where statut = 'Réservé';
alter table public.code_rattrapages enable row level security;
drop policy if exists "équipe : lire" on public.code_rattrapages;
create policy "équipe : lire" on public.code_rattrapages for select to authenticated using (prive.est_equipe());

-- Places prises dans une séance de groupe : élèves du groupe + rattrapages réservés
create or replace function prive.places_seance(s bigint)
returns int language sql stable security definer set search_path = public as $$
  select prive.occupation_groupe(sc.groupe)
       + (select count(*)::int from code_rattrapages r where r.seance_id = s and r.statut = 'Réservé')
    from seances_code sc where sc.id = s
$$;
revoke all on function prive.places_seance(bigint) from public;

create or replace function public.code_rattrapage(p_eleve bigint, p_seance bigint)
returns bigint language plpgsql volatile security definer set search_path = public as $$
declare s record; el public.eleves; g record; n bigint;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  select * into s from seances_code where id = p_seance for update;
  if not found or s.groupe is null then raise exception 'Séance introuvable.'; end if;
  if s.statut <> 'Prévu' or s.jour < current_date then raise exception 'Cette séance est passée ou annulée.'; end if;
  select * into el from eleves where id = p_eleve;
  if not found or not prive.en_code(el) then raise exception 'Cet élève ne suit pas le code en ce moment.'; end if;
  if el.groupe_code = s.groupe then raise exception 'C''est déjà son groupe : il vient normalement.'; end if;
  if exists (select 1 from presences p join seances_code x on x.id = p.seance_id where p.eleve_id = p_eleve and x.theme = s.theme and x.statut <> 'Annulé') then
    raise exception 'Il a déjà suivi ce cours.';
  end if;
  if exists (select 1 from code_rattrapages where seance_id = p_seance and eleve_id = p_eleve and statut = 'Réservé') then raise exception 'Déjà réservé pour cet élève.'; end if;
  select * into g from groupes_code where id = s.groupe;
  if prive.places_seance(p_seance) >= g.places then raise exception 'Plus de place dans ce cours (% places).', g.places; end if;
  insert into code_rattrapages (seance_id, eleve_id) values (p_seance, p_eleve) returning id into n;
  insert into suivi (eleve_id, type, note) values (p_eleve, 'Note', 'Rattrapage du code réservé : ' || g.nom || ', ' || to_char(s.jour, 'DD/MM') || ' (' || coalesce(s.theme, 'cours') || ')');
  return n;
end $$;
revoke all on function public.code_rattrapage(bigint, bigint) from public, anon;
grant execute on function public.code_rattrapage(bigint, bigint) to authenticated;

create or replace function public.code_rattrapage_annuler(p_id bigint)
returns void language plpgsql volatile security definer set search_path = public as $$
declare r record;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  update code_rattrapages set statut = 'Annulé' where id = p_id and statut = 'Réservé' returning * into r;
  if found then insert into suivi (eleve_id, type, note) values (r.eleve_id, 'Note', 'Rattrapage du code annulé'); end if;
end $$;
revoke all on function public.code_rattrapage_annuler(bigint) from public, anon;
grant execute on function public.code_rattrapage_annuler(bigint) to authenticated;

-- Sauvegarde du dimanche : ajouter la table code_rattrapages
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''code_rattrapages''' in d) = 0 and position('''rapports''' in d) > 0 then
    d := replace(d, '''rapports''', '''rapports'',''code_rattrapages''');
    execute d;
  end if;
end $$;
