-- 0097 (5 nov. 2026) : une commande de matériel va toujours directement à la direction,
-- même si le prix n'est pas connu (il n'y a plus de gérante pour chercher le prix).
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
  if new.materiel_id is not null then
    new.etape := 'direction';
    new.transmis_le := case when prive.a_role(array['secretariat', 'moniteur']) then now() end;
    new.transmis_par := case when prive.a_role(array['secretariat', 'moniteur']) then auth.uid() end;
  elsif prive.a_role(array['secretariat', 'moniteur']) and new.montant is null and coalesce(new.nature, 'Autre') <> 'Carburant' then
    new.etape := 'equipe'; new.transmis_le := null; new.transmis_par := null;
  elsif prive.a_role(array['secretariat', 'moniteur']) then
    new.etape := 'direction'; new.transmis_le := now(); new.transmis_par := auth.uid();
  else
    new.etape := 'direction'; new.transmis_le := null; new.transmis_par := null;
  end if;
  return new;
end $function$;
