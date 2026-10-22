-- 0066 : achat fait par la direction elle-même (décision du propriétaire, 22 octobre 2026)
-- « Des fois je veux aller moi-même, et je ne connais pas le prix » : tâche pour soi avec argent,
-- prix connu ou non, sans passer par la gérante ni par un envoi Mixx.
-- Après l'achat : prix payé + ticket (ou photo de l'achat), puis confirmation → Fait.

-- 1. Créer : la direction peut se donner une tâche avec argent (étape « à faire » directement)
create or replace function public.tache_creer(p_pour uuid, p_titre text, p_pour_le date, p_argent boolean, p_montant integer)
returns bigint language plpgsql security definer set search_path = '' as $$
declare r text; v_id bigint; v_etape text; v_titre text := trim(coalesce(p_titre, '')); v_moi boolean := (p_pour = auth.uid());
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la direction et à la gérante' using errcode = '42501'; end if;
  if length(v_titre) < 3 then raise exception 'Écris la tâche.'; end if;
  select role into r from public.profils where id = p_pour and actif;
  if r is null then raise exception 'Choisis pour qui.'; end if;
  if prive.a_role(array['gerant']) then
    if coalesce(p_argent, false) then raise exception 'Une tâche qui coûte de l''argent : passe par « Proposer un achat ».'; end if;
    if r not in ('gerant', 'secretariat', 'moniteur', 'ambassadeur') then raise exception 'La gérante donne des tâches au secrétariat, au moniteur et à l''Ambassadeur.'; end if;
  end if;
  if p_montant is not null and p_montant <= 0 then raise exception 'Montant invalide.'; end if;
  v_etape := case when not coalesce(p_argent, false) or v_moi then 'afaire' when p_montant is null then 'prix' else 'payer' end;
  insert into public.taches (par, pour, titre, pour_le, argent, etape, montant, accord_le, accord_par)
  values (auth.uid(), p_pour, v_titre, p_pour_le, coalesce(p_argent, false), v_etape,
          case when coalesce(p_argent, false) then p_montant end,
          case when coalesce(p_argent, false) and (v_moi or v_etape = 'payer') then now() end,
          case when coalesce(p_argent, false) and (v_moi or v_etape = 'payer') then auth.uid() end)
  returning id into v_id;
  if v_etape = 'prix' then perform prive.tache_notif(v_id, 'prix');
  elsif not v_moi then perform prive.tache_notif(v_id, 'nouvelle'); end if;
  return v_id;
end $$;

-- 2. Achat fait soi-même : prix payé + ticket (ou photo de l'achat) → Fait
create or replace function public.tache_achat_fini(p_id bigint, p_montant integer, p_piece text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_montant is null or p_montant <= 0 then raise exception 'Écris le prix payé.'; end if;
  if coalesce(p_piece, '') = '' then raise exception 'Ajoute le ticket ou une photo de l''achat.'; end if;
  if p_piece not like 'taches/%' then raise exception 'pièce invalide'; end if;
  update public.taches set montant = p_montant, paye_montant = p_montant, paye_moyen = 'Espèces', paye_le = now(), paye_par = auth.uid(),
         facture = p_piece, facture_le = now(), etape = 'fait', fait_le = now(), fait_par = auth.uid()
   where id = p_id and etape = 'afaire' and argent and par = pour and pour = auth.uid();
  if not found then raise exception 'tâche introuvable ou déjà faite'; end if;
end $$;
revoke all on function public.tache_achat_fini(bigint, integer, text) from public, anon;
grant execute on function public.tache_achat_fini(bigint, integer, text) to authenticated;

-- 3. Annuler : aussi un achat pour soi pas encore fait
create or replace function public.tache_annuler(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.taches set etape = 'annulee', annule_le = now(), annule_par = auth.uid()
   where id = p_id and (etape in ('prix', 'accord', 'payer') or (etape = 'afaire' and (not argent or (par = pour and facture is null))))
     and ((par = auth.uid() and prive.a_role(array['admin', 'gerant'])) or prive.a_role(array['admin']));
  if not found then raise exception 'Impossible d''annuler : argent déjà envoyé, tâche finie, ou pas ta tâche.'; end if;
end $$;
