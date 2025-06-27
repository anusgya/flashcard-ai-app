from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import update


# Load environment variables
load_dotenv()

# Import your database and models
from database import engine, Base, get_db
import models
import schemas
from auth import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from routes import api_router




# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Flashcard API",
    description="API for a flashcard learning system",
    version="1.0.0"
)

app.mount("/media", StaticFiles(directory="media"), name="media")
app.mount("/avatars", StaticFiles(directory="avatars"), name="avatars")


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # NOT ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Authentication endpoint
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login time
    user.last_login = datetime.now(datetime.timezone.utc)
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Include the main API router
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Flashcard API",
        "version": app.version,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute("SELECT 1").fetchone()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(datetime.timezone.utc)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": str(e),
            "timestamp": datetime.now(datetime.timezone.utc)
        }

@app.get("/media/{user_id}/{deck_id}/{filename}")
async def get_media_file(user_id: str, deck_id: str, filename: str):
    file_path = os.path.join("media", user_id, deck_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        workers=int(os.getenv("WORKERS", 1))
    )


