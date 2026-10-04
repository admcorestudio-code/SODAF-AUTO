-- 0027 · Audit sécurité (4 octobre 2026)
-- 1. Fonctions d'aide : search_path fixé et non appelables depuis l'API (conseils Supabase).
-- 2. Rôles dans la base : seuls la direction et le secrétariat font ou annulent un reçu, et ouvrent ou ferment un groupe de code.
--    (Le moniteur garde tout ce dont il a besoin : élèves, présences, cours, conduite, évaluation.)
-- 3. Sauvegardes complètes : suivi, inscriptions_web et groupes_code ajoutés aux exports.
-- Rien n'est supprimé.

alter function prive.en_code(public.eleves) set search_path = public;
alter function prive.theme_cours(int) set search_path = '';
alter function prive.cours_boucle(date, smallint[]) set search_path = public;
revoke all on function prive.semaine_boucle(date), prive.cours_boucle(date, smallint[]), prive.theme_cours(int), prive.en_code(public.eleves) from public, anon, authenticated;

create or replace function prive.a_role(r text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profils where id = auth.uid() and role = any (r))
$$;
revoke all on function prive.a_role(text[]) from public, anon;
grant execute on function prive.a_role(text[]) to authenticated;

alter policy "équipe : ajouter" on public.paiements with check (prive.a_role(array['admin', 'secretariat']));
alter policy "équipe : modifier" on public.paiements
  using (prive.a_role(array['admin', 'secretariat'])) with check (prive.a_role(array['admin', 'secretariat']));
alter policy "équipe : modifier" on public.groupes_code
  using (prive.a_role(array['admin', 'secretariat'])) with check (prive.a_role(array['admin', 'secretariat']));

create or replace function public.groupe_ouvrir(p_id text, p_actif boolean)
returns int language plpgsql volatile security definer set search_path = public as $$
declare fin date; n int := 0;
begin
  if not prive.a_role(array['admin', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  update groupes_code set actif = p_actif where id = p_id;
  if not found then return 0; end if;
  if p_actif then
    select coalesce(max(jour), current_date) into fin from creneaux_conduite;
    n := prive.seances_groupe(p_id, current_date, fin);
    update seances_code set statut = 'Prévu', note = null where groupe = p_id and jour >= current_date and statut = 'Annulé' and note = 'Groupe fermé';
  else
    update seances_code s set statut = 'Annulé', note = 'Groupe fermé'
     where s.groupe = p_id and s.jour >= current_date and s.statut = 'Prévu'
       and not exists (select 1 from presences p where p.seance_id = s.id);
  end if;
  return n;
end $$;
revoke all on function public.groupe_ouvrir(text, boolean) from public, anon;
grant execute on function public.groupe_ouvrir(text, boolean) to authenticated;

-- Sauvegardes : tables ajoutées aux deux exports (CSV hebdomadaire et export complet)
do $$
declare d text;
begin
  select pg_get_functiondef('prive.export_csv(text, date, date)'::regprocedure) into d;
  if position('''groupes_code''' in d) = 0 then
    d := replace(d, '''jours_feries'',''profils'',''reglages'')', '''jours_feries'',''profils'',''reglages'',''suivi'',''inscriptions_web'',''groupes_code'')');
    execute d;
  end if;
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''groupes_code''' in d) = 0 then
    d := replace(d, '''jours_feries'',''reglages'',''profils''', '''jours_feries'',''reglages'',''profils'',''groupes_code''');
    execute d;
  end if;
end $$;
