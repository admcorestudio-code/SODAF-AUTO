-- SODAF · Mot de passe des comptes de l'équipe : 6 caractères au moins (choix de la direction, 6 octobre 2026). Même contenu que 0036, seul le minimum change.

create or replace function public.compte_modifier(p_id uuid, p_email text, p_motdepasse text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if not exists (select 1 from public.profils where id = p_id) then raise exception 'compte introuvable'; end if;
  if v_email <> '' then
    if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'adresse invalide'; end if;
    if exists (select 1 from auth.users where lower(email) = v_email and id <> p_id) then raise exception 'adresse déjà utilisée par un autre compte'; end if;
    update auth.users set email = v_email, email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = p_id;
    update auth.identities set identity_data = identity_data || jsonb_build_object('email', v_email), updated_at = now() where user_id = p_id and provider = 'email';
  end if;
  if coalesce(p_motdepasse, '') <> '' then
    if length(p_motdepasse) < 6 then raise exception 'mot de passe trop court (6 caractères au moins)'; end if;
    update auth.users set encrypted_password = extensions.crypt(p_motdepasse, extensions.gen_salt('bf')), updated_at = now() where id = p_id;
    -- nouveau mot de passe : les autres appareils de ce compte sont déconnectés (sauf pour son propre compte)
    if p_id <> auth.uid() then
      delete from auth.refresh_tokens where user_id = p_id::text;
      delete from auth.sessions where user_id = p_id;
    end if;
  end if;
end $$;
revoke all on function public.compte_modifier(uuid, text, text) from public, anon;
grant execute on function public.compte_modifier(uuid, text, text) to authenticated;

create or replace function public.compte_creer(p_email text, p_motdepasse text, p_role text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_id uuid := gen_random_uuid();
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_role not in ('admin', 'secretariat', 'moniteur') then raise exception 'rôle inconnu'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'adresse invalide'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then raise exception 'adresse déjà utilisée par un autre compte'; end if;
  if length(coalesce(p_motdepasse, '')) < 6 then raise exception 'mot de passe trop court (6 caractères au moins)'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new,
                          email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
          extensions.crypt(p_motdepasse, extensions.gen_salt('bf')), now(), now(), now(),
          '{"provider":"email","providers":["email"]}', '{"email_verified":true}', '', '', '', '', '', '', '', '', false, false);
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false), 'email', now(), now());
  insert into public.profils (id, nom, role, actif)
  values (v_id, case p_role when 'admin' then 'Direction SODAF' when 'secretariat' then 'Secrétariat SODAF' else 'Moniteur SODAF' end, p_role, true);
  return v_id;
end $$;
revoke all on function public.compte_creer(text, text, text) from public, anon;
grant execute on function public.compte_creer(text, text, text) to authenticated;
