"""Add ondelete cascade for QuizAnswer session_id

Revision ID: e257704f08ff
Revises: f23e3231b4d7
Create Date: 2025-04-28 20:16:13.268623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e257704f08ff'
down_revision: Union[str, None] = 'f23e3231b4d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('quiz_answers', 'session_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.alter_column('quiz_answers', 'question_id',
               existing_type=sa.UUID(),
               nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('quiz_answers', 'question_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.alter_column('quiz_answers', 'session_id',
               existing_type=sa.UUID(),
               nullable=False)
    # ### end Alembic commands ###
