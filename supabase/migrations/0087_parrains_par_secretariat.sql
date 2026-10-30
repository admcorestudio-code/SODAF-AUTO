-- 0087 · Parrainage (30 oct. 2026, décision du propriétaire) : la direction voit le total à payer (2 000 F par parrain, additionné),
-- envoie l'argent au secrétariat (« J'ai envoyé l'argent au secrétariat »), le secrétariat paie chaque parrain puis « Tous les parrains sont payés ».
-- Une tâche « Payer les parrains » est créée pour le secrétariat (avec notification) et se ferme toute seule quand tous sont payés.
alter table public.commissions add column if not exists fonds_le timestamptz, add column if not exists fonds_par uuid, add column if not exists fonds_moyen text, add column if not exists fonds_tache bigint;

create or replace function prive.parrains_tache_fermer(p_tache bigint)
 returns void language plpgsql security definer set search_path to '' as $function$
begin
  if p_tache is null or exists (select 1 from public.commissions where fonds_tache = p_tache and statut = 'a_payer') then return; end if;
  update public.taches set etape = 'fait', fait_le = now(), fait_par = auth.uid(), fait_note = 'Tous les parrains sont payés'
   where id = p_tache and etape = 'afaire';
  if found then perform prive.tache_notif(p_tache, 'faite'); end if;
end $function$;

create or replace function public.commission_fonds_envoyer(p_moyen text)
 returns integer language plpgsql security definer set search_path to '' as $function$
declare v_total integer; v_n integer; v_sec uuid; v_t bigint;
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_moyen not in ('Mixx by Yas', 'Moov Money', 'Espèces') then raise exception 'Choisis comment tu as envoyé l''argent.'; end if;
  select coalesce(sum(montant), 0), count(*) into v_total, v_n from public.commissions where statut = 'a_payer' and fonds_le is null;
  if v_n = 0 then raise exception 'Rien à envoyer : aucun parrain à payer.'; end if;
  select id into v_sec from public.profils where role = 'secretariat' and actif order by nom limit 1;
  if v_sec is null then raise exception 'Aucun compte secrétariat actif.'; end if;
  insert into public.taches (par, pour, titre, etape)
  values (auth.uid(), v_sec, 'Payer les parrains : ' || v_n || ' parrain' || case when v_n > 1 then 's' else '' end || ', ' ||
          replace(to_char(v_total, 'FM999G999G999'), ',', ' ') || ' F envoyés par la direction (' || p_moyen || '). Onglet Gestion → Parrainage.', 'afaire')
  returning id into v_t;
  update public.commissions set fonds_le = now(), fonds_par = auth.uid(), fonds_moyen = p_moyen, fonds_tache = v_t
   where statut = 'a_payer' and fonds_le is null;
  perform prive.tache_notif(v_t, 'nouvelle');
  return v_total;
end $function$;

create or replace function public.commission_payer(p_id bigint, p_mode text, p_reference text)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_t bigint;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if prive.a_role(array['secretariat']) and exists (select 1 from commissions where id = p_id and fonds_le is null) then
    raise exception 'La direction n''a pas encore envoyé l''argent pour ce parrain.';
  end if;
  update commissions set statut = 'payee', paye_le = now(), paye_par = auth.uid(), mode = p_mode, reference = nullif(trim(coalesce(p_reference, '')), '')
   where id = p_id and statut = 'a_payer' returning fonds_tache into v_t;
  if not found then raise exception 'Cette commission n''est plus à payer.'; end if;
  perform prive.parrains_tache_fermer(v_t);
end $function$;

create or replace function public.commissions_tout_payer(p_mode text)
 returns integer language plpgsql security definer set search_path to '' as $function$
declare v_n integer; t bigint;
begin
  if not prive.a_role(array['admin', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if p_mode not in ('Mixx by Yas', 'Moov Money', 'Espèces') then raise exception 'Choisis comment tu as payé.'; end if;
  update public.commissions set statut = 'payee', paye_le = now(), paye_par = auth.uid(), mode = p_mode
   where statut = 'a_payer' and fonds_le is not null;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Aucun parrain à payer avec l''argent reçu.'; end if;
  for t in select distinct fonds_tache from public.commissions where fonds_tache is not null and paye_par = auth.uid() and paye_le > now() - interval '1 minute' loop
    perform prive.parrains_tache_fermer(t);
  end loop;
  return v_n;
end $function$;
