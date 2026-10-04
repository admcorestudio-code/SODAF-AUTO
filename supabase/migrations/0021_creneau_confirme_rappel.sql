-- 0021 · Planning conduite : on note quand l'élève a été prévenu (confirmation) et quand le rappel de la veille est parti
alter table public.creneaux_conduite
  add column if not exists confirme_le timestamptz,
  add column if not exists rappel_le timestamptz;
