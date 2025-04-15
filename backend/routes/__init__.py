from fastapi import APIRouter
from .users import router as users
from .decks import router as decks
from .cards import router as cards
from .study import router as study
from .quiz import router as quiz
from .gamification import router as gamification
from .interactions import router as interactions
from .auth import router as auth  # Fixed: changed from auth_routes to auth

# Create main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth, tags=["authentication"])
api_router.include_router(users, tags=["users"])
api_router.include_router(decks, tags=["decks"])
api_router.include_router(cards,  tags=["cards"])
api_router.include_router(study,  tags=["study"])
api_router.include_router(quiz,  tags=["quiz"])
api_router.include_router(gamification, tags=["gamification"])
api_router.include_router(interactions,  tags=["interactions"])

# Export the main router
__all__ = ["api_router"]