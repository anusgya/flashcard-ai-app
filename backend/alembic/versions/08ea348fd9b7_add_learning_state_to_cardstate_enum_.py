"""Add learning state to CardState enum and update card_state column type

Revision ID: 08ea348fd9b7
Revises: 2862826ab04a
Create Date: 2025-04-27 10:54:03.338040

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '08ea348fd9b7'
down_revision: Union[str, None] = '2862826ab04a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
