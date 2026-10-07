-- 0042 · Parrainage ouvert à tous (décision du 7 octobre 2026)
-- N'importe qui parraine n'importe qui. Le filleul donne le code de son parrain : son n° client (SO…)
-- s'il est déjà client SODAF, sinon son numéro de téléphone. Le parrain reçoit 2 000 F par filleul inscrit,
-- par Mixx by Yas ou Moov Money, seulement après le reçu d'inscription du filleul.
-- La commission apparaît toute seule (« à payer ») au premier reçu d'inscription ; la direction ou la gérante
-- la marque « payée » avec le moyen et la référence. Reçu annulé avant paiement : commission « annulée ».
-- Rien ne se supprime.

-- 1. Le code parrain sur la fiche du filleul (texte saisi) + parrain reconnu (client SODAF ou téléphone)
alter table public.eleves
  add column if not exists parrain text check (length(parrain) <= 80),
  add column if not exists parrain_id bigint references public.eleves(id),
  add column if not exists parrain_tel text check (parrain_tel ~ '^\+228[0-9]{8}$');

create or replace function prive.trg_parrain()
returns trigger language plpgsql security definer set search_path = public as $$
declare v text := upper(regexp_replace(coalesce(new.parrain, ''), '\s', '', 'g')); d text; pid bigint;
begin
  if tg_op = 'UPDATE' and new.parrain is not distinct from old.parrain then return new; end if;
  new.parrain_id := null; new.parrain_tel := null;
  if v = '' then new.parrain := null; return new; end if;
  if v ~ '^SO[0-9]{1,9}$' then
    select id into pid from eleves where id = substr(v, 3)::bigint;
  else
    d := right(regexp_replace(v, '\D', '', 'g'), 8);
    if length(d) = 8 then
      new.parrain_tel := '+228' || d;
      select id into pid from eleves where telephone = '+228' || d order by id limit 1;
    end if;
  end if;
  if pid is not null and pid is distinct from new.id then
    new.parrain_id := pid;
    new.parrain_tel := coalesce(new.parrain_tel, (select telephone from eleves where id = pid));
  end if;
  if new.parrain_tel = new.telephone then new.parrain_id := null; new.parrain_tel := null; end if;  -- pas d'auto-parrainage
  return new;
end $$;
revoke all on function prive.trg_parrain() from public;
drop trigger if exists eleve_parrain on public.eleves;
create trigger eleve_parrain before insert or update of parrain on public.eleves
  for each row execute function prive.trg_parrain();

-- 2. Les commissions
create table if not exists public.commissions (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  filleul_id bigint not null unique references public.eleves(id),
  parrain_id bigint references public.eleves(id),
  parrain_nom text check (length(parrain_nom) <= 80),
  parrain_tel text check (parrain_tel ~ '^\+228[0-9]{8}$'),
  montant int not null default 2000 check (montant between 0 and 100000),
  statut text not null default 'a_payer' check (statut in ('a_payer', 'payee', 'annulee')),
  paye_le timestamptz,
  paye_par uuid references public.profils(id),
  mode text check (mode in ('Mixx by Yas', 'Moov Money', 'Espèces')),
  reference text check (length(reference) <= 60),
  note text check (length(note) <= 300)
);
alter table public.commissions enable row level security;
create policy "gérance : voir les commissions" on public.commissions for select to authenticated
  using (prive.a_role(array['admin', 'gerant', 'secretariat']));
-- Pas d'écriture directe : la base crée les commissions, les fonctions les modifient.

-- 3. Au premier reçu d'inscription du filleul : commission à payer ; reçu annulé avant paiement : commission annulée
create or replace function prive.trg_commission()
returns trigger language plpgsql security definer set search_path = public as $$
declare el record;
begin
  if new.eleve_id is null or new.motif not like 'Droit d''inscription%' then return new; end if;
  if tg_op = 'INSERT' and not coalesce(new.annule, false) then
    select * into el from eleves where id = new.eleve_id;
    if el.parrain_tel is not null or el.parrain_id is not null then
      insert into commissions (filleul_id, parrain_id, parrain_nom, parrain_tel)
      values (el.id, el.parrain_id, (select nom from eleves where id = el.parrain_id), el.parrain_tel)
      on conflict (filleul_id) do nothing;
    end if;
  elsif tg_op = 'UPDATE' and coalesce(new.annule, false) and not coalesce(old.annule, false)
        and not exists (select 1 from paiements p where p.eleve_id = new.eleve_id and p.id <> new.id and not coalesce(p.annule, false) and p.motif like 'Droit d''inscription%') then
    update commissions set statut = 'annulee', note = 'Reçu d''inscription annulé' where filleul_id = new.eleve_id and statut = 'a_payer';
  end if;
  return new;
end $$;
revoke all on function prive.trg_commission() from public;
drop trigger if exists paiement_commission on public.paiements;
create trigger paiement_commission after insert or update of annule on public.paiements
  for each row execute function prive.trg_commission();

-- 4. Marquer une commission payée (direction, gérante)
create or replace function public.commission_payer(p_id bigint, p_mode text, p_reference text)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la direction et à la gérante' using errcode = '42501'; end if;
  update commissions set statut = 'payee', paye_le = now(), paye_par = auth.uid(), mode = p_mode, reference = nullif(trim(coalesce(p_reference, '')), '')
   where id = p_id and statut = 'a_payer';
  if not found then raise exception 'Cette commission n''est plus à payer.'; end if;
end $$;
revoke all on function public.commission_payer(bigint, text, text) from public, anon;
grant execute on function public.commission_payer(bigint, text, text) to authenticated;

-- 5. Filleuls déjà inscrits avec un code parrain (aucun aujourd'hui, mais la règle est la même)
insert into public.commissions (filleul_id, parrain_id, parrain_nom, parrain_tel)
select e.id, e.parrain_id, (select nom from public.eleves where id = e.parrain_id), e.parrain_tel
  from public.eleves e
 where (e.parrain_tel is not null or e.parrain_id is not null)
   and exists (select 1 from public.paiements p where p.eleve_id = e.id and not coalesce(p.annule, false) and p.motif like 'Droit d''inscription%')
on conflict (filleul_id) do nothing;

-- 6. Sauvegarde : ajouter les commissions
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''commissions''' in d) = 0 then
    d := replace(d, '''equipes_conduite''', '''equipes_conduite'',''commissions''');
    execute d;
  end if;
end $$;
