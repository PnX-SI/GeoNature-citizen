BEGIN;
-- Add column name that will contain the name of the taxon
ALTER TABLE gnc_obstax.t_obstax ADD COLUMN name varchar(1000);
-- Change the type of the column municipality to accept string
ALTER TABLE gnc_obstax.t_obstax DROP COLUMN municipality;
ALTER TABLE gnc_obstax.t_obstax ADD COLUMN municipality varchar(100);
COMMIT;
