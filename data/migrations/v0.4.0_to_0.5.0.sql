ALTER TABLE gnc_sites.t_sites
    ADD COLUMN id_type integer,
    ADD CONSTRAINT t_sites_id_type_fkey
    FOREIGN KEY (id_type)
    REFERENCES gnc_sites.t_typesite (id_typesite)
    ON DELETE NO ACTION;

ALTER TABLE gnc_sites.cor_program_typesites
    ADD COLUMN id_typesite integer,
    ADD CONSTRAINT cor_program_typesites_id_typesite_fkey
    FOREIGN KEY (id_typesite)
    REFERENCES gnc_sites.t_typesite (id_typesite)
    ON DELETE CASCADE;

ALTER TABLE gnc_core.t_programs
    ADD COLUMN id_geom integer,
    ADD CONSTRAINT t_programs_id_geom_fkey FOREIGN KEY (id_geom)
    REFERENCES gnc_core.t_geometries (id_geom)
    ON DELETE NO ACTION;

-- AFTER DATA MIGRATION
--   SET sitetype FK not nullable
ALTER TABLE gnc_sites.t_sites
    ALTER COLUMN id_type SET NOT NULL;
ALTER TABLE gnc_sites.cor_program_typesites
    ALTER COLUMN id_typesite SET NOT NULL;
ALTER TABLE gnc_core.t_programs
    ALTER COLUMN id_geom SET NOT NULL;
--   Delete old Enum columns
ALTER TABLE gnc_sites.t_sites DROP COLUMN site_type;
ALTER TABLE gnc_sites.cor_program_typesites DROP COLUMN site_type;
ALTER TABLE gnc_core.t_programs DROP COLUMN geom;
