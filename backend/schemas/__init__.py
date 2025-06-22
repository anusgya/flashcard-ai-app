from schemas.user import (
    UserBase, UserCreate, UserResponse, UserUpdate, UserLogin, UserStats
)
from schemas.card import (
    CardBase, CardCreate, CardResponse, CardUpdate,
    CardMediaBase, CardMediaResponse, CardWithDetails,
    DifficultyLevel, CardState, MediaType, MediaSide,
    CardGenerationRequest # <-- Add this line
)
from schemas.deck import (
    DeckBase, DeckCreate, DeckResponse, DeckUpdate, 
    DeckWithStats, DeckDetailResponse, SourceType
)
from schemas.tag import (
    TagBase, TagCreate, TagResponse, TagUpdate,
    CardTagCreate, CardTagResponse, TagWithCards, TagStats
)
from schemas.study import (
    StudySessionBase, StudySessionCreate, StudySessionResponse,
    StudyRecordBase, StudyRecordCreate, StudyRecordResponse,
    NextCardResponse, StudySessionUpdate, StudySessionStats,
    ResponseQuality, ConfidenceLevel,DueCardsResponse, StatusResponse, SpacedRepetitionProgress
)
from schemas.quiz import (
    QuizSessionCreate, QuizSessionResponse,
    QuizQuestionCreate, QuizQuestionResponse, QuizQuestionWithAnswer,
    QuizAnswerCreate, QuizAnswerResponse,
    QuizSessionUpdate, QuizSessionStats, QuizDifficulty
)
from schemas.gamification import (
    DailyStreakBase, DailyStreakResponse, 
    AchievementBase, AchievementCreate, AchievementResponse, UserRankDetail,
    LeaderboardEntryBase, LeaderboardEntryCreate, LeaderboardEntryResponse,
    LeaderboardResponse, UserGamificationSummary,
    AchievementType, TimeFrame
)
from schemas.interaction import (
    CardInteractionBase, CardInteractionCreate, CardInteractionResponse,
    LLMResponseBase, LLMResponseCreate, LLMResponseResponse, LLMResponseUpdate,
    MnemonicRequest, ExplanationRequest, ExampleRequest,
    InteractionType, ResponseType, CommentBase, CommentCreate, CommentResponse, CommentUpdate
)
from schemas.auth import Token, TokenData
