"""initial schema

Revision ID: 003e8b60dddf
Revises:
Create Date: 2026-03-28 00:27:28.631256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003e8b60dddf'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(200), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(200), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('verification_token', sa.String(100), nullable=True, unique=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'privacy_request',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_name', sa.String(200), nullable=False),
        sa.Column('company_email', sa.String(200), nullable=False),
        sa.Column('full_name', sa.String(200), nullable=False),
        sa.Column('city', sa.String(120), nullable=True),
        sa.Column('birth_date', sa.String(20), nullable=True),
        sa.Column('profile_url', sa.String(200), nullable=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('tone', sa.String(50), nullable=False, server_default='neutral'),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'message',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('privacy_request_id', sa.Integer(), sa.ForeignKey('privacy_request.id'), nullable=False),
        sa.Column('message_type', sa.String(50), nullable=False),
        sa.Column('source', sa.String(50), nullable=False, server_default='ai'),
        sa.Column('subject', sa.String(255), nullable=False),
        sa.Column('message_body', sa.Text(), nullable=False),
        sa.Column('tone', sa.String(50), nullable=False, server_default='neutral'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'token',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('token', sa.String(255), nullable=False, unique=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('token')
    op.drop_table('message')
    op.drop_table('privacy_request')
    op.drop_table('user')
