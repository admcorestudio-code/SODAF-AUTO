-- 0060 · Demande de dépense « montant inconnu » (décision du propriétaire, 20 oct. 2026)
-- Le secrétariat peut signaler un besoin sans connaître le prix (ex. une pièce cassée) : pas de montant, pas de devis obligatoire
-- (photo facultative). La gérante trouve le prix : elle écrit le montant et ajoute le devis (demande_prix), puis transfère.
-- La direction ne reçoit jamais une demande sans montant ni devis. Idempotent.

create or replace function prive.trg_depense_devis()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.type = 'Dépense' and coalesce(new.nature, 'Autre') <> 'Carburant' and coalesce(new.devis, '') = ''
     and not (new.montant is null and prive.a_role(array['secretariat'])) then
    raise exception 'Ajoute le devis (photo ou PDF).';
  end if;
  new.facture := null; new.facture_le := null;
  new.etape := case when prive.a_role(array['secretariat', 'moniteur']) then 'equipe' else 'direction' end;
  new.transmis_le := null; new.transmis_par := null;
  return new;
end $$;

-- La gérante écrit le prix trouvé et ajoute le devis (obligatoire s'il n'y a encore aucune pièce)
create or replace function public.demande_prix(p_id bigint, p_montant int, p_devis text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare d public.demandes;
begin
  if not prive.a_role(array['gerant', 'admin']) then raise exception 'réservé à la gérante' using errcode = '42501'; end if;
  if p_montant is null or p_montant <= 0 then raise exception 'Écris le montant.'; end if;
  select * into d from public.demandes where id = p_id for update;
  if not found or d.etape <> 'equipe' or d.statut <> 'attente' then raise exception 'demande introuvable ou déjà traitée'; end if;
  if nullif(trim(coalesce(p_devis, '')), '') is null and coalesce(d.devis, '') = '' then raise exception 'Ajoute le devis (photo ou PDF).'; end if;
  if p_devis is not null and p_devis not like 'devis/%' then raise exception 'pièce invalide'; end if;
  update public.demandes set montant = p_montant, devis = coalesce(nullif(trim(p_devis), ''), devis) where id = p_id;
end $$;
revoke all on function public.demande_prix(bigint, int, text) from public, anon;
grant execute on function public.demande_prix(bigint, int, text) to authenticated;

-- Transfert à la direction : seulement avec un montant et un devis
create or replace function public.demande_transmettre(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare d public.demandes;
begin
  if not prive.a_role(array['gerant', 'admin']) then raise exception 'réservé à la gérante' using errcode = '42501'; end if;
  select * into d from public.demandes where id = p_id;
  if found and d.type = 'Dépense' and coalesce(d.nature, 'Autre') <> 'Carburant' and (d.montant is null or coalesce(d.devis, '') = '') then
    raise exception 'Montant inconnu : écris d''abord le prix et ajoute le devis.';
  end if;
  update public.demandes set etape = 'direction', transmis_le = now(), transmis_par = auth.uid()
   where id = p_id and etape = 'equipe' and statut = 'attente';
  if not found then raise exception 'demande introuvable ou déjà traitée'; end if;
  perform prive.notifier(jsonb_build_object('type', 'demande', 'id', p_id));
end $$;
revoke all on function public.demande_transmettre(bigint) from public, anon;
grant execute on function public.demande_transmettre(bigint) to authenticated;
