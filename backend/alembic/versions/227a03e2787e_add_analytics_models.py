"""add_analytics_models

Revision ID: 227a03e2787e
Revises: 499e2e20e0bd
Create Date: 2025-09-12 14:28:23.468535

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '227a03e2787e'
down_revision: Union[str, Sequence[str], None] = '499e2e20e0bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create analytics_events table
    op.create_table('analytics_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('event_category', sa.String(length=50), nullable=False),
        sa.Column('event_data', sa.JSON(), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analytics_events_id'), 'analytics_events', ['id'], unique=False)

    # Create platform_metrics table
    op.create_table('platform_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_users', sa.Integer(), nullable=True),
        sa.Column('active_users', sa.Integer(), nullable=True),
        sa.Column('new_registrations', sa.Integer(), nullable=True),
        sa.Column('user_retention_rate', sa.Float(), nullable=True),
        sa.Column('total_courses', sa.Integer(), nullable=True),
        sa.Column('active_courses', sa.Integer(), nullable=True),
        sa.Column('course_completions', sa.Integer(), nullable=True),
        sa.Column('average_course_rating', sa.Float(), nullable=True),
        sa.Column('total_learning_hours', sa.Float(), nullable=True),
        sa.Column('average_session_duration', sa.Float(), nullable=True),
        sa.Column('assessment_attempts', sa.Integer(), nullable=True),
        sa.Column('assessment_pass_rate', sa.Float(), nullable=True),
        sa.Column('total_messages_sent', sa.Integer(), nullable=True),
        sa.Column('qa_posts_created', sa.Integer(), nullable=True),
        sa.Column('notification_sent', sa.Integer(), nullable=True),
        sa.Column('total_revenue', sa.Float(), nullable=True),
        sa.Column('course_enrollments', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date')
    )
    op.create_index(op.f('ix_platform_metrics_id'), 'platform_metrics', ['id'], unique=False)

    # Create course_analytics table
    op.create_table('course_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_enrollments', sa.Integer(), nullable=True),
        sa.Column('new_enrollments', sa.Integer(), nullable=True),
        sa.Column('completions', sa.Integer(), nullable=True),
        sa.Column('dropouts', sa.Integer(), nullable=True),
        sa.Column('completion_rate', sa.Float(), nullable=True),
        sa.Column('total_views', sa.Integer(), nullable=True),
        sa.Column('unique_viewers', sa.Integer(), nullable=True),
        sa.Column('average_time_spent', sa.Float(), nullable=True),
        sa.Column('content_interactions', sa.Integer(), nullable=True),
        sa.Column('total_assessments', sa.Integer(), nullable=True),
        sa.Column('passed_assessments', sa.Integer(), nullable=True),
        sa.Column('average_score', sa.Float(), nullable=True),
        sa.Column('retake_rate', sa.Float(), nullable=True),
        sa.Column('total_ratings', sa.Integer(), nullable=True),
        sa.Column('average_rating', sa.Float(), nullable=True),
        sa.Column('total_reviews', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_course_analytics_id'), 'course_analytics', ['id'], unique=False)

    # Create user_engagement_metrics table
    op.create_table('user_engagement_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('login_count', sa.Integer(), nullable=True),
        sa.Column('session_duration', sa.Float(), nullable=True),
        sa.Column('pages_viewed', sa.Integer(), nullable=True),
        sa.Column('courses_accessed', sa.Integer(), nullable=True),
        sa.Column('learning_time', sa.Float(), nullable=True),
        sa.Column('assessments_completed', sa.Integer(), nullable=True),
        sa.Column('assessments_passed', sa.Integer(), nullable=True),
        sa.Column('messages_sent', sa.Integer(), nullable=True),
        sa.Column('qa_posts_created', sa.Integer(), nullable=True),
        sa.Column('qa_replies_posted', sa.Integer(), nullable=True),
        sa.Column('courses_completed', sa.Integer(), nullable=True),
        sa.Column('certificates_earned', sa.Integer(), nullable=True),
        sa.Column('skill_points_earned', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_engagement_metrics_id'), 'user_engagement_metrics', ['id'], unique=False)

    # Create system_performance_metrics table
    op.create_table('system_performance_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('hour', sa.Integer(), nullable=False),
        sa.Column('average_response_time', sa.Float(), nullable=True),
        sa.Column('peak_response_time', sa.Float(), nullable=True),
        sa.Column('error_rate', sa.Float(), nullable=True),
        sa.Column('uptime_percentage', sa.Float(), nullable=True),
        sa.Column('api_requests', sa.Integer(), nullable=True),
        sa.Column('database_queries', sa.Integer(), nullable=True),
        sa.Column('cache_hit_rate', sa.Float(), nullable=True),
        sa.Column('cpu_usage', sa.Float(), nullable=True),
        sa.Column('memory_usage', sa.Float(), nullable=True),
        sa.Column('disk_usage', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_performance_metrics_id'), 'system_performance_metrics', ['id'], unique=False)

    # Create report_templates table
    op.create_table('report_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('metrics', sa.JSON(), nullable=False),
        sa.Column('filters', sa.JSON(), nullable=True),
        sa.Column('chart_config', sa.JSON(), nullable=True),
        sa.Column('export_formats', sa.JSON(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_report_templates_id'), 'report_templates', ['id'], unique=False)

    # Create saved_reports table
    op.create_table('saved_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('metrics', sa.JSON(), nullable=False),
        sa.Column('filters', sa.JSON(), nullable=True),
        sa.Column('date_range', sa.JSON(), nullable=True),
        sa.Column('chart_config', sa.JSON(), nullable=True),
        sa.Column('is_scheduled', sa.Boolean(), nullable=True),
        sa.Column('schedule_frequency', sa.String(length=20), nullable=True),
        sa.Column('schedule_time', sa.String(length=10), nullable=True),
        sa.Column('last_generated', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_generation', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_reports_id'), 'saved_reports', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_saved_reports_id'), table_name='saved_reports')
    op.drop_table('saved_reports')
    op.drop_index(op.f('ix_report_templates_id'), table_name='report_templates')
    op.drop_table('report_templates')
    op.drop_index(op.f('ix_system_performance_metrics_id'), table_name='system_performance_metrics')
    op.drop_table('system_performance_metrics')
    op.drop_index(op.f('ix_user_engagement_metrics_id'), table_name='user_engagement_metrics')
    op.drop_table('user_engagement_metrics')
    op.drop_index(op.f('ix_course_analytics_id'), table_name='course_analytics')
    op.drop_table('course_analytics')
    op.drop_index(op.f('ix_platform_metrics_id'), table_name='platform_metrics')
    op.drop_table('platform_metrics')
    op.drop_index(op.f('ix_analytics_events_id'), table_name='analytics_events')
    op.drop_table('analytics_events')
