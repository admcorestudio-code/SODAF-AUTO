-- SODAF · 19 octobre 2026 · Dépenses « pour la voiture » : comptées dans « Coût de la voiture » (Mécanique), quel que soit le demandeur
-- (moniteur, secrétariat qui recopie la fiche de la mécanicienne, gérante). Appliquée par Claude le 19 oct.
alter table public.demandes add column if not exists voiture boolean not null default false;
update public.demandes d set voiture = true from public.profils p
 where p.id = d.auteur and p.role = 'moniteur' and d.type = 'Dépense' and coalesce(d.nature, '') <> 'Carburant' and not d.voiture;
