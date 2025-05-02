from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from datetime import datetime
import shutil

from database import get_db
from models import User
from auth import get_current_active_user

router = APIRouter(
    prefix="/api/uploads",
    tags=["uploads"],
    responses={404: {"description": "Not found"}}
)

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a file (e.g., PDF) and return a URL that can be used to access it.
    """

    MAX_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    
    # Check file size (read a small part to get content length)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()  # Get position (file size)
    file.file.seek(0)  # Reset position to beginning
    
    if file_size > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size allowed is {MAX_SIZE/1024/1024} MB"
        )
    # Validate file type (only allow PDFs for now)
    if not file.content_type == "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
    
    # Create a unique filename
    unique_filename = f"{uuid.uuid4()}_{datetime.utcnow().timestamp()}.pdf"
    
    # Create user upload directory if it doesn't exist
    upload_dir = os.path.join("uploads", str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save the file
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    finally:
        file.file.close()
    
    # Get server URL (in production, this would be your domain)
    # For development, this could be a relative URL
    file_url = f"/uploads/{current_user.id}/{unique_filename}"
    
    return {"fileUrl": file_url}