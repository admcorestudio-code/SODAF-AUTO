-- 0078 · Les 3 mois commencent le jour où l'élève entre dans un groupe de code (décision du propriétaire, 25 oct. 2026)
-- « Dès le moment où il est fixé dans un groupe, c'est bon. Le délai doit commencer. »
-- Avant : le jour du premier paiement de la formation, même s'il attendait une place (liste d'attente).
-- 1. eleves.formation_debut : jour de sa première entrée dans un groupe de code. Posé une seule fois, jamais effacé
--    (un nouveau cycle de 6 semaines ne le change pas).
-- 2. Délai de 3 mois (fin_formation) : à partir de formation_debut. Remise à niveau et formation entreprise (pas de code) :
--    à partir du premier paiement, comme avant. Pas encore dans un groupe : le délai ne compte pas.
-- 3. Place au code gardée 1 mois sans solde (place_suspendue) : à partir de formation_debut aussi.
-- Élèves déjà dans un groupe (ou qui ont déjà suivi un cours en salle) : on garde la date de leur premier paiement (rien ne change pour eux).
-- Élèves en liste d'attente : leur délai repart du jour où ils entrent dans un groupe.
-- Rien n'est supprimé. Idempotent.

alter table public.eleves add column if not exists formation_debut date;
comment on column public.eleves.formation_debut is 'Jour de la première entrée dans un groupe de code : début des 3 mois de formation (0078).';

update public.eleves e set formation_debut = coalesce(prive.debut_formation(e.id), (e.groupe_depuis at time zone 'Africa/Lome')::date)
 where e.formation_debut is null
   and (e.groupe_code is not null or e.groupe_depuis is not null or cardinality(prive.cours_af(e.id)) > 0);

create or replace function prive.trg_formation_debut()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.groupe_code is not null and new.formation_debut is null
     and (tg_op = 'INSERT' or old.groupe_code is null or old.groupe_code is distinct from new.groupe_code) then
    new.formation_debut := (now() at time zone 'Africa/Lome')::date;
  end if;
  return new;
end $$;
revoke all on function prive.trg_formation_debut() from public;
drop trigger if exists eleve_formation_debut on public.eleves;
create trigger eleve_formation_debut before insert or update of groupe_code on public.eleves
  for each row execute function prive.trg_formation_debut();

create or replace function prive.fin_formation(e bigint)
returns date language sql stable security definer set search_path = '' as $$
  select case when d.d0 is null then null else greatest((d.d0 + interval '3 months')::date, d.pj) end
    from (select case when coalesce(x.formation, '') ~* '(remise à niveau|entreprise)' then prive.debut_formation(e)
                      else x.formation_debut end as d0, x.prolonge_jusqu as pj
            from public.eleves x where x.id = e) d
$$;
revoke all on function prive.fin_formation(bigint) from public;

create or replace function prive.place_suspendue(e bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(prive.solde_eleve(e) > 0 and (select x.formation_debut from public.eleves x where x.id = e) <= current_date - 30, false)
$$;

-- Prolonger : impossible tant que le délai n'a pas commencé
create or replace function public.formation_prolonger(p_eleve bigint)
returns date language plpgsql volatile security definer set search_path = '' as $$
declare f date; n date;
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la gérante et à la direction' using errcode = '42501'; end if;
  f := prive.fin_formation(p_eleve);
  if f is null then raise exception 'Le délai de 3 mois n''a pas encore commencé : il commence le jour où l''élève entre dans un groupe de code.'; end if;
  n := (greatest(f, current_date) + interval '1 month')::date;
  update public.eleves set prolonge_jusqu = n where id = p_eleve;
  insert into public.suivi (eleve_id, type, note) values (p_eleve, 'Note', 'Délai de formation prolongé jusqu''au ' || to_char(n, 'DD/MM/YYYY'));
  return n;
end $$;
revoke all on function public.formation_prolonger(bigint) from public, anon;
grant execute on function public.formation_prolonger(bigint) to authenticated;
