-- 0118 · Tirage : plus de photo de la carte d'étudiant à l'inscription (décision du propriétaire, 19 nov. 2026)
-- « Des fois, il y a des élèves, ils n'ont pas la carte d'étudiant sur le moment. Celui qui gagne viendra avec sa carte. »
-- La carte (et la carte d'identité) est vérifiée à l'agence par le gagnant, sous 48 h, comme le dit le règlement.
-- La photo devient facultative (les anciennes inscriptions gardent la leur). Rien n'est supprimé. Idempotent.
alter table public.tirage_participants alter column carte_photo drop not null;

create or replace function public.tirage_participer(p_nom text, p_prenoms text, p_telephone text, p_universite text, p_photo text default null)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare c text := prive.tirage_campagne(); t text := '+228' || right(regexp_replace(coalesce(p_telephone, ''), '\D', '', 'g'), 8); n bigint; r record; ph text := nullif(trim(coalesce(p_photo, '')), '');
begin
  if not prive.tirage_ouvert() then raise exception 'C''est le jour du tirage : les inscriptions rouvrent demain pour le tirage suivant.'; end if;
  if t !~ '^\+228[0-9]{8}$' then raise exception 'Numéro de téléphone invalide (8 chiffres après le +228).'; end if;
  if ph is not null and ph not like c || '/%' then ph := null; end if;
  select id into r from public.tirage_participants where campagne = c and telephone = t;
  if found then
    select count(*) into n from public.tirage_participants where campagne = c and id <= r.id;
    return jsonb_build_object('numero', n, 'deja', true, 'campagne', c);
  end if;
  insert into public.tirage_participants (campagne, nom, prenoms, telephone, universite, carte_photo)
  values (c, upper(trim(p_nom)), trim(p_prenoms), t, trim(p_universite), ph);
  select count(*) into n from public.tirage_participants where campagne = c;
  return jsonb_build_object('numero', n, 'deja', false, 'campagne', c);
end $function$;
