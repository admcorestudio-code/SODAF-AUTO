-- 0043 · Remise sur le dépôt de l'examen (décision du propriétaire, 13 octobre 2026)
-- La remise ne porte QUE sur le dépôt de l'examen d'État (35 000 F), jamais sur la formation.
-- Maximum 5 000 F par élève (l'élève paie au moins 30 000 F). Motif obligatoire.
-- Seules la direction et la gérante l'accordent ; la gérante n'a pas besoin d'accord :
-- chaque remise s'écrit toute seule dans le journal des décisions (catégorie Argent),
-- la direction est notifiée et peut mettre « À revoir ».
-- Le partenaire reçoit toujours 35 000 F par dossier : la remise est à la charge de SODAF.

alter table public.eleves
  add column if not exists examen_remise integer not null default 0 check (examen_remise between 0 and 5000),
  add column if not exists examen_remise_motif text check (length(examen_remise_motif) <= 120),
  add column if not exists examen_remise_par uuid references public.profils(id),
  add column if not exists examen_remise_le timestamptz;

-- Personne ne touche aux colonnes de la remise en direct : seulement par la fonction ci-dessous
create or replace function prive.trg_remise_garde()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.examen_remise, new.examen_remise_motif, new.examen_remise_par, new.examen_remise_le)
     is distinct from (old.examen_remise, old.examen_remise_motif, old.examen_remise_par, old.examen_remise_le)
     and coalesce(current_setting('sodaf.remise', true), '') <> '1' then
    raise exception 'la remise se donne seulement avec le bouton « Remise sur l''examen »' using errcode = '42501';
  end if;
  -- Nouveau passage à l'étape examen (1re fois, retour de formation ou repassage) : nouveau dépôt, sans remise
  if new.examen_etape = 'pret' and old.examen_etape is distinct from 'pret' then
    new.examen_remise := 0; new.examen_remise_motif := null; new.examen_remise_par := null; new.examen_remise_le := null;
  end if;
  return new;
end $$;
revoke all on function prive.trg_remise_garde() from public;
create trigger eleve_remise_garde before update on public.eleves for each row execute function prive.trg_remise_garde();

-- Accorder (ou retirer avec 0) la remise, tant que le dépôt n'est pas encore payé
create or replace function public.examen_remise_accorder(p_eleve bigint, p_montant integer, p_motif text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare e record; m text := nullif(trim(coalesce(p_motif, '')), ''); txt text;
  r text := case when p_montant >= 1000 then (p_montant / 1000) || ' ' || lpad((p_montant % 1000)::text, 3, '0') else p_montant::text end;
  d text := ((35000 - coalesce(p_montant, 0)) / 1000) || ' ' || lpad(((35000 - coalesce(p_montant, 0)) % 1000)::text, 3, '0');
begin
  if not prive.a_role(array['admin', 'gerant']) then
    raise exception 'réservé à la direction et à la gérante' using errcode = '42501';
  end if;
  if p_montant is null or p_montant < 0 or p_montant > 5000 or p_montant % 500 <> 0 then
    raise exception 'remise entre 0 et 5 000 F (par tranches de 500 F)';
  end if;
  if p_montant > 0 and (m is null or length(m) > 120) then raise exception 'motif obligatoire'; end if;
  select id, nom, examen_etape, examen_paye, examen_remise into e from public.eleves where id = p_eleve for update;
  if not found then raise exception 'élève introuvable'; end if;
  if e.examen_etape is distinct from 'pret' or coalesce(e.examen_paye, false) then
    raise exception 'remise possible seulement avant le reçu du dépôt d''examen';
  end if;
  if p_montant = coalesce(e.examen_remise, 0) and p_montant = 0 then return; end if;
  perform set_config('sodaf.remise', '1', true);
  update public.eleves set
    examen_remise = p_montant,
    examen_remise_motif = case when p_montant > 0 then m end,
    examen_remise_par = case when p_montant > 0 then auth.uid() end,
    examen_remise_le = case when p_montant > 0 then now() end
  where id = p_eleve;
  perform set_config('sodaf.remise', '', true);
  txt := case when p_montant > 0
    then 'Remise examen ' || r || ' F à SO' || e.id || ' (' || e.nom || ') : dépôt ' || d || ' F au lieu de 35 000 F. Motif : ' || m
    else 'Remise examen retirée pour SO' || e.id || ' (' || e.nom || ') : dépôt 35 000 F' end;
  insert into public.decisions (auteur, categorie, texte) values (auth.uid(), 'Argent', left(txt, 600));
  insert into public.suivi (eleve_id, type, note) values (e.id, 'Note', left(txt, 500));
end $$;
revoke all on function public.examen_remise_accorder(bigint, integer, text) from public, anon;
grant execute on function public.examen_remise_accorder(bigint, integer, text) to authenticated;
