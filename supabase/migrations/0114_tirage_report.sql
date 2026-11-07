-- 0114 (7 nov. 2026) : un tirage peut être reporté (décision du propriétaire : 0 inscrit pour le samedi 7 novembre).
-- La règle reste le premier samedi du mois ; prive.tirage_dates garde les exceptions (mois → jour du tirage).
create table if not exists prive.tirage_dates (mois date primary key, jour date not null, motif text);
alter table prive.tirage_dates enable row level security;
insert into prive.tirage_dates (mois, jour, motif) values ('2026-11-01', '2026-11-14', 'Reporté du samedi 7 au samedi 14 novembre (aucun inscrit le 7)')
on conflict (mois) do update set jour = excluded.jour, motif = excluded.motif;

create or replace function prive.tirage_jour(p_mois date) returns date
language sql stable set search_path to '' as $$
  select coalesce((select d.jour from prive.tirage_dates d where d.mois = date_trunc('month', p_mois)::date),
                  (date_trunc('month', p_mois)::date + ((6 - extract(dow from date_trunc('month', p_mois))::int + 7) % 7))::date)
$$;
