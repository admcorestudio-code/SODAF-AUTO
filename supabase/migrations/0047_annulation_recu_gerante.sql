-- 0047 : seule la gérante (ou la direction) annule un reçu (décision du propriétaire, 16 octobre 2026)
-- Le secrétariat garde le droit de faire les reçus, mais ne peut plus les annuler : il le demande à la gérante.
create or replace function prive.trg_annulation_garde()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.annule is distinct from old.annule or new.annule_motif is distinct from old.annule_motif or new.annule_le is distinct from old.annule_le)
     and not prive.a_role(array['admin', 'gerant']) then
    raise exception 'Seule la gérante peut annuler un reçu.';
  end if;
  return new;
end $$;
drop trigger if exists annulation_garde on public.paiements;
create trigger annulation_garde before update on public.paiements for each row execute function prive.trg_annulation_garde();
