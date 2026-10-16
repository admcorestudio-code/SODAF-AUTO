-- 0048 : dépenses (devis avant, facture après) et budget carburant (décisions du propriétaire, 16 octobre 2026)
-- Dépense ordinaire : DEVIS obligatoire avant l'accord de la direction, FACTURE ajoutée après le paiement.
-- Carburant : pas de facture à la pompe. Budget automatique = 2 000 F par bloc de conduite prévu dans la semaine,
-- plafond 35 000 F. Chaque plein : montant + photo du compteur. Au-delà du budget : demande d'accord (nature Carburant).

-- 1. Demandes de dépense : nature, devis, facture
alter table public.demandes
  add column if not exists nature text check (nature in ('Carburant', 'Autre')),
  add column if not exists devis text check (length(devis) <= 300),
  add column if not exists facture text check (length(facture) <= 300),
  add column if not exists facture_le timestamptz;

create or replace function prive.trg_depense_devis()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.type = 'Dépense' and coalesce(new.nature, 'Autre') <> 'Carburant' and coalesce(new.devis, '') = '' then
    raise exception 'Ajoute le devis (photo ou PDF).';
  end if;
  new.facture := null; new.facture_le := null;
  return new;
end $$;
drop trigger if exists depense_devis on public.demandes;
create trigger depense_devis before insert on public.demandes for each row execute function prive.trg_depense_devis();

create or replace function public.depense_facture(p_id bigint, p_chemin text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(p_chemin, '') = '' then raise exception 'Fichier manquant'; end if;
  update public.demandes set facture = p_chemin, facture_le = now()
   where id = p_id and statut = 'accordee' and type = 'Dépense'
     and (auteur = auth.uid() or prive.a_role(array['admin']))
     and prive.a_role(array['admin', 'gerant']);
  if not found then raise exception 'Dépense introuvable ou pas encore accordée'; end if;
end $$;
revoke all on function public.depense_facture(bigint, text) from public, anon;
grant execute on function public.depense_facture(bigint, text) to authenticated;

-- 2. Pleins de carburant
create table if not exists public.carburant (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  jour date not null default current_date,
  auteur uuid not null default auth.uid() references public.profils(id),
  montant integer not null check (montant between 500 and 200000),
  km integer check (km between 0 and 2000000),
  plein_complet boolean not null default false,
  photo text not null check (length(photo) between 3 and 300),
  note text check (length(note) <= 300)
);
alter table public.carburant enable row level security;
create policy "carburant : lire" on public.carburant for select to authenticated using (prive.a_role(array['admin', 'gerant']));
create policy "carburant : ajouter" on public.carburant for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant']) and auteur = auth.uid());

-- Budget d'une semaine (lundi) : blocs prévus, budget, dépensé, accordé en plus
create or replace function public.carburant_budget(p_lundi date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with b as (
    select count(*)::int n from (
      select distinct c.jour, c.heure from public.creneaux_conduite c
       where c.jour between p_lundi and p_lundi + 6 and c.eleve_id is not null
         and c.statut in ('Réservé', 'Fait', 'Absent')) x),
  d as (select coalesce(sum(montant), 0)::int s from public.carburant where jour between p_lundi and p_lundi + 6),
  e as (select coalesce(sum(montant), 0)::int s from public.demandes
         where type = 'Dépense' and nature = 'Carburant' and statut = 'accordee'
           and (le at time zone 'UTC')::date between p_lundi and p_lundi + 6)
  select case when prive.a_role(array['admin', 'gerant']) then
    jsonb_build_object('blocs', b.n, 'budget', least(35000, 2000 * b.n), 'par_bloc', 2000, 'plafond', 35000,
                       'depense', d.s, 'en_plus', e.s, 'reste', least(35000, 2000 * b.n) + e.s - d.s)
  end from b, d, e
$$;
revoke all on function public.carburant_budget(date) from public, anon;
grant execute on function public.carburant_budget(date) to authenticated;

-- Un plein ne peut pas dépasser le budget de la semaine (+ ce que la direction a accordé en plus)
create or replace function prive.trg_carburant_budget()
returns trigger language plpgsql security definer set search_path = '' as $$
declare l date := new.jour - ((extract(isodow from new.jour)::int) - 1); r jsonb;
begin
  r := public.carburant_budget(l);
  if r is null then raise exception 'Accès refusé'; end if;
  if new.montant > (r->>'reste')::int then
    raise exception 'Budget carburant dépassé (reste % F). Demande l''accord à la direction.', greatest(0, (r->>'reste')::int);
  end if;
  return new;
end $$;
drop trigger if exists carburant_budget on public.carburant;
create trigger carburant_budget before insert on public.carburant for each row execute function prive.trg_carburant_budget();

-- 3. Espace privé des pièces (devis, factures, photos du compteur) : direction et gérante
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('depenses', 'depenses', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
drop policy if exists "dépenses : ajouter une pièce" on storage.objects;
create policy "dépenses : ajouter une pièce" on storage.objects for insert to authenticated
  with check (bucket_id = 'depenses' and prive.a_role(array['admin', 'gerant']));
drop policy if exists "dépenses : voir les pièces" on storage.objects;
create policy "dépenses : voir les pièces" on storage.objects for select to authenticated
  using (bucket_id = 'depenses' and prive.a_role(array['admin', 'gerant']));

-- 4. Sauvegarde du dimanche : ajouter la table carburant
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''carburant''' in d) = 0 and position('''rapports''' in d) > 0 then
    d := replace(d, '''rapports''', '''rapports'',''carburant''');
    execute d;
  end if;
end $$;
