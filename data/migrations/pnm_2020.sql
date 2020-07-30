ALTER TABLE gnc_core.t_programs
    ADD COLUMN id_form integer,
    ADD CONSTRAINT t_programs_id_form_fkey FOREIGN KEY (id_form)
        REFERENCES gnc_core.t_custom_form (id_form) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION;
ALTER TABLE gnc_obstax.t_obstax
    ADD COLUMN json_data jsonb;