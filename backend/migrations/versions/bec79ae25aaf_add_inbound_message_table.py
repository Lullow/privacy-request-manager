"""add_inbound_message_table

Revision ID: bec79ae25aaf
Revises: d3a0392429e6
Create Date: 2026-03-30 13:21:04.033384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bec79ae25aaf'
down_revision: Union[str, Sequence[str], None] = 'd3a0392429e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'inbound_message',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('privacy_request_id', sa.Integer(), nullable=True),
        sa.Column('from_email', sa.String(length=200), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['privacy_request_id'], ['privacy_request.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('inbound_message')
