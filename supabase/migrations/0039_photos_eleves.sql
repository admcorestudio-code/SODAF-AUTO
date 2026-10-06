-- SODAF · Photo de chaque élève (selfie obligatoire dans le lien d'inscription, ou photo prise au bureau).
-- Stockage privé « photos » : seule l'équipe connectée peut voir. Jamais publique.
-- Chemin : <n° élève>/<jeton du lien>/selfie-<heure>.jpg (inscription en ligne) ou <n° élève>/bureau/<heure>.jpg (équipe).
-- Rien ne se supprime : pas de règle de suppression ni de remplacement ; une nouvelle photo = un nouveau fichier.

-- 1. Espace de stockage privé (1 Mo au plus par photo, images seulement)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 1048576, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

-- 2. Qui peut envoyer et lire
create policy "photos : selfie du lien d'inscription" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] ~ '^[0-9]{1,12}$'
              and prive.jeton_ok(((storage.foldername(name))[1])::bigint, (storage.foldername(name))[2]));
create policy "photos : l'équipe prend la photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and prive.est_equipe());
create policy "photos : l'équipe voit" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and prive.est_equipe());

-- 3. Fiche élève : chemin de la photo, date, accord de l'élève
alter table public.eleves add column if not exists photo text check (photo is null or length(photo) <= 200);
alter table public.eleves add column if not exists photo_le timestamptz;
alter table public.eleves add column if not exists photo_accord_le timestamptz;

-- 4. Lien d'inscription : la photo envoyée doit être rangée sous le n° et le jeton de l'élève
alter table public.inscriptions_web add column if not exists photo text check (photo is null or length(photo) <= 200);
drop policy "site : finaliser inscription" on public.inscriptions_web;
create policy "site : finaliser inscription" on public.inscriptions_web for insert to anon
  with check ((statut = 'Nouveau') and (le > (now() - interval '1 minute')) and prive.jeton_ok(eleve_id, jeton)
              and ((mode = 'agence') or (mixx_tel is not null) or (mixx_ref is not null))
              and (photo is null or photo like (eleve_id::text || '/' || jeton || '/%')));

-- 5. À l'inscription, la photo passe sur la fiche de l'élève (avec la date de son accord)
create or replace function prive.trg_insc_photo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.photo is not null then
    update public.eleves set photo = new.photo, photo_le = now(), photo_accord_le = new.le where id = new.eleve_id;
  end if;
  return new;
end $$;
create trigger insc_photo after insert on public.inscriptions_web for each row execute function prive.trg_insc_photo();
