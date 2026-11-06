-- 0109 (6 nov. 2026) : formation privée = code en cours particulier. Jusqu'ici, rien n'était suivi dans l'outil.
-- Chaque cours fait est noté (moniteur, secrétariat ou direction) : une séance « Cours particulier » (statut Fait,
-- note « SO<n°> ») + la présence de l'élève. 12 cours, comme le programme. Une erreur : la séance passe à « Annulé ».
-- Et : 4 fonctions de la direction ne sont plus appelables sans être connecté (elles refusaient déjà, par sécurité en plus).

alter table public.seances_code drop constraint if exists seances_code_type_check;
alter table public.seances_code add constraint seances_code_type_check check (type = any (array['Cours complet', 'Récap et devoir', 'Entraînement examen', 'Examen blanc', 'Rattrapage et examen blanc', 'Cours ouvert', 'Cours particulier']));

create or replace function public.cours_particulier_noter(p_eleve bigint, p_cours int, p_jour date, p_heure text)
returns bigint language plpgsql security definer set search_path to '' as $$
declare s bigint; th text;
begin
  if not prive.a_role(array['admin', 'moniteur', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if not prive.est_privee(p_eleve) then raise exception 'Cours particulier : seulement pour un élève en formation privée.'; end if;
  if p_cours is null or p_cours < 1 or p_cours > 12 then raise exception 'Choisis le cours (1 à 12).'; end if;
  if p_jour is null or p_jour > current_date or p_jour < current_date - 30 then raise exception 'Date incorrecte (aujourd''hui ou dans les 30 derniers jours).'; end if;
  if coalesce(trim(p_heure), '') = '' or length(p_heure) > 20 then raise exception 'Indique l''heure du cours.'; end if;
  th := prive.theme_cours(p_cours - 1);
  if exists (select 1 from public.seances_code c join public.presences p on p.seance_id = c.id
              where c.type = 'Cours particulier' and c.statut = 'Fait' and p.eleve_id = p_eleve and c.theme = th) then
    raise exception 'Ce cours est déjà noté pour cet élève.';
  end if;
  insert into public.seances_code (jour, type, heure, groupe, theme, statut, note)
  values (p_jour, 'Cours particulier', trim(p_heure) || ' · SO' || p_eleve, null, th, 'Fait', 'SO' || p_eleve)
  returning id into s;
  insert into public.presences (seance_id, eleve_id) values (s, p_eleve);
  insert into public.suivi (eleve_id, type, note) values (p_eleve, 'Note', 'Cours particulier noté : cours ' || p_cours || ' (' || th || '), le ' || to_char(p_jour, 'DD/MM'));
  return s;
end $$;

create or replace function public.cours_particulier_annuler(p_id bigint)
returns void language plpgsql security definer set search_path to '' as $$
declare e bigint;
begin
  if not prive.a_role(array['admin', 'moniteur']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  select p.eleve_id into e from public.seances_code c join public.presences p on p.seance_id = c.id where c.id = p_id and c.type = 'Cours particulier' and c.statut = 'Fait';
  if e is null then raise exception 'Cours introuvable.'; end if;
  update public.seances_code set statut = 'Annulé' where id = p_id;
  insert into public.suivi (eleve_id, type, note) values (e, 'Note', 'Cours particulier annulé (erreur de saisie)');
end $$;

revoke execute on function public.cours_particulier_noter(bigint, int, date, text) from public, anon;
revoke execute on function public.cours_particulier_annuler(bigint) from public, anon;
grant execute on function public.cours_particulier_noter(bigint, int, date, text) to authenticated;
grant execute on function public.cours_particulier_annuler(bigint) to authenticated;

-- Fonctions de la direction : plus appelables sans être connecté
revoke execute on function public.amb_rotation_regler(uuid, uuid) from public, anon;
revoke execute on function public.commission_fonds_envoyer(text) from public, anon;
revoke execute on function public.commissions_tout_payer(text) from public, anon;
revoke execute on function public.rapport_depenses(date, date) from public, anon;
grant execute on function public.amb_rotation_regler(uuid, uuid) to authenticated;
grant execute on function public.commission_fonds_envoyer(text) to authenticated;
grant execute on function public.commissions_tout_payer(text) to authenticated;
grant execute on function public.rapport_depenses(date, date) to authenticated;
