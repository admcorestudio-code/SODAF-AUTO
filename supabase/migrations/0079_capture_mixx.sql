-- 0079 · Paiement Mixx : capture d'écran du SMS au lieu de la référence (décision du propriétaire, 25 oct. 2026)
-- « Il fait une capture d'écran… tant qu'il n'a pas inséré la capture, ça passe pas. »
-- La capture est rangée dans l'espace privé « photos », sous <n° élève>/<jeton>/mixx-<heure>.jpg
-- (même règle d'envoi que le selfie, 0039). Seule l'équipe connectée peut la voir.
-- Paiement Mixx en ligne : capture obligatoire. Rien n'est supprimé. Idempotent.
alter table public.inscriptions_web add column if not exists mixx_capture text check (mixx_capture is null or length(mixx_capture) <= 200);
comment on column public.inscriptions_web.mixx_capture is 'Capture d''écran du SMS de paiement Mixx (espace photos), envoyée par le client (0079).';

drop policy if exists "site : finaliser inscription" on public.inscriptions_web;
create policy "site : finaliser inscription" on public.inscriptions_web for insert to anon
  with check ((statut = 'Nouveau') and (le > (now() - interval '1 minute')) and prive.jeton_ok(eleve_id, jeton)
              and ((mode = 'agence') or (mixx_capture is not null))
              and (photo is null or photo like (eleve_id::text || '/' || jeton || '/%'))
              and (mixx_capture is null or mixx_capture like (eleve_id::text || '/' || jeton || '/%')));
