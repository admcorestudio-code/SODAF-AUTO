-- 0099 (5 nov. 2026) : photo du modèle pour le matériel.
-- La direction ajoute une photo à l'objet ; à la commande, on peut joindre une autre photo.
-- La photo voyage avec la commande (colonne devis de la demande), puis dans la tâche « payer »,
-- pour que la personne qui achète sache exactement quoi chercher.
-- Une commande de matériel faite par la direction va au secrétariat (il n'y a plus de gérante).

alter table public.materiel add column photo text check (length(photo) <= 300);

create policy "matériel : ajouter une photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'materiel' and prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']));
create policy "matériel : voir les photos" on storage.objects for select to authenticated
  using (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'materiel' and prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']));

drop function if exists public.materiel_commander(bigint, integer, text, text);
create or replace function public.materiel_commander(p_id bigint, p_quantite integer, p_raison text, p_note text default null, p_photo text default null) returns bigint
language plpgsql security definer set search_path to '' as $$
declare m public.materiel; v_mt integer; v_id bigint; v_tx text; v_ph text := nullif(trim(coalesce(p_photo, '')), '');
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  if p_quantite is null or p_quantite < 1 or p_quantite > 100000 then raise exception 'Quantité invalide.'; end if;
  if p_raison not in ('Manquant', 'Cassé', 'Stock bas', 'Autre') then raise exception 'Raison invalide.'; end if;
  if v_ph is not null and (v_ph not like 'materiel/%' or length(v_ph) > 300) then raise exception 'Photo invalide.'; end if;
  select * into m from public.materiel where id = p_id and actif; if not found then raise exception 'Objet introuvable.'; end if;
  if exists (select 1 from public.demandes where materiel_id = p_id and statut = 'attente') then raise exception 'Une commande de cet objet attend déjà une réponse.'; end if;
  v_mt := case when m.prix is null or m.prix = 0 then null when m.prix_par = 'unite' then m.prix * p_quantite else m.prix end;
  v_tx := left('Matériel : ' || m.nom || ' × ' || p_quantite || ' (' || lower(p_raison) || ')' || coalesce(' : ' || nullif(trim(p_note), ''), ''), 600);
  insert into public.demandes (auteur, type, nature, montant, texte, voiture, materiel_id, materiel_qte, devis)
  values (auth.uid(), 'Dépense', 'Autre', v_mt, v_tx, m.categorie = 'Voiture', p_id, p_quantite, coalesce(v_ph, m.photo))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.materiel_commander(bigint, integer, text, text, text) from public, anon;
grant execute on function public.materiel_commander(bigint, integer, text, text, text) to authenticated;

drop function if exists public.materiel_commandes();
create or replace function public.materiel_commandes() returns table (id bigint, le timestamptz, auteur uuid, materiel_id bigint, materiel_qte integer, montant integer, texte text, statut text, etape text, reponse text, materiel_recu_le timestamptz, photo text)
language sql stable security definer set search_path to '' as $$
  select d.id, d.le, d.auteur, d.materiel_id, d.materiel_qte, d.montant, d.texte, d.statut, d.etape, d.reponse, d.materiel_recu_le, d.devis
    from public.demandes d
   where d.materiel_id is not null and prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur'])
   order by d.le desc limit 100
$$;
revoke all on function public.materiel_commandes() from public, anon;
grant execute on function public.materiel_commandes() to authenticated;

-- Tâche « payer » : une commande de matériel de la direction va à la gérante, sinon au secrétariat
create or replace function prive.trg_demande_tache()
 returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_pour uuid := new.auteur;
begin
  if new.type = 'Dépense' and new.statut = 'accordee' and old.statut is distinct from 'accordee' then
    if exists (select 1 from public.profils where id = new.auteur and role = 'admin') then
      v_pour := coalesce((select id from public.profils where role = 'gerant' and actif order by nom limit 1),
                         case when new.materiel_id is not null then (select id from public.profils where role = 'secretariat' and actif order by nom limit 1) end,
                         new.auteur);
    end if;
    insert into public.taches (par, pour, titre, argent, carburant, etape, montant, devis, demande_id, accord_le, accord_par, accord_note)
    values (coalesce(new.repondu_par, new.auteur), v_pour,
            left(case when new.nature = 'Carburant' then 'Essence en plus : ' else '' end || new.texte, 600),
            true, new.nature = 'Carburant', 'payer', new.montant, new.devis, new.id, coalesce(new.repondu_le, now()), new.repondu_par, new.reponse)
    on conflict (demande_id) do nothing;
  end if;
  return new;
end $function$;
