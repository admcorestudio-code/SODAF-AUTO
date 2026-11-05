-- 0100 (5 nov. 2026) : une tâche peut avoir une pièce jointe (document ou image, choisie sur le téléphone,
-- l'ordinateur ou Google Drive) et/ou un lien (Google Drive ou autre). Elles sont visibles par
-- la personne qui donne la tâche et celle qui la reçoit.
alter table public.taches
  add column piece text check (length(piece) <= 300),
  add column piece_nom text check (length(piece_nom) <= 120),
  add column lien text check (lien is null or (length(lien) <= 500 and lien ~ '^https://'));

alter policy "tâches : voir ses pièces" on storage.objects
  using (bucket_id = 'depenses' and prive.est_membre() and exists (
    select 1 from public.taches t
     where (t.pour = auth.uid() or t.par = auth.uid())
       and (t.paye_recu = objects.name or t.facture = objects.name or t.devis = objects.name or t.piece = objects.name
            or t.envois @> jsonb_build_array(jsonb_build_object('recu', objects.name)))));

drop function if exists public.tache_creer(uuid, text, date, boolean, integer);
create or replace function public.tache_creer(p_pour uuid, p_titre text, p_pour_le date, p_argent boolean, p_montant integer,
                                              p_piece text default null, p_piece_nom text default null, p_lien text default null)
 returns bigint language plpgsql security definer set search_path to ''
as $function$
declare r text; v_id bigint; v_etape text; v_titre text := trim(coalesce(p_titre, '')); v_moi boolean := (p_pour = auth.uid());
        v_piece text := nullif(trim(coalesce(p_piece, '')), ''); v_lien text := nullif(trim(coalesce(p_lien, '')), '');
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
  if v_piece is not null and v_piece not like 'taches/%' then raise exception 'Pièce jointe invalide.'; end if;
  if v_lien is not null and (v_lien !~ '^https://' or length(v_lien) > 500) then raise exception 'Le lien doit commencer par https://'; end if;
  v_etape := case when not coalesce(p_argent, false) or v_moi then 'afaire' when p_montant is null then 'prix' else 'payer' end;
  insert into public.taches (par, pour, titre, pour_le, argent, etape, montant, accord_le, accord_par, piece, piece_nom, lien)
  values (auth.uid(), p_pour, v_titre, p_pour_le, coalesce(p_argent, false), v_etape,
          case when coalesce(p_argent, false) then p_montant end,
          case when coalesce(p_argent, false) and (v_moi or v_etape = 'payer') then now() end,
          case when coalesce(p_argent, false) and (v_moi or v_etape = 'payer') then auth.uid() end,
          v_piece, case when v_piece is not null then left(nullif(trim(coalesce(p_piece_nom, '')), ''), 120) end, v_lien)
  returning id into v_id;
  if v_etape = 'prix' then perform prive.tache_notif(v_id, 'prix');
  elsif not v_moi then perform prive.tache_notif(v_id, 'nouvelle'); end if;
  return v_id;
end $function$;
revoke all on function public.tache_creer(uuid, text, date, boolean, integer, text, text, text) from public, anon;
grant execute on function public.tache_creer(uuid, text, date, boolean, integer, text, text, text) to authenticated;

-- Documents Word et Excel acceptés en pièce jointe (en plus des images et des PDF)
update storage.buckets set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
 where id = 'depenses';
