ALTER TABLE gnc_core.t_programs
ADD COLUMN id_form integer,
ADD CONSTRAINT t_programs_id_form_fkey FOREIGN KEY (id_form)
REFERENCES gnc_core.t_custom_form (id_form) MATCH SIMPLE
ON UPDATE NO ACTION
ON DELETE NO ACTION;
ALTER TABLE gnc_obstax.t_obstax
ADD COLUMN json_data jsonb;

ALTER TABLE gnc_sites.t_sites
ALTER COLUMN site_type TYPE varchar(100);
ALTER TABLE gnc_sites.cor_program_typesites
ALTER COLUMN site_type TYPE varchar(100);

ALTER TABLE gnc_core.t_programs
RENAME COLUMN module TO id_module;

ALTER TABLE gnc_core.t_modules
ADD CONSTRAINT module_name_unique
UNIQUE (name);
