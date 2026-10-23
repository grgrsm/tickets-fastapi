from alembic import op
import sqlalchemy as sa


revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('events',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('event_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('venue', sa.String(length=200), nullable=False),
    sa.Column('capacity', sa.Integer(), nullable=False),
    sa.Column('booked_tickets', sa.Integer(), server_default='0', nullable=False),
    sa.CheckConstraint('booked_tickets >= 0 AND booked_tickets <= capacity', name='ck_events_booked_range'),
    sa.CheckConstraint('capacity > 0', name='ck_events_capacity_positive'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('bookings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('contact_email', sa.String(length=320), nullable=False),
    sa.Column('total_price', sa.Integer(), nullable=False),
    sa.Column('participant_count', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('participant_count BETWEEN 1 AND 4', name='ck_bookings_participants'),
    sa.CheckConstraint('total_price >= 0', name='ck_bookings_total'),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bookings_event_id'), 'bookings', ['event_id'], unique=False)
    op.create_table('booking_participants',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('booking_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('age', sa.Integer(), nullable=False),
    sa.Column('ticket_type', sa.String(length=10), nullable=False),
    sa.Column('ticket_price', sa.Integer(), nullable=False),
    sa.CheckConstraint("ticket_type IN ('full', 'child')", name='ck_participants_type'),
    sa.CheckConstraint('age BETWEEN 0 AND 120', name='ck_participants_age'),
    sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_booking_participants_booking_id'), 'booking_participants', ['booking_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_booking_participants_booking_id'), table_name='booking_participants')
    op.drop_table('booking_participants')
    op.drop_index(op.f('ix_bookings_event_id'), table_name='bookings')
    op.drop_table('bookings')
    op.drop_table('events')
