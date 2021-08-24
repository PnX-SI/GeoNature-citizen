ALTER TABLE gnc_sites.t_sites
    ALTER COLUMN geom TYPE GEOMETRY()
;

ALTER TABLE gnc_core.t_programs
    ADD COLUMN geometry_type VARCHAR(100)
;


