-- 0050 : demandes de l'équipe (décision du propriétaire, 16 octobre 2026)
-- Le secrétariat et le moniteur ajoutent les pleins et font leurs demandes de dépense (essence en plus, devis).
-- Leurs demandes arrivent chez la GÉRANTE (« Demandes de l'équipe ») : elle les transfère à la direction ou les refuse.
-- Les demandes de la gérante vont directement à la direction. La direction ne voit que ce qui lui est transmis.
-- Seul le MONITEUR ajoute les pleins (il est dans la voiture). Celui qui a demandé ajoute la facture (la gérante aussi).
-- (Remplace 0049.)

-- 1. Étape de la demande
alter table public.demandes
  add column if not exists etape text not null default 'direction' check (etape in ('equipe', 'direction')),
  add column if not exists transmis_le timestamptz,
  add column if not exists transmis_par uuid references public.profils(id);

create or replace function prive.trg_depense_devis()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.type = 'Dépense' and coalesce(new.nature, 'Autre') <> 'Carburant' and coalesce(new.devis, '') = '' then
    raise exception 'Ajoute le devis (photo ou PDF).';
  end if;
  new.facture := null; new.facture_le := null;
  new.etape := case when prive.a_role(array['secretariat', 'moniteur']) then 'equipe' else 'direction' end;
  new.transmis_le := null; new.transmis_par := null;
  return new;
end $$;

drop policy if exists "gérance : faire une demande" on public.demandes;
drop policy if exists "dépenses : faire une demande" on public.demandes;
create policy "dépenses : faire une demande" on public.demandes for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) and auteur = auth.uid()
              and statut = 'attente' and reponse is null and repondu_le is null and repondu_par is null
              and (type = 'Dépense' or prive.a_role(array['admin', 'gerant'])));

drop policy if exists "gérance : lire demandes" on public.demandes;
drop policy if exists "dépenses : lire" on public.demandes;
create policy "dépenses : lire" on public.demandes for select to authenticated
  using (prive.a_role(array['gerant']) or (prive.a_role(array['admin']) and etape = 'direction') or auteur = auth.uid());

-- 2. La gérante transfère ou refuse une demande de l'équipe
create or replace function public.demande_transmettre(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['gerant', 'admin']) then raise exception 'réservé à la gérante' using errcode = '42501'; end if;
  update public.demandes set etape = 'direction', transmis_le = now(), transmis_par = auth.uid()
   where id = p_id and etape = 'equipe' and statut = 'attente';
  if not found then raise exception 'demande introuvable ou déjà traitée'; end if;
  perform prive.notifier(jsonb_build_object('type', 'demande', 'id', p_id));
end $$;
revoke all on function public.demande_transmettre(bigint) from public, anon;
grant execute on function public.demande_transmettre(bigint) to authenticated;

create or replace function public.demande_refuser(p_id bigint, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['gerant', 'admin']) then raise exception 'réservé à la gérante' using errcode = '42501'; end if;
  update public.demandes set statut = 'refusee', reponse = nullif(trim(coalesce(p_note, '')), ''), repondu_le = now(), repondu_par = auth.uid()
   where id = p_id and etape = 'equipe' and statut = 'attente';
  if not found then raise exception 'demande introuvable ou déjà traitée'; end if;
  perform prive.notifier(jsonb_build_object('type', 'demande_reponse', 'id', p_id));
end $$;
revoke all on function public.demande_refuser(bigint, text) from public, anon;
grant execute on function public.demande_refuser(bigint, text) to authenticated;

-- La direction ne répond qu'aux demandes qui lui sont transmises
create or replace function public.demande_repondre(p_id bigint, p_accord boolean, p_note text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  update public.demandes set statut = case when p_accord then 'accordee' else 'refusee' end,
         reponse = nullif(trim(coalesce(p_note, '')), ''), repondu_le = now(), repondu_par = auth.uid()
   where id = p_id and statut = 'attente' and etape = 'direction';
  if not found then raise exception 'demande introuvable ou déjà traitée'; end if;
  perform prive.notifier(jsonb_build_object('type', 'demande_reponse', 'id', p_id));
end $$;

-- Notification à la création : équipe → gérante ; gérante → direction
create or replace function prive.trg_gerance()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'demandes' and new.etape = 'equipe' then
    perform prive.notifier(jsonb_build_object('type', 'demande_equipe', 'id', new.id));
  else
    perform prive.notifier(jsonb_build_object('type', case tg_table_name when 'demandes' then 'demande' when 'decisions' then 'decision' else 'rapport' end, 'id', new.id));
  end if;
  return new;
end $$;

-- 3. Pleins de carburant : seul le moniteur en ajoute (la direction peut corriger) ; tout le monde voit le budget
drop policy if exists "carburant : lire" on public.carburant;
create policy "carburant : lire" on public.carburant for select to authenticated
  using (prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']));
drop policy if exists "carburant : ajouter" on public.carburant;
create policy "carburant : ajouter" on public.carburant for insert to authenticated
  with check (prive.a_role(array['admin', 'moniteur']) and auteur = auth.uid());

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
  select case when prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) then
    jsonb_build_object('blocs', b.n, 'budget', least(35000, 2000 * b.n), 'par_bloc', 2000, 'plafond', 35000,
                       'depense', d.s, 'en_plus', e.s, 'reste', least(35000, 2000 * b.n) + e.s - d.s)
  end from b, d, e
$$;

create or replace function prive.trg_carburant_budget()
returns trigger language plpgsql security definer set search_path = '' as $$
declare l date := new.jour - ((extract(isodow from new.jour)::int) - 1); r jsonb;
begin
  r := public.carburant_budget(l);
  if r is null then raise exception 'Accès refusé'; end if;
  if new.montant > (r->>'reste')::int then
    raise exception 'Budget carburant dépassé (reste % F). Demande de l''essence en plus.', greatest(0, (r->>'reste')::int);
  end if;
  return new;
end $$;

-- 4. Facture : celui qui a demandé l'ajoute (la gérante et la direction aussi)
create or replace function public.depense_facture(p_id bigint, p_chemin text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(p_chemin, '') = '' then raise exception 'Fichier manquant'; end if;
  update public.demandes set facture = p_chemin, facture_le = now()
   where id = p_id and statut = 'accordee' and type = 'Dépense'
     and (auteur = auth.uid() or prive.a_role(array['admin', 'gerant']));
  if not found then raise exception 'Dépense introuvable ou pas encore accordée'; end if;
end $$;

-- 5. Pièces : le secrétariat et le moniteur envoient photo du compteur, devis et factures (sans lire les autres pièces)
drop policy if exists "dépenses : photo du compteur (moniteur)" on storage.objects;
drop policy if exists "dépenses : pièces de l'équipe" on storage.objects;
create policy "dépenses : pièces de l'équipe" on storage.objects for insert to authenticated
  with check (bucket_id = 'depenses' and (storage.foldername(name))[1] in ('compteur', 'devis', 'factures')
              and prive.a_role(array['secretariat', 'moniteur']));
