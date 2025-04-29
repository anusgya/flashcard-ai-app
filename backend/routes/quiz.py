from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
from datetime import UTC, datetime
import random

import models
# Remove or comment out the general 'import schemas' if not needed elsewhere
# import schemas
from database import get_db
# Import TimeRange from enums if it's defined there
from enums import TimeRange
# Import necessary schemas from schemas.quiz
# Ensure QuizStartResponse is defined in schemas/quiz.py
from schemas.quiz import (
    QuizDifficulty,
    QuizStartResponse,  # This should now import correctly
    QuizSessionResponse,
    QuizSessionCreate,
    QuizSessionUpdate,
    QuizAnswerResponse,
    QuizAnswerCreate,
    QuizSessionStats,
    QuizQuestionResponse
)
from auth import get_current_active_user

# Import the Gemini helper functions
from utils.gemini_utils import generate_quiz_question, condense_answer

router = APIRouter(
    prefix="/api/quiz",
    tags=["quiz"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/sessions", response_model=QuizSessionResponse)
def create_quiz_session(
    session: QuizSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify deck exists and user has access
    try:
        deck = db.query(models.Deck).filter(models.Deck.id == session.deck_id).first()
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        if not deck.is_public and deck.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this deck")

        db_session = models.QuizSession(
            deck_id=session.deck_id,
            user_id=current_user.id
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
    except Exception as e:
        print(e)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return db_session

@router.get("/sessions/{session_id}", response_model=QuizSessionResponse)
def get_quiz_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    session = db.query(models.QuizSession).filter(models.QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    return session

@router.put("/sessions/{session_id}", response_model=QuizSessionResponse)
def update_quiz_session(
    session_id: str,
    session_update: QuizSessionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    session = db.query(models.QuizSession).filter(models.QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this session")
    
    for key, value in session_update.dict().items():
        setattr(session, key, value)
    
    db.commit()
    db.refresh(session)
    return session

@router.post("/answers", response_model=QuizAnswerResponse)
def submit_quiz_answer(
    answer: QuizAnswerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify session exists and belongs to user
    session = db.query(models.QuizSession).filter(models.QuizSession.id == answer.session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invalid quiz session")

    # Get question to verify answer
    question = db.query(models.QuizQuestion).filter(models.QuizQuestion.id == answer.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Calculate points based on time taken and difficulty
    points = calculate_points(answer.time_taken, question.difficulty)
    is_correct = answer.user_answer.lower() == question.correct_answer.lower()

    db_answer = models.QuizAnswer(
        **answer.dict(),
        is_correct=is_correct,
        points_earned=points if is_correct else 0
    )
    db.add(db_answer)
    
    # Update session statistics
    session.correct_answers += 1 if is_correct else 0
    session.points_earned += points if is_correct else 0
    
    # Calculate accuracy
    total_answers = db.query(models.QuizAnswer).filter(
        models.QuizAnswer.session_id == session.id
    ).count() + 1  # +1 for current answer
    
    correct_answers = db.query(models.QuizAnswer).filter(
        models.QuizAnswer.session_id == session.id,
        models.QuizAnswer.is_correct == True
    ).count() + (1 if is_correct else 0)  # Add current answer if correct
    
    session.accuracy = correct_answers / total_answers if total_answers > 0 else 0
    
    db.commit()
    db.refresh(db_answer)
    return db_answer

@router.get("/stats/{deck_id}", response_model=QuizSessionStats)
def get_quiz_stats(
    deck_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify deck access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")

    # Calculate statistics
    sessions = db.query(models.QuizSession).filter(
        models.QuizSession.deck_id == deck_id,
        models.QuizSession.user_id == current_user.id
    ).all()

    if not sessions:
        return QuizSessionStats(
            total_sessions=0,
            average_accuracy=0.0,
            total_points=0,
            best_score=0,
            average_time=0.0,
            completion_rate=0.0
        )

    total_sessions = len(sessions)
    total_points = sum(session.points_earned for session in sessions)
    best_score = max(session.points_earned for session in sessions)
    average_accuracy = sum(session.accuracy for session in sessions) / total_sessions
    average_time = sum(session.time_taken for session in sessions) / total_sessions
    completed_sessions = len([s for s in sessions if s.end_time is not None])
    completion_rate = completed_sessions / total_sessions

    return QuizSessionStats(
        total_sessions=total_sessions,
        average_accuracy=average_accuracy,
        total_points=total_points,
        best_score=best_score,
        average_time=average_time,
        completion_rate=completion_rate
    )

def calculate_points(time_taken: int, difficulty: str) -> int:
    base_points = {
        "easy": 10,
        "medium": 20,
        "hard": 30
    }
    time_bonus = max(0, 30 - time_taken) // 5  # Bonus points for quick answers
    return base_points.get(difficulty.lower(), 20) + time_bonus

@router.get("/sessions", response_model=List[QuizSessionResponse])
def list_quiz_sessions(
    time_range: TimeRange,
    deck_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    try:
        # Start with base query for user's sessions
        query = db.query(models.QuizSession).filter(
            models.QuizSession.user_id == current_user.id
        )
        
        # Apply time range filter
        now = datetime.utcnow()
        if time_range == TimeRange.TODAY:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(models.QuizSession.start_time >= start_date)
        elif time_range == TimeRange.WEEK:
            start_date = now - datetime.timedelta(days=7)
            query = query.filter(models.QuizSession.start_time >= start_date)
        elif time_range == TimeRange.MONTH:
            start_date = now - datetime.timedelta(days=30)
            query = query.filter(models.QuizSession.start_time >= start_date)
        
        # Apply deck filter if provided
        if deck_id:
            query = query.filter(models.QuizSession.deck_id == deck_id)
        
        # Order by creation date, newest first
        query = query.order_by(models.QuizSession.start_time.desc())
        
        return query.all()
    except Exception as e:
        print(e)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# -------- Enhanced Quiz Generation Endpoints --------

@router.get("/questions/{card_id}", response_model=QuizQuestionResponse)
def get_card_question(
    card_id: str,
    difficulty: Optional[QuizDifficulty] = QuizDifficulty.MEDIUM,
    regenerate: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify card exists
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check if user has access to the card's deck
    deck = db.query(models.Deck).filter(models.Deck.id == card.deck_id).first()
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this card")
    
    # Check if we need to regenerate or if an existing question exists
    existing_question = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.card_id == card_id
    ).first()
    
    if existing_question and not regenerate:
        return existing_question
    
    # Generate a new question
    try:
        # Extract card content
        front_content = card.front_content  # This will be used as the question text
        back_content = card.back_content    # This will be condensed for the correct answer
        
        # First, condense the answer
        condensed_answer = condense_answer(back_content)
        
        # Generate quiz question using Gemini
        quiz_data = generate_quiz_question(
            front_content=front_content,
            back_content=back_content,  # Pass full back content to generate_quiz_question
            difficulty=difficulty.value,
            topic=deck.name,
            num_options=3
        )
        
        # Combine correct answer and generated incorrect options
        raw_options = [condensed_answer] + quiz_data.get("options", [])[:3]
        
        # Clean extra quotes and ensure uniqueness
        cleaned_options = set()
        for opt in raw_options:
            # Remove leading/trailing quotes if present
            if isinstance(opt, str) and len(opt) >= 2 and opt.startswith('"') and opt.endswith('"'):
                 cleaned_opt = opt[1:-1]
            else:
                 cleaned_opt = opt
            cleaned_options.add(cleaned_opt)
        
        # Convert back to list and shuffle
        all_options = list(cleaned_options)
        random.shuffle(all_options)
        
        # If we're regenerating, update the existing question
        if existing_question and regenerate:
            existing_question.question_text = front_content
            existing_question.correct_answer = condensed_answer
            existing_question.options = all_options # Use cleaned, unique options
            existing_question.difficulty = difficulty.value
            existing_question.generated_at = datetime.utcnow()
        
            db.commit()
            db.refresh(existing_question)
            return existing_question
        
        # Create new question
        new_question = models.QuizQuestion(
            card_id=card_id,
            question_text=front_content,
            correct_answer=condensed_answer,
            options=all_options, # Use cleaned, unique options
            difficulty=difficulty.value
        )
        
        db.add(new_question)
        db.commit()
        db.refresh(new_question)
    
        return new_question
        
    except Exception as e:
        db.rollback()
        # Log the full error for debugging
        print(f"Error in get_card_question for card {card_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating quiz question: {str(e)}"
        )

@router.get("/session/{session_id}/questions", response_model=List[QuizQuestionResponse])
def get_session_questions(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify session exists and belongs to user
    session = db.query(models.QuizSession).filter(
        models.QuizSession.id == session_id,
        models.QuizSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    # Get the deck for this session
    deck = db.query(models.Deck).filter(models.Deck.id == session.deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Get all cards from the deck
    cards = db.query(models.Card).filter(models.Card.deck_id == session.deck_id).all()
    if not cards:
        raise HTTPException(status_code=404, detail="No cards found in this deck")
    
    # Randomize the order of cards
    random.shuffle(cards)
    
    # Get questions for these cards, generate if needed
    questions = []
    for card in cards:
        # Check if this card already has a quiz question
        question = db.query(models.QuizQuestion).filter(
            models.QuizQuestion.card_id == card.id
        ).first()
        
        if question:
            # Existing question found - use it
            questions.append(question)
        else:
            # Generate new question using Gemini
            try:
                front_content = card.front_content
                back_content = card.back_content

                # First, condense the answer
                condensed_answer = condense_answer(back_content)

                # Generate quiz question with options
                quiz_data = generate_quiz_question(
                    front_content=front_content,
                    back_content=back_content,
                    difficulty="medium",  # Default to medium difficulty
                    topic=deck.name,
                    num_options=3
                )

                # Combine correct answer and generated incorrect options
                raw_options = [condensed_answer] + quiz_data.get("options", [])[:3]

                # Clean extra quotes and ensure uniqueness
                cleaned_options = set()
                for opt in raw_options:
                    # Remove leading/trailing quotes if present
                    if isinstance(opt, str) and len(opt) >= 2 and opt.startswith('"') and opt.endswith('"'):
                         cleaned_opt = opt[1:-1]
                    else:
                         cleaned_opt = opt
                    cleaned_options.add(cleaned_opt)

                # Convert back to list and shuffle
                all_options = list(cleaned_options)
                random.shuffle(all_options)

                # Create new question in DB
                new_question = models.QuizQuestion(
                    card_id=card.id,
                    question_text=front_content,
                    correct_answer=condensed_answer,
                    options=all_options, # Use cleaned, unique options
                    difficulty="medium"
                )

                db.add(new_question)
                db.commit()
                db.refresh(new_question)

                questions.append(new_question)

            except Exception as e:
                print(f"Error generating question for card {card.id}: {str(e)}")
                # Continue with other cards even if this one fails
                continue

    # Update session with total questions
    session.total_questions = len(questions)
    db.commit()
    
    return questions

@router.post("/start", response_model=QuizStartResponse) # This uses the imported schema
def start_quiz(
    deck_id: str,
    difficulty: Optional[QuizDifficulty] = QuizDifficulty.MEDIUM, # Use imported Enum
    num_questions: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Start a new quiz session and get the first batch of randomized questions.
    This endpoint combines session creation with question generation.
    """
    # Verify deck exists and user has access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")
    
    try:
        # Create a new quiz session
        db_session = models.QuizSession(
            deck_id=deck_id,
            user_id=current_user.id
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        # Get cards from the deck
        cards = db.query(models.Card).filter(models.Card.deck_id == deck_id).all()
        if not cards:
            raise HTTPException(status_code=404, detail="No cards found in this deck")
        
        # Limit cards if requested
        if num_questions and num_questions < len(cards):
            cards = random.sample(cards, num_questions)
        
        # Randomize the order
        random.shuffle(cards)
        
        # Get or generate questions for these cards
        questions = []
        for card in cards:
            # Check if this card already has a quiz question with the requested difficulty
            existing_question = db.query(models.QuizQuestion).filter(
                models.QuizQuestion.card_id == card.id,
                models.QuizQuestion.difficulty == difficulty.value
            ).first()
            
            if existing_question:
                # Use existing question
                questions.append(existing_question)
            else:
                # Generate new question using Gemini
                try:
                    front_content = card.front_content
                    back_content = card.back_content
                    
                    # First, condense the answer
                    condensed_answer = condense_answer(back_content)
                    
                    # Generate quiz question with options
                    quiz_data = generate_quiz_question(
                        front_content=front_content,
                        back_content=back_content,
                        difficulty=difficulty.value,
                        topic=deck.name,
                        num_options=3
                    )
                    
                    # The options should include the correct answer and the generated incorrect options
                    all_options = [condensed_answer] + quiz_data["options"][:3]
                    random.shuffle(all_options)  # Randomize option order
                    
                    # Create new question in DB
                    new_question = models.QuizQuestion(
                        card_id=card.id,
                        question_text=front_content,  # Use the card's front content as the question
                        correct_answer=condensed_answer,  # Use the condensed answer
                        options=all_options,
                        difficulty=difficulty.value
                    )
                    
                    db.add(new_question)
                    db.commit()
                    db.refresh(new_question)
                    
                    questions.append(new_question)
                    
                except Exception as e:
                    print(f"Error generating question for card {card.id}: {str(e)}")
                    # Continue with other cards even if this one fails
                    continue
        
        # Update the session with the question count
        db_session.total_questions = len(questions)
        db.commit()
        
        # Return the session and questions
        # Ensure the returned dictionary matches the QuizStartResponse structure
        return {
            "session": db_session,
            "questions": questions
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to start quiz session.")

@router.post("/generate", response_model=List[QuizQuestionResponse])
def generate_quiz_questions(
    deck_id: str,
    difficulty: Optional[QuizDifficulty] = QuizDifficulty.MEDIUM,
    num_questions: Optional[int] = None,
    regenerate: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Generate quiz questions for a deck with proper answer condensing.
    """
    # Verify deck exists and user has access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")
    
    # Get all cards from the deck
    cards = db.query(models.Card).filter(models.Card.deck_id == deck_id).all()
    if not cards:
        raise HTTPException(status_code=404, detail="No cards found in this deck")
    
    # Randomly sample cards if we have more than requested
    if num_questions and len(cards) > num_questions:
        cards = random.sample(cards, num_questions)
    
    # Prepare to store quiz questions
    quiz_questions = []
    
    for card in cards:
        # Check if this user has already interacted with this card at this difficulty
        existing_question = db.query(models.QuizQuestion).filter(
            models.QuizQuestion.card_id == card.id,
            models.QuizQuestion.difficulty == difficulty.value
        ).first()
        
        if existing_question and not regenerate:
            # Use existing question if available and regeneration not requested
            quiz_questions.append(existing_question)
        else:
            # Generate new question using Gemini
            try:
                # Get card content
                front_content = card.front_content
                back_content = card.back_content
                
                # First, condense the answer
                condensed_answer = condense_answer(back_content)
                
                # Generate quiz question with options
                quiz_data = generate_quiz_question(
                    front_content=front_content,
                    back_content=back_content,
                    difficulty=difficulty.value,
                    topic=deck.name,
                    num_options=3
                )
                
                # The options should include the correct answer and the generated incorrect options
                all_options = [condensed_answer] + quiz_data["options"][:3]
                random.shuffle(all_options)  # Randomize option order
                
                if existing_question and regenerate:
                    # Update existing question
                    existing_question.question_text = front_content  # Use card front as question
                    existing_question.correct_answer = condensed_answer  # Use condensed answer
                    existing_question.options = all_options
                    existing_question.generated_at = datetime.utcnow()
                    
                    db.commit()
                    db.refresh(existing_question)
                    quiz_questions.append(existing_question)
                else:
                    # Create new question in DB
                    new_question = models.QuizQuestion(
                        card_id=card.id,
                        question_text=front_content,  # Use card front as question
                        correct_answer=condensed_answer,  # Use condensed answer
                        options=all_options,
                        difficulty=difficulty.value
                    )
                    
                    db.add(new_question)
                    db.commit()
                    db.refresh(new_question)
                    
                    quiz_questions.append(new_question)
                
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=500, 
                    detail=f"Error generating quiz question for card {card.id}: {str(e)}"
                )
    
    return quiz_questions

@router.post("/questions", response_model=QuizQuestionResponse)
def create_quiz_question(
    question,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new quiz question for a card with proper answer condensing.
    """
    # Verify card exists and user has access
    card = db.query(models.Card).filter(models.Card.id == question.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    deck = db.query(models.Deck).filter(models.Deck.id == card.deck_id).first()
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this card")

    try:
        # Get card content
        front_content = card.front_content
        back_content = card.back_content
        
        # Use card front as question if not provided
        if not question.question_text:
            question.question_text = front_content
            
        # Condense the answer if not already provided
        if not question.correct_answer:
            question.correct_answer = condense_answer(back_content)
        
        # Generate options if not provided or if there are fewer than 2
        if not question.options or len(question.options) < 2:
            # Generate quiz question with options
            quiz_data = generate_quiz_question(
                front_content=front_content,
                back_content=back_content,
                difficulty=question.difficulty.value,
                topic=deck.name,
                num_options=3
            )
            
            # The options should include the correct answer and the generated incorrect options
            all_options = [question.correct_answer] + quiz_data["options"][:3]
            random.shuffle(all_options)  # Randomize option order
            question.options = all_options
        
        # Create the question in the database
        db_question = models.QuizQuestion(
            card_id=question.card_id,
            question_text=question.question_text,
            correct_answer=question.correct_answer,
            options=question.options,
            difficulty=question.difficulty.value
        )
        
        db.add(db_question)
        db.commit()
        db.refresh(db_question)
        return db_question
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/random/{deck_id}", response_model=List[QuizQuestionResponse])
def get_random_quiz_questions(
    deck_id: str,
    count: Optional[int] = 10,
    difficulty: Optional[QuizDifficulty] = QuizDifficulty.MEDIUM,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a random selection of quiz questions from a deck, generating them if needed.
    """
    # Verify deck exists and user has access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")
    
    # Get all cards from the deck
    cards = db.query(models.Card).filter(models.Card.deck_id == deck_id).all()
    if not cards:
        raise HTTPException(status_code=404, detail="No cards found in this deck")
    
    # Randomly select cards if we have more than requested
    if len(cards) > count:
        cards = random.sample(cards, count)
    
    # Randomize the order
    random.shuffle(cards)
    
    # Get or generate questions for these cards
    questions = []
    for card in cards:
        # Check if this card already has a quiz question with the requested difficulty
        existing_question = db.query(models.QuizQuestion).filter(
            models.QuizQuestion.card_id == card.id,
            models.QuizQuestion.difficulty == difficulty.value
        ).first()
        
        if existing_question:
            # Use existing question
            questions.append(existing_question)
        else:
            # Generate new question using Gemini
            try:
                front_content = card.front_content
                back_content = card.back_content
                
                # First, condense the answer
                condensed_answer = condense_answer(back_content)
                
                # Generate quiz question with options
                quiz_data = generate_quiz_question(
                    front_content=front_content,
                    back_content=back_content,
                    difficulty=difficulty.value,
                    topic=deck.name,
                    num_options=3
                )
                
                # The options should include the correct answer and the generated incorrect options
                all_options = [condensed_answer] + quiz_data["options"][:3]
                random.shuffle(all_options)  # Randomize option order
                
                # Create new question in DB
                new_question = models.QuizQuestion(
                    card_id=card.id,
                    question_text=front_content,  # Use the card's front content as the question
                    correct_answer=condensed_answer,  # Use the condensed answer
                    options=all_options,
                    difficulty=difficulty.value
                )
                
                db.add(new_question)
                db.commit()
                db.refresh(new_question)
                
                questions.append(new_question)
                
            except Exception as e:
                print(f"Error generating question for card {card.id}: {str(e)}")
                # Continue with other cards even if this one fails
                continue
    
    return questions