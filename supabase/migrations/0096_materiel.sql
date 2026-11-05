-- 0096 (5 nov. 2026) : Matériel de l'entreprise (inventaire) et commandes de matériel.
-- Une commande de matériel est une demande de dépense ordinaire (même circuit : gérante, direction,
-- tâche « payer », facture), reliée à l'objet. Pas de devis obligatoire : le prix vient de l'inventaire.
-- Jamais de suppression : un objet qui n'existe plus est « retiré » (actif = false).

create table public.materiel (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  par uuid default auth.uid() references public.profils(id),
  nom text not null check (length(nom) between 2 and 80),
  categorie text not null default 'Agence' check (categorie in ('Agence', 'Voiture', 'Élèves', 'Communication')),
  quantite integer not null default 1 check (quantite between 0 and 100000),
  prix integer check (prix is null or prix between 0 and 100000000),
  prix_par text not null default 'unite' check (prix_par in ('unite', 'total')),
  etat text not null default 'bon' check (etat in ('bon', 'use', 'casse', 'manquant')),
  seuil integer check (seuil is null or seuil between 0 and 100000),
  note text check (length(note) <= 300),
  actif boolean not null default true,
  modifie_le timestamptz,
  modifie_par uuid references public.profils(id)
);
alter table public.materiel enable row level security;

create policy "matériel : lire" on public.materiel for select to authenticated
  using (prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']));
create policy "matériel : ajouter (direction)" on public.materiel for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant']) and actif);
create policy "matériel : modifier (direction)" on public.materiel for update to authenticated
  using (prive.a_role(array['admin', 'gerant'])) with check (prive.a_role(array['admin', 'gerant']));
grant select, insert, update on public.materiel to authenticated;

create or replace function prive.trg_materiel_modif() returns trigger language plpgsql security definer set search_path to '' as $$
begin
  new.modifie_le := now(); new.modifie_par := auth.uid(); new.le := old.le; new.par := old.par;
  return new;
end $$;
create trigger materiel_modif before update on public.materiel for each row execute function prive.trg_materiel_modif();

-- Le secrétariat et le moniteur mettent à jour la quantité et l'état (pas le nom ni le prix)
create or replace function public.materiel_maj(p_id bigint, p_quantite integer, p_etat text) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  if p_quantite is null or p_quantite < 0 or p_quantite > 100000 then raise exception 'Quantité invalide.'; end if;
  if p_etat not in ('bon', 'use', 'casse', 'manquant') then raise exception 'État invalide.'; end if;
  update public.materiel set quantite = p_quantite, etat = p_etat where id = p_id and actif;
  if not found then raise exception 'Objet introuvable.'; end if;
end $$;
revoke all on function public.materiel_maj(bigint, integer, text) from public, anon;
grant execute on function public.materiel_maj(bigint, integer, text) to authenticated;

-- Commandes : la demande de dépense garde l'objet et la quantité
alter table public.demandes
  add column materiel_id bigint references public.materiel(id),
  add column materiel_qte integer check (materiel_qte is null or materiel_qte between 1 and 100000),
  add column materiel_recu_le timestamptz,
  add column materiel_recu_par uuid references public.profils(id);

-- Devis : pas obligatoire pour une commande de matériel dont le prix est connu
create or replace function prive.trg_depense_devis()
 returns trigger language plpgsql security definer set search_path to ''
as $function$
begin
  if new.materiel_id is not null and (new.materiel_qte is null or new.type <> 'Dépense') then
    raise exception 'Commande de matériel incomplète.';
  end if;
  if new.type = 'Dépense' and coalesce(new.nature, 'Autre') <> 'Carburant' and coalesce(new.devis, '') = ''
     and new.materiel_id is null
     and not (new.montant is null and prive.a_role(array['secretariat'])) then
    raise exception 'Ajoute le devis (photo ou PDF).';
  end if;
  new.facture := null; new.facture_le := null; new.materiel_recu_le := null; new.materiel_recu_par := null;
  if prive.a_role(array['secretariat', 'moniteur']) and new.montant is null and coalesce(new.nature, 'Autre') <> 'Carburant' then
    new.etape := 'equipe'; new.transmis_le := null; new.transmis_par := null;
  elsif prive.a_role(array['secretariat', 'moniteur']) then
    new.etape := 'direction'; new.transmis_le := now(); new.transmis_par := auth.uid();
  else
    new.etape := 'direction'; new.transmis_le := null; new.transmis_par := null;
  end if;
  return new;
end $function$;

-- Commander : le prix est calculé ici, à partir de l'inventaire
create or replace function public.materiel_commander(p_id bigint, p_quantite integer, p_raison text, p_note text default null) returns bigint
language plpgsql security definer set search_path to '' as $$
declare m public.materiel; v_mt integer; v_id bigint; v_tx text;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  if p_quantite is null or p_quantite < 1 or p_quantite > 100000 then raise exception 'Quantité invalide.'; end if;
  if p_raison not in ('Manquant', 'Cassé', 'Stock bas', 'Autre') then raise exception 'Raison invalide.'; end if;
  select * into m from public.materiel where id = p_id and actif; if not found then raise exception 'Objet introuvable.'; end if;
  if exists (select 1 from public.demandes where materiel_id = p_id and statut = 'attente') then raise exception 'Une commande de cet objet attend déjà une réponse.'; end if;
  v_mt := case when m.prix is null or m.prix = 0 then null when m.prix_par = 'unite' then m.prix * p_quantite else m.prix end;
  v_tx := left('Matériel : ' || m.nom || ' × ' || p_quantite || ' (' || lower(p_raison) || ')' || coalesce(' : ' || nullif(trim(p_note), ''), ''), 600);
  -- insertion au nom de la personne (auteur = auth.uid()), comme une demande de dépense faite à la main
  insert into public.demandes (auteur, type, nature, montant, texte, voiture, materiel_id, materiel_qte)
  values (auth.uid(), 'Dépense', 'Autre', v_mt, v_tx, m.categorie = 'Voiture', p_id, p_quantite)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.materiel_commander(bigint, integer, text, text) from public, anon;
grant execute on function public.materiel_commander(bigint, integer, text, text) to authenticated;

-- Reçu : la quantité commandée s'ajoute au stock, l'objet repasse en bon état
create or replace function public.materiel_recu(p_demande bigint) returns void
language plpgsql security definer set search_path to '' as $$
declare d public.demandes;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into d from public.demandes where id = p_demande for update;
  if not found or d.materiel_id is null then raise exception 'Commande introuvable.'; end if;
  if d.statut <> 'accordee' then raise exception 'La commande n''est pas encore accordée.'; end if;
  if d.materiel_recu_le is not null then raise exception 'Déjà ajouté au stock.'; end if;
  update public.materiel set quantite = least(100000, quantite + d.materiel_qte), etat = 'bon' where id = d.materiel_id;
  update public.demandes set materiel_recu_le = now(), materiel_recu_par = auth.uid() where id = p_demande;
end $$;
revoke all on function public.materiel_recu(bigint) from public, anon;
grant execute on function public.materiel_recu(bigint) to authenticated;

-- Les commandes de matériel, pour l'onglet Matériel (tout le monde y voit l'avancement)
create or replace function public.materiel_commandes() returns table (id bigint, le timestamptz, auteur uuid, materiel_id bigint, materiel_qte integer, montant integer, texte text, statut text, etape text, reponse text, materiel_recu_le timestamptz)
language sql stable security definer set search_path to '' as $$
  select d.id, d.le, d.auteur, d.materiel_id, d.materiel_qte, d.montant, d.texte, d.statut, d.etape, d.reponse, d.materiel_recu_le
    from public.demandes d
   where d.materiel_id is not null and prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur'])
   order by d.le desc limit 100
$$;
revoke all on function public.materiel_commandes() from public, anon;
grant execute on function public.materiel_commandes() to authenticated;
