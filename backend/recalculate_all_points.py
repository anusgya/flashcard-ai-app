import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import DATABASE_URL
from models import User
from utils.points_utils import recalculate_user_points

def main():
    """
    One-time script to recalculate and update total_points for all users.
    """
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        users = db.query(User).all()
        if not users:
            print("No users found in the database.")
            return

        print(f"Found {len(users)} users. Starting point recalculation...")

        for user in users:
            original_points = user.total_points
            recalculate_user_points(db, user)
            print(f"User '{user.username}': Points changed from {original_points} to {user.total_points}")

        db.commit()
        print("\nSuccessfully updated total points for all users.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main() 