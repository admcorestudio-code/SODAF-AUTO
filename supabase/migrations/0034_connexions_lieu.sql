-- 0034 · Lieu approximatif des connexions (pays, ville, opérateur) d'après l'adresse internet vue par le serveur
-- La recherche du lieu est faite par la fonction « notifier » (côté serveur) : le téléphone ne peut pas la falsifier.
-- Rien n'est supprimé.

alter table public.connexions add column if not exists pays text check (pays is null or length(pays) <= 60);
alter table public.connexions add column if not exists ville text check (ville is null or length(ville) <= 80);
alter table public.connexions add column if not exists operateur text check (operateur is null or length(operateur) <= 80);

create or replace function public.connexion_noter(p_appareil text, p_description text, p_login boolean)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare v_nouvel boolean; v_ip text; v_h json; v_id bigint;
begin
  if not prive.est_equipe() then raise exception 'accès refusé' using errcode = '42501'; end if;
  if p_appareil is null or length(p_appareil) < 8 then raise exception 'appareil inconnu'; end if;
  v_nouvel := not exists (select 1 from public.connexions where profil = auth.uid() and appareil = left(p_appareil, 64));
  begin
    v_h := current_setting('request.headers', true)::json;
    v_ip := coalesce(nullif(trim(v_h ->> 'cf-connecting-ip'), ''), nullif(trim(v_h ->> 'x-real-ip'), ''), trim(split_part(coalesce(v_h ->> 'x-forwarded-for', ''), ',', 1)));
  exception when others then v_ip := null;
  end;
  insert into public.connexions (profil, appareil, description, ip, nouvel)
  values (auth.uid(), left(p_appareil, 64), left(p_description, 120), nullif(left(v_ip, 64), ''), v_nouvel and coalesce(p_login, false))
  returning id into v_id;
  -- Toujours : la fonction « notifier » cherche le lieu ; elle n'envoie l'alerte que si c'est un nouvel appareil
  perform prive.notifier(jsonb_build_object('type', 'connexion', 'id', v_id));
  return v_nouvel;
end $$;
revoke all on function public.connexion_noter(text, text, boolean) from public, anon;
grant execute on function public.connexion_noter(text, text, boolean) to authenticated;
