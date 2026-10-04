-- 0025 · Placement automatique au code + groupe C du matin ouvert
-- Dès qu'une place se libère dans un groupe ouvert, les élèves de la liste d'attente sont placés
-- (premier inscrit, premier placé ; groupes remplis dans l'ordre A, B, C…). Fait par la base en une seule opération
-- verrouillée : deux téléphones ouverts en même temps ne peuvent pas mettre 7 élèves dans un groupe de 6.
-- Mêmes règles que l'espace équipe : place suspendue = solde > 0 et 14 jours après le reçu d'inscription ;
-- une place compte pendant le cycle de 6 semaines.
-- Rien n'est supprimé.

alter table public.eleves add column if not exists groupe_msg_le timestamptz;  -- horaires de code envoyés le
alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb
              and dossier_envoye_le is null and dossier_relance_le is null and jeton is null
              and provenance is null and dernier_appel_le is null and dossier_relances = 0
              and examen_etape is null and examen_paye = false and examen_docs = '{}'::jsonb and examen_paiement is null
              and groupe_code is null and groupe_depuis is null and evaluation is null and evaluation_le is null
              and solde_rappels = 0 and solde_rappel_le is null and groupe_msg_le is null);

create or replace function prive.date_inscription(e bigint) returns timestamptz
language sql stable security definer set search_path = public as $$
  select max(cree_le) from paiements where eleve_id = e and not annule and motif like 'Droit d''inscription%'
$$;

create or replace function prive.solde_eleve(e bigint) returns int
language sql stable security definer set search_path = public as $$
  select reste from paiements where eleve_id = e and not annule and reste is not null order by cree_le desc limit 1
$$;

create or replace function prive.place_suspendue(e bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(prive.solde_eleve(e) > 0 and now() - prive.date_inscription(e) >= interval '14 days', false)
$$;

create or replace function prive.en_code(el public.eleves) returns boolean
language sql stable as $$
  select el.statut in ('Inscrit', 'En formation') and el.examen_etape is null
     and coalesce(el.formation, '') !~* '(remise à niveau|entreprise)'
$$;

create or replace function prive.occupation_groupe(g text) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from eleves el
   where el.groupe_code = g and prive.en_code(el) and not prive.place_suspendue(el.id)
     and (el.groupe_depuis is null or now() - el.groupe_depuis < interval '42 days')
$$;

create or replace function public.code_placer()
returns table (eleve_id bigint, groupe text)
language plpgsql volatile security definer set search_path = public as $$
declare e record; g text;
begin
  if not prive.est_equipe() then raise exception 'accès refusé' using errcode = '42501'; end if;
  perform 1 from groupes_code for update;  -- un seul placement à la fois
  for e in
    select el.id from eleves el
     where el.groupe_code is null and prive.en_code(el) and not prive.place_suspendue(el.id)
     order by prive.date_inscription(el.id) nulls last, el.id
  loop
    select gc.id into g from groupes_code gc
     where gc.actif and prive.occupation_groupe(gc.id) < gc.places order by gc.ordre limit 1;
    exit when g is null;
    update eleves set groupe_code = g, groupe_depuis = now(), groupe_msg_le = null where id = e.id and groupe_code is null;
    if found then
      insert into suivi (eleve_id, type, note) values (e.id, 'Note', 'Placé automatiquement au code : ' || (select nom from groupes_code where id = g));
      eleve_id := e.id; groupe := g; return next;
    end if;
  end loop;
end $$;
revoke all on function public.code_placer() from public, anon;
grant execute on function public.code_placer() to authenticated;
revoke all on function prive.date_inscription(bigint), prive.solde_eleve(bigint), prive.place_suspendue(bigint), prive.occupation_groupe(text) from public;

-- Groupe C du matin : lundi et jeudi, 11 h – 12 h (le moniteur est en voiture jusqu'à 10 h 45)
update groupes_code set actif = true where id = 'C';
select prive.seances_groupe('C', current_date, (select coalesce(max(jour), current_date) from creneaux_conduite));
