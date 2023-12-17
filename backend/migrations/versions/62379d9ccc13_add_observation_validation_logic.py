"""add_observation_validation_logic

Revision ID: 62379d9ccc13
Revises: e8c1cd57ad16
Create Date: 2023-09-14 12:09:33.908300

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "62379d9ccc13"
down_revision = "e8c1cd57ad16"
branch_labels = None
depends_on = None


def upgrade():
    validation_status = postgresql.ENUM("NOT_VALIDATED", "INVALID", "NON_VALIDATABLE", "VALIDATED", name="validationstatus")
    validation_status.create(op.get_bind())

    op.add_column(
        "t_users",
        sa.Column(
            "validator",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=True,
        ),
        schema="gnc_core",
    ),
    op.add_column(
        "t_obstax",
        sa.Column(
            "validation_status",
            sa.Enum("NOT_VALIDATED", "INVALID", "NON_VALIDATABLE", "VALIDATED", name="validationstatus"),
            server_default="NOT_VALIDATED",
            nullable=False
        ),
        schema="gnc_obstax"
    )
    op.add_column(
        "t_obstax",
        sa.Column(
            "id_validator",
            sa.Integer(),
            nullable=True
        ),
        schema="gnc_obstax"
    )
    op.create_foreign_key(
        "fk_t_obstax_id_validator_t_user",
        "t_obstax",
        "t_users",
        ["id_validator"],
        ["id_user"],
        ondelete="SET NULL",
        source_schema="gnc_obstax",
        referent_schema="gnc_core"
    )


def downgrade():
    op.drop_column(
        "t_users",
        "validator",
        schema="gnc_core"
    )
    op.drop_column(
        "t_obstax",
        "validation_status",
        schema="gnc_obstax"
    )

    validation_status = postgresql.ENUM("NOT_VALIDATED", "INVALID", "NON_VALIDATABLE", "VALIDATED", name="validationstatus")
    validation_status.drop(op.get_bind())

    op.drop_constraint(
        "fk_t_obstax_id_validator_t_user",
        "t_obstax",
        type_="foreignkey",
        schema="gnc_obstax"
    )
    op.drop_column(
        "t_obstax",
        "id_validator",
        schema="gnc_obstax"
    )
