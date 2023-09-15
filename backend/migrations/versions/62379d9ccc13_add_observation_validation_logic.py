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
    validation_status = postgresql.ENUM('PENDING', 'UNVERIFIABLE', 'OFFTOPIC', 'MULTIPLE' 'APPROVED', name='validationstatus')
    validation_status.create(op.get_bind())

    op.add_column(
        "t_users",
        sa.Column(
            "verifier",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=True,
        ),
        schema="gnc_core",
    ),
    op.add_column(
        "t_obstax",
        sa.Column(
            'validation_status',
            sa.Enum('PENDING', 'UNVERIFIABLE', 'OFFTOPIC', 'MULTIPLE' 'APPROVED', name='validationstatus'),
            server_default="PENDING",
            nullable=False
        ),
        schema='gnc_obstax'
    )


def downgrade():
    op.drop_column(
        "t_users",
        "verifier",
        schema="gnc_core"
    )
    op.drop_column(
        "t_obstax",
        "validation_status",
        schema="gnc_obstax"
    )

    validation_status = postgresql.ENUM('PENDING', 'UNVERIFIABLE', 'OFFTOPIC', 'MULTIPLE' 'APPROVED', name='validationstatus')
    validation_status.drop(op.get_bind())
