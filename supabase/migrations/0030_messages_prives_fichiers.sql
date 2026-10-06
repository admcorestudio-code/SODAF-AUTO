-- 0030 · Messages : conversations privées, mentions (@) et fichiers
-- Général : toute l'équipe. Direction ↔ Secrétariat et Direction ↔ Moniteur : privés.
-- Secrétariat ↔ Moniteur : entre eux, la direction peut lire.
-- Fichiers (photos compressées, PDF, documents) dans un espace de stockage privé, lisible seulement par ceux qui voient la conversation.
-- Rien n'est supprimé.

alter table public.canaux add column if not exists prive boolean not null default false;

update public.canaux set nom = 'Général', description = 'Toute l''équipe : infos, consignes, questions', roles = null, prive = false, ordre = 1 where id = 'general';
update public.canaux set nom = 'Direction ↔ Secrétariat', description = 'Privé : la direction et le secrétariat', roles = array['admin', 'secretariat'], prive = true, ordre = 2 where id = 'direction';
insert into public.canaux (id, nom, description, roles, prive, ordre) values
  ('dir-moniteur', 'Direction ↔ Moniteur', 'Privé : la direction et le moniteur', array['admin', 'moniteur'], true, 3)
on conflict (id) do nothing;
update public.canaux set nom = 'Secrétariat ↔ Moniteur', description = 'Le secrétariat et le moniteur · la direction peut lire', roles = array['secretariat', 'moniteur', 'admin'], prive = true, ordre = 4 where id = 'planning';

alter table public.messages add column if not exists mentions uuid[];
alter table public.messages add column if not exists fichier jsonb check (fichier is null or (fichier ? 'path' and length(fichier ->> 'path') <= 300));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('messages', 'messages', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain',
              'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;

create policy "messages : lire fichiers" on storage.objects for select to authenticated
  using (bucket_id = 'messages' and prive.est_equipe() and prive.canal_ok((storage.foldername(name))[1]));
create policy "messages : envoyer fichiers" on storage.objects for insert to authenticated
  with check (bucket_id = 'messages' and prive.est_equipe() and prive.canal_ok((storage.foldername(name))[1]));
