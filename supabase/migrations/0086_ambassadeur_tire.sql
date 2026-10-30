-- 0086 · L'Ambassadeur tire le gagnant pendant le live TikTok (30 oct. 2026, décision du propriétaire)
-- La direction peut aussi tirer. Le secrétariat vérifie la carte d'étudiant. Un seul gagnant « à vérifier » à la fois (règle aussi dans la base).
create or replace function public.tirage_tirer(p_campagne text)
 returns bigint language plpgsql security definer set search_path to '' as $function$
declare g bigint;
begin
  if not prive.a_role(array['admin', 'gerant', 'ambassadeur']) then raise exception 'Seuls la direction et l''Ambassadeur tirent le gagnant.' using errcode = '42501'; end if;
  if (select count(*) from public.tirage_participants where campagne = p_campagne and statut = 'valide') >= 2 then raise exception 'Les 2 gagnants de ce mois sont déjà validés.'; end if;
  if exists (select 1 from public.tirage_participants where campagne = p_campagne and statut = 'gagnant') then raise exception 'Le secrétariat doit d''abord vérifier la carte du gagnant tiré.'; end if;
  select id into g from public.tirage_participants where campagne = p_campagne and statut = 'inscrit' order by random() limit 1 for update skip locked;
  if g is null then raise exception 'Plus aucun participant à tirer pour ce mois.'; end if;
  update public.tirage_participants set statut = 'gagnant', tire_le = now(), tire_par = auth.uid() where id = g;
  return g;
end $function$;

-- Pour le live de l'Ambassadeur : prénom, initiale du nom, université et état seulement (ni téléphone ni carte)
create or replace function public.tirage_live(p_campagne text)
 returns table (id bigint, prenoms text, nom text, universite text, statut text, tire_le timestamptz)
 language sql stable security definer set search_path to '' as $function$
  select t.id, t.prenoms, left(t.nom, 1), t.universite, t.statut, t.tire_le
    from public.tirage_participants t
   where t.campagne = p_campagne and prive.a_role(array['admin', 'gerant', 'secretariat', 'ambassadeur'])
   order by t.id
$function$;
