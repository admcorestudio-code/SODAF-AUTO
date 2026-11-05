-- 0104 (5 nov. 2026) : seul le secrétariat note les petits frais (la direction et la gérante les lisent),
-- et il doit toujours écrire ce que c'est (note obligatoire). Décision du propriétaire.
drop policy if exists "frais : noter" on public.frais;
create policy "frais : noter" on public.frais for insert to authenticated
  with check (prive.a_role(array['secretariat']) and auteur = auth.uid() and jour >= current_date - 31 and jour <= current_date);
alter table public.frais drop constraint if exists frais_note_check;
alter table public.frais add constraint frais_note_check check (note is not null and length(btrim(note)) between 3 and 300);
