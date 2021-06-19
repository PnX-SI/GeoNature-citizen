ALTER TABLE gnc_core.t_programs
    ADD registration_required bool
    NOT NULL
    DEFAULT false
;
