-- SODAF · 19 octobre 2026 · Annulation d'un reçu : le secrétariat demande, la gérante confirme ou refuse.
-- Le secrétariat ne peut toujours pas annuler lui-même (0047). Il touche « Demander l'annulation » avec la raison ;
-- la gérante (ou la direction) touche « Confirmer » (le reçu est annulé avec cette raison) ou « Refuser ».
-- Idempotent.

alter table public.paiements add column if not exists annul_dem_motif text check (annul_dem_motif is null or length(annul_dem_motif) <= 200);
alter table public.paiements add column if not exists annul_dem_le timestamptz;
alter table public.paiements add column if not exists annul_dem_par uuid references public.profils(id);
alter table public.paiements add column if not exists annul_refus_le timestamptz;
alter table public.paiements add column if not exists annul_refus_motif text check (annul_refus_motif is null or length(annul_refus_motif) <= 200);

-- Le refus ne s'écrit que par la gérante ou la direction
create or replace function prive.trg_annulation_garde()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.annule is distinct from old.annule or new.annule_motif is distinct from old.annule_motif or new.annule_le is distinct from old.annule_le
      or new.annul_refus_le is distinct from old.annul_refus_le or new.annul_refus_motif is distinct from old.annul_refus_motif)
     and not prive.a_role(array['admin', 'gerant']) then
    raise exception 'Seule la gérante peut annuler un reçu.';
  end if;
  return new;
end $$;

create or replace function public.recu_annulation_demander(p_id bigint, p_motif text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare p public.paiements; m text := trim(coalesce(p_motif, ''));
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if length(m) < 3 then raise exception 'Écris la raison.'; end if;
  select * into p from public.paiements where id = p_id for update;
  if not found then raise exception 'reçu introuvable'; end if;
  if p.annule then raise exception 'Ce reçu est déjà annulé.'; end if;
  if p.annul_dem_le is not null and (p.annul_refus_le is null or p.annul_refus_le < p.annul_dem_le) then raise exception 'Annulation déjà demandée : la gérante doit répondre.'; end if;
  update public.paiements set annul_dem_motif = left(m, 200), annul_dem_le = clock_timestamp(), annul_dem_par = auth.uid() where id = p_id;
  perform prive.notifier(jsonb_build_object('type', 'annulation', 'id', p_id));
end $$;
revoke all on function public.recu_annulation_demander(bigint, text) from public, anon;
grant execute on function public.recu_annulation_demander(bigint, text) to authenticated;

create or replace function public.recu_annulation_decider(p_id bigint, p_ok boolean, p_note text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare p public.paiements;
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'Seule la gérante peut annuler un reçu.' using errcode = '42501'; end if;
  select * into p from public.paiements where id = p_id for update;
  if not found then raise exception 'reçu introuvable'; end if;
  if p.annule then raise exception 'Ce reçu est déjà annulé.'; end if;
  if p.annul_dem_le is null or (p.annul_refus_le is not null and p.annul_refus_le >= p.annul_dem_le) then raise exception 'Pas de demande en attente pour ce reçu.'; end if;
  if p_ok then
    update public.paiements set annule = true, annule_motif = p.annul_dem_motif, annule_le = now() where id = p_id;
  else
    update public.paiements set annul_refus_le = clock_timestamp(), annul_refus_motif = nullif(left(trim(coalesce(p_note, '')), 200), '') where id = p_id;
  end if;
  perform prive.notifier(jsonb_build_object('type', 'annulation_reponse', 'id', p_id));
end $$;
revoke all on function public.recu_annulation_decider(bigint, boolean, text) from public, anon;
grant execute on function public.recu_annulation_decider(bigint, boolean, text) to authenticated;
