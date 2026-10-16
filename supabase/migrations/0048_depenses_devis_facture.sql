-- 0048 : dépenses avec devis et facture (décision du propriétaire, 16 octobre 2026)
-- Avant l'accord : un DEVIS (photo ou PDF), obligatoire sauf pour le carburant.
-- Après l'accord et le paiement : la FACTURE ou le reçu (ticket de la station pour le carburant).

alter table public.demandes
  add column if not exists nature text check (nature in ('Carburant', 'Autre')),
  add column if not exists devis text check (length(devis) <= 300),
  add column if not exists facture text check (length(facture) <= 300),
  add column if not exists facture_le timestamptz;

-- Nouvelle demande de dépense : devis obligatoire, sauf carburant
create or replace function prive.trg_depense_devis()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.type = 'Dépense' and coalesce(new.nature, 'Autre') <> 'Carburant' and coalesce(new.devis, '') = '' then
    raise exception 'Ajoute le devis (photo ou PDF).';
  end if;
  new.facture := null; new.facture_le := null; -- la facture vient après l'accord
  return new;
end $$;
drop trigger if exists depense_devis on public.demandes;
create trigger depense_devis before insert on public.demandes for each row execute function prive.trg_depense_devis();

-- Ajouter la facture : l'auteur (gérante) ou la direction, seulement si la dépense est accordée
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

-- Espace privé des pièces (devis, factures) : direction et gérante seulement
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('depenses', 'depenses', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
drop policy if exists "dépenses : ajouter une pièce" on storage.objects;
create policy "dépenses : ajouter une pièce" on storage.objects for insert to authenticated
  with check (bucket_id = 'depenses' and prive.a_role(array['admin', 'gerant']));
drop policy if exists "dépenses : voir les pièces" on storage.objects;
create policy "dépenses : voir les pièces" on storage.objects for select to authenticated
  using (bucket_id = 'depenses' and prive.a_role(array['admin', 'gerant']));
