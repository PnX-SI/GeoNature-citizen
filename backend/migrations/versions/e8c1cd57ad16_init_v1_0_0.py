"""empty message

Revision ID: e8c1cd57ad16
Revises: 
Create Date: 2022-03-03 21:41:36.783319

"""
from datetime import datetime

import geoalchemy2 as ga
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "e8c1cd57ad16"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("create schema if not exists gnc_obstax")
    op.execute("create schema if not exists gnc_sites")
    op.create_table(
        "bib_groups",
        sa.Column("id_group", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=150), nullable=True),
        sa.Column("group", sa.String(length=150), nullable=False),
        sa.PrimaryKeyConstraint("id_group"),
        schema="gnc_core",
    )
    op.create_table(
        "t_custom_form",
        sa.Column("id_form", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=250), nullable=True),
        sa.Column(
            "json_schema",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id_form"),
        sa.UniqueConstraint("id_form"),
        schema="gnc_core",
    )
    op.create_table(
        "t_geometries",
        sa.Column("id_geom", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "geom",
            ga.types.Geometry(
                srid=4326, from_text="ST_GeomFromEWKT", name="geometry"
            ),
            nullable=True,
        ),
        sa.Column("geom_file", sa.String(length=250), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id_geom"),
        schema="gnc_core",
    )
    op.create_table(
        "t_medias",
        sa.Column("id_media", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=50), nullable=False),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id_media"),
        schema="gnc_core",
    )
    t_modules = op.create_table(
        "t_modules",
        sa.Column("id_module", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=50), nullable=False),
        sa.Column("desc", sa.String(length=200), nullable=True),
        sa.Column("icon", sa.String(length=250), nullable=True),
        sa.Column("on_sidebar", sa.Boolean(), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id_module"),
        sa.UniqueConstraint("label"),
        sa.UniqueConstraint("name"),
        schema="gnc_core",
    )
    op.create_table(
        "t_projects",
        sa.Column("id_project", sa.Integer(), nullable=False),
        sa.Column(
            "unique_id_project", postgresql.UUID(as_uuid=True), nullable=False
        ),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("short_desc", sa.String(length=200), nullable=True),
        sa.Column("long_desc", sa.Text(), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id_project"),
        sa.UniqueConstraint("unique_id_project"),
        schema="gnc_core",
    )
    op.create_table(
        "t_revoked_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("jti", sa.String(length=120), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="gnc_core",
    )
    op.create_table(
        "t_users",
        sa.Column("id_user", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("surname", sa.String(length=100), nullable=False),
        sa.Column("username", sa.String(length=120), nullable=False),
        sa.Column("password", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("phone", sa.String(length=15), nullable=True),
        sa.Column("organism", sa.String(length=100), nullable=True),
        sa.Column("avatar", sa.String(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=True),
        sa.Column("admin", sa.Boolean(), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id_user"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
        schema="gnc_core",
    )
    op.create_table(
        "cor_users_groups",
        sa.Column("id_user_right", sa.Integer(), nullable=False),
        sa.Column("id_user", sa.Integer(), nullable=False),
        sa.Column("id_group", sa.Integer(), nullable=False),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_group"], ["gnc_core.bib_groups.id_group"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["id_user"],
            ["gnc_core.t_users.id_user"],
        ),
        sa.PrimaryKeyConstraint("id_user_right"),
        schema="gnc_core",
    )
    op.create_table(
        "t_programs",
        sa.Column("id_program", sa.Integer(), nullable=False),
        sa.Column(
            "unique_id_program", postgresql.UUID(as_uuid=True), nullable=False
        ),
        sa.Column("id_project", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=50), nullable=False),
        sa.Column("short_desc", sa.String(length=200), nullable=False),
        sa.Column("long_desc", sa.Text(), nullable=False),
        sa.Column("form_message", sa.String(length=500), nullable=True),
        sa.Column("image", sa.String(length=250), nullable=True),
        sa.Column("logo", sa.String(length=250), nullable=True),
        sa.Column("id_module", sa.Integer(), nullable=False),
        sa.Column("taxonomy_list", sa.Integer(), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=True,
        ),
        sa.Column("id_geom", sa.Integer(), nullable=False),
        sa.Column("id_form", sa.Integer(), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_form"],
            ["gnc_core.t_custom_form.id_form"],
        ),
        sa.ForeignKeyConstraint(
            ["id_geom"],
            ["gnc_core.t_geometries.id_geom"],
        ),
        sa.ForeignKeyConstraint(
            ["id_module"],
            ["gnc_core.t_modules.id_module"],
        ),
        sa.ForeignKeyConstraint(
            ["id_project"],
            ["gnc_core.t_projects.id_project"],
        ),
        sa.PrimaryKeyConstraint("id_program"),
        sa.UniqueConstraint("unique_id_program"),
        schema="gnc_core",
    )
    op.create_table(
        "t_typesite",
        sa.Column("id_typesite", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=200), nullable=True),
        sa.Column("type", sa.String(length=200), nullable=True),
        sa.Column("id_form", sa.Integer(), nullable=True),
        sa.Column("pictogram", sa.Text(), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_form"],
            ["gnc_core.t_custom_form.id_form"],
        ),
        sa.PrimaryKeyConstraint("id_typesite"),
        sa.UniqueConstraint("id_typesite"),
        schema="gnc_sites",
    )
    op.create_table(
        "t_users_rights",
        sa.Column("id_user_right", sa.Integer(), nullable=False),
        sa.Column("id_user", sa.Integer(), nullable=False),
        sa.Column("id_module", sa.Integer(), nullable=True),
        sa.Column("id_program", sa.Integer(), nullable=True),
        sa.Column("right", sa.String(length=150), nullable=False),
        sa.Column("create", sa.Boolean(), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=True),
        sa.Column("update", sa.Boolean(), nullable=True),
        sa.Column("delete", sa.Boolean(), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_module"],
            ["gnc_core.t_modules.id_module"],
        ),
        sa.ForeignKeyConstraint(
            ["id_program"],
            ["gnc_core.t_programs.id_program"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_user"],
            ["gnc_core.t_users.id_user"],
        ),
        sa.PrimaryKeyConstraint("id_user_right"),
        schema="gnc_core",
    )
    op.create_table(
        "t_obstax",
        sa.Column("id_observation", sa.Integer(), nullable=False),
        sa.Column("uuid_sinp", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("id_program", sa.Integer(), nullable=False),
        sa.Column("cd_nom", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=1000), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=True),
        sa.Column("comment", sa.String(length=300), nullable=True),
        sa.Column("municipality", sa.String(length=100), nullable=True),
        sa.Column(
            "geom",
            ga.types.Geometry(
                geometry_type="POINT",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=True,
        ),
        sa.Column(
            "json_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("id_role", sa.Integer(), nullable=True),
        sa.Column("obs_txt", sa.String(length=150), nullable=True),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_program"],
            ["gnc_core.t_programs.id_program"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["id_role"], ["gnc_core.t_users.id_user"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id_observation"),
        sa.UniqueConstraint("id_observation"),
        sa.UniqueConstraint("uuid_sinp"),
        schema="gnc_obstax",
    )
    op.create_table(
        "cor_program_typesites",
        sa.Column("id_cor_program_typesite", sa.Integer(), nullable=False),
        sa.Column("id_program", sa.Integer(), nullable=True),
        sa.Column("id_typesite", sa.Integer(), nullable=True),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_program"],
            ["gnc_core.t_programs.id_program"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_typesite"],
            ["gnc_sites.t_typesite.id_typesite"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id_cor_program_typesite"),
        sa.UniqueConstraint("id_cor_program_typesite"),
        schema="gnc_sites",
    )
    op.create_table(
        "t_sites",
        sa.Column("id_site", sa.Integer(), nullable=False),
        sa.Column("uuid_sinp", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("id_program", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=250), nullable=True),
        sa.Column("id_type", sa.Integer(), nullable=False),
        sa.Column(
            "geom",
            ga.types.Geometry(
                geometry_type="POINT",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=True,
        ),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.Column("id_role", sa.Integer(), nullable=True),
        sa.Column("obs_txt", sa.String(length=150), nullable=True),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_program"],
            ["gnc_core.t_programs.id_program"],
        ),
        sa.ForeignKeyConstraint(
            ["id_role"], ["gnc_core.t_users.id_user"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["id_type"],
            ["gnc_sites.t_typesite.id_typesite"],
        ),
        sa.PrimaryKeyConstraint("id_site"),
        sa.UniqueConstraint("id_site"),
        sa.UniqueConstraint("uuid_sinp"),
        schema="gnc_sites",
    )
    op.create_table(
        "cor_obstax_media",
        sa.Column("id_match", sa.Integer(), nullable=False),
        sa.Column("id_data_source", sa.Integer(), nullable=False),
        sa.Column("id_media", sa.Integer(), nullable=False),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_data_source"],
            ["gnc_obstax.t_obstax.id_observation"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_media"], ["gnc_core.t_medias.id_media"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id_match"),
        sa.UniqueConstraint("id_match"),
        schema="gnc_obstax",
    )
    op.create_table(
        "cor_sites_obstax",
        sa.Column("id_cor_site_obstax", sa.Integer(), nullable=False),
        sa.Column("id_site", sa.Integer(), nullable=False),
        sa.Column("id_obstax", sa.Integer(), nullable=False),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_obstax"],
            ["gnc_obstax.t_obstax.id_observation"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["id_site"], ["gnc_sites.t_sites.id_site"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id_cor_site_obstax"),
        sa.UniqueConstraint("id_cor_site_obstax"),
        schema="gnc_sites",
    )
    op.create_table(
        "t_visit",
        sa.Column("id_visit", sa.Integer(), nullable=False),
        sa.Column("id_site", sa.Integer(), nullable=True),
        sa.Column("date", sa.Date(), nullable=True),
        sa.Column(
            "json_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.Column("id_role", sa.Integer(), nullable=True),
        sa.Column("obs_txt", sa.String(length=150), nullable=True),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_role"], ["gnc_core.t_users.id_user"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["id_site"], ["gnc_sites.t_sites.id_site"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id_visit"),
        sa.UniqueConstraint("id_visit"),
        schema="gnc_sites",
    )
    op.create_table(
        "cor_visites_media",
        sa.Column("id_match", sa.Integer(), nullable=False),
        sa.Column("id_data_source", sa.Integer(), nullable=False),
        sa.Column("id_media", sa.Integer(), nullable=False),
        sa.Column("timestamp_create", sa.DateTime(), nullable=False),
        sa.Column("timestamp_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_data_source"],
            ["gnc_sites.t_visit.id_visit"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_media"], ["gnc_core.t_medias.id_media"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id_match"),
        sa.UniqueConstraint("id_match"),
        schema="gnc_sites",
    )
    op.bulk_insert(
        t_modules,
        [
            {
                "name": "observations",
                "label": "observations",
                "desc": "Module d'observations taxonomiques",
                "timestamp_create": datetime.utcnow(),
            },
            {
                "name": "sites",
                "label": "sites",
                "desc": "Module d'inventaires et de suivis de sites",
                "timestamp_create": datetime.utcnow(),
            },
        ],
    )


def downgrade():
    op.drop_table("cor_visites_media", schema="gnc_sites")
    op.drop_table("t_visit", schema="gnc_sites")
    op.drop_table("cor_sites_obstax", schema="gnc_sites")
    op.drop_table("cor_obstax_media", schema="gnc_obstax")
    op.drop_table("t_sites", schema="gnc_sites")
    op.drop_table("cor_program_typesites", schema="gnc_sites")
    op.drop_table("t_obstax", schema="gnc_obstax")
    op.drop_table("t_users_rights", schema="gnc_core")
    op.drop_table("t_typesite", schema="gnc_sites")
    op.drop_table("t_programs", schema="gnc_core")
    op.drop_table("cor_users_groups", schema="gnc_core")
    op.drop_table("t_users", schema="gnc_core")
    op.drop_table("t_revoked_tokens", schema="gnc_core")
    op.drop_table("t_projects", schema="gnc_core")
    op.drop_table("t_modules", schema="gnc_core")
    op.drop_table("t_medias", schema="gnc_core")
    op.drop_table("t_geometries", schema="gnc_core")
    op.drop_table("t_custom_form", schema="gnc_core")
    op.drop_table("bib_groups", schema="gnc_core")
    op.execute("drop schema gnc_obstax cascade")
    op.execute("drop schema gnc_sites cascade")
