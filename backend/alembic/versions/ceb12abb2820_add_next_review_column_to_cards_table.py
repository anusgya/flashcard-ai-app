"""Add next_review column to cards table

Revision ID: ceb12abb2820
Revises: 08ea348fd9b7
Create Date: 2025-04-27 11:36:57.206114

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ceb12abb2820'
down_revision: Union[str, None] = '08ea348fd9b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('cards', sa.Column('next_review', sa.DateTime(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('cards', 'next_review')
    # ### end Alembic commands ###
