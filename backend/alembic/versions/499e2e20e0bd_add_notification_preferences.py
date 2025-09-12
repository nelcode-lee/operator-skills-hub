"""add_notification_preferences

Revision ID: 499e2e20e0bd
Revises: add_messaging_system
Create Date: 2025-09-12 14:03:54.203180

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '499e2e20e0bd'
down_revision: Union[str, Sequence[str], None] = 'add_messaging_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add notification preference columns to users table
    op.add_column('users', sa.Column('email_notifications', sa.Boolean(), nullable=True, default=True))
    op.add_column('users', sa.Column('realtime_notifications', sa.Boolean(), nullable=True, default=True))
    op.add_column('users', sa.Column('notification_preferences', sa.JSON(), nullable=True, default={
        "messages": True,
        "qa_replies": True,
        "course_updates": True,
        "test_results": True,
        "system": False
    }))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'notification_preferences')
    op.drop_column('users', 'realtime_notifications')
    op.drop_column('users', 'email_notifications')