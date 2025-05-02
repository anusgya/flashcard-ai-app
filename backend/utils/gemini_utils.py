import re
from google import genai
from google.genai import types # <-- Make sure this is imported
import os
import pathlib # <-- Make sure this is imported
import httpx # <-- Make sure this is imported
from typing import Optional, List, Dict, Tuple

# Initialize the Gemini client
api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyAf50LasvZaC4bBtr7Sa59Ou8dx0IQx5BI")
client = genai.Client(api_key=api_key)

def clean_formatting(text: str) -> str:
    """Remove markdown formatting from text."""
    # Remove markdown bold/italic formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Remove **bold**
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Remove *italic*
    
    # Remove other potential markdown elements
    text = re.sub(r'#{1,6}\s', '', text)          # Remove headings
    text = re.sub(r'```[a-z]*\n|```', '', text)   # Remove code blocks
    
    # Clean up extra whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = text.strip()
    
    return text

def generate_mnemonic(front_content: str, back_content: str, technique: Optional[str] = None) -> str:
    """Generate a mnemonic for a flashcard using Gemini."""
    
    techniques = {
        # "acronym": "Create an acronym where each letter stands for a key word or concept.",
        # "acrostic": "Create an acrostic where the first letter of each word in a sentence spells out a key term.",
        "rhyme": "Create a rhyming phrase or short poem that's catchy and easy to remember.",
        "visualization": "Create a vivid mental image that connects the concepts in a memorable way.",
        # "chunking": "Break down complex information into smaller, manageable chunks.",
        "story": "Create a brief narrative that connects the concepts in a memorable way.",
        "association": "Link the new information to something already familiar."
    }
    
    # If no technique specified, randomly select one
    if technique is None:
        import random
        technique = random.choice(list(techniques.keys()))
    
    technique_instruction = techniques.get(technique, techniques["association"])
    
    prompt = f"""
    Please create a memorable mnemonic that helps remember that "{front_content}" is "{back_content}".
    
    {technique_instruction}
    
    The mnemonic should be:
    1. Simple
    2. Vivid and distinctive 
    3. Easy to recall
    4. Directly related to the content
    5. Meaningful (not just random letters or words)
    
    Make it slightly humorous or connect it to everyday concepts when possible.
    
    Provide ONLY the mnemonic itself - no explanations, introductions, or additional text.
    Do not use any formatting like bold, italic, or markdown.
    """
    
    chat = client.chats.create(model="gemini-2.0-flash")
    response = chat.send_message(prompt)
    return clean_formatting(response.text)

def generate_explanation(front_content: str, back_content: str, detail_level: str = "medium") -> str:
    """Generate an explanation for a flashcard using Gemini."""
    detail_instructions = {
        "basic": "Explain it very simply, like you're talking to a 5-year-old child.",
        "medium": "Explain it simply with fun examples a young child would understand.",
        "detailed": "Explain it like you're talking to a 5-year-old, but include more examples and fun facts."
    }
    
    prompt = f"""
    Explain why "{front_content}" is "{back_content}" in a way that a 5-year-old would understand.
    Use simple words, fun comparisons, and avoid complex concepts.
    {detail_instructions.get(detail_level, detail_instructions["medium"])}
    Do not use any formatting like bold, italic, or markdown in your response.
    """
    
    chat = client.chats.create(model="gemini-2.0-flash")
    response = chat.send_message(prompt)
    return clean_formatting(response.text)

def generate_examples(front_content: str, back_content: str, count: int = 1) -> str:
    """Generate a clear example related to a flashcard using Gemini."""
    prompt = f"""
    Provide a single clear example that demonstrates the relationship between "{front_content}" and "{back_content}".
    
    The example should make the content clear and understandable.
    Focus on creating a practical, real-world scenario that illustrates the concept effectively.
    
    Do not use any special formatting like bold, italic, or markdown in your response.
    Do not number your example or use bullet points.
    
    If the content is a complex concept with multiple parts, make sure to organize your example 
    with appropriate whitespace and paragraph breaks for better readability.
    """
    
    chat = client.chats.create(model="gemini-2.0-flash")
    response = chat.send_message(prompt)
    return clean_formatting(response.text)

def chat_about_card(front_content: str, back_content: str, user_message: str) -> str:
    """Have a conversation about a flashcard with Gemini."""
    chat = client.chats.create(model="gemini-2.0-flash")
    
    # Set context about the card
    chat.send_message(f"I'm studying a flashcard. The front says: '{front_content}' and the back says: '{back_content}'")
    
    # Send user's message with formatting instructions
    response = chat.send_message(f"{user_message} (Please respond without using any markdown formatting, bold, or italic text.)")
    return clean_formatting(response.text)

# --- New Quiz Generation Functions ---

def condense_answer(long_answer: str, max_length: int = 50) -> str:
    """Condense a long answer into a shorter version suitable for quizzes."""
    if len(long_answer) <= max_length:
        # Return the original answer if it's already short enough
        return clean_formatting(long_answer) # Apply cleaning even if not condensed

    prompt = f"""
    Paraphrase this answer into a clear, concise statement that's ideally less than {max_length} characters, but absolutely no more than {max_length + 10} characters:
    "{long_answer}"

    Your paraphrased version must:
    1. Maintain the core meaning and key concepts
    2. Be shorter but clear and precise
    3. Not use any formatting (no markdown, bold, or italic)
    4. Be a complete, grammatically correct sentence or phrase

    Just provide the paraphrased answer without any additional text.
    """

    chat = client.chats.create(model="gemini-2.0-flash")
    response = chat.send_message(prompt)
    condensed = clean_formatting(response.text)

    # If the response is still too long, truncate intelligently
    if len(condensed) > max_length:
        # Find the last space within the allowed length (minus space for ellipsis)
        cut_off_point = max_length - 3
        last_space = condensed.rfind(' ', 0, cut_off_point)

        # If a space is found, truncate there. Otherwise, do a hard cut (fallback).
        if last_space != -1:
            condensed = condensed[:last_space] + "..."
        else:
            # Fallback: Hard truncate if no space found (e.g., very long single word)
            condensed = condensed[:cut_off_point] + "..."

    return condensed

def generate_quiz_options(question: str, correct_answer: str,
                          num_options: int = 3,
                          difficulty: str = "medium",
                          topic: Optional[str] = None) -> List[str]:
    """
    Generate plausible but incorrect options for a multiple-choice quiz.
    Ensures options are conceptually distinct from the correct answer.
    """
    difficulty_guide = {
        "easy": "Create options that are clearly incorrect and significantly different from the correct answer, but still related to the general topic.",
        "medium": "Create plausible-sounding options that are definitely incorrect. They might touch on related concepts but should not be simple rephrasings or minor variations of the correct answer. Ensure they are conceptually distinct.",
        "hard": "Create challenging distractors that are subtly incorrect or represent common misconceptions related to the topic. They must be conceptually different from the correct answer, testing deeper understanding."
    }

    topic_context = f"The card is about: {topic}. " if topic else ""

    prompt = f"""
    Question: "{question}"
    Correct Answer: "{correct_answer}"
    {topic_context}

    Generate {num_options} plausible but **incorrect** multiple-choice options (distractors) for this question.

    **Crucial Instructions:**
    1.  **Incorrect:** Each option MUST be factually incorrect in the context of the question.
    2.  **Conceptually Distinct:** Options must be significantly different in meaning from the correct answer. Do NOT simply rephrase the correct answer, add/remove minor details, or use synonyms. They should represent different concepts or common mistakes.
    3.  **Plausible:** Options should sound believable enough to potentially confuse someone who doesn't fully know the answer, and relate to the question's topic.
    4.  **Unique:** All generated options must be distinct from each other and from the correct answer.
    5.  **Formatting:** Provide only the text of the options, one option per line. Do not use numbering, letters (A, B, C), bullet points, or any markdown formatting.
    6.  **Length:** Keep options concise and roughly similar in length to the correct answer.

    Apply this difficulty level: {difficulty_guide.get(difficulty, difficulty_guide["medium"])}

    Example of what **NOT** to do if Correct Answer is "Paris":
    - Incorrect Option: "The capital of France" (Too close, describes Paris)
    - Incorrect Option: "Paris, France" (Just adds context)

    Example of **GOOD** distinct incorrect options if Correct Answer is "Paris":
    - Incorrect Option: "London" (Another major European capital)
    - Incorrect Option: "The Eiffel Tower" (Related landmark, but not the city itself)
    - Incorrect Option: "Berlin" (Another major European capital)

    Generate the {num_options} incorrect options now:
    """

    chat = client.chats.create(model="gemini-2.0-flash")
    response = chat.send_message(prompt)

    # Clean and parse the options
    raw_options = clean_formatting(response.text).split('\n')

    # Remove any numbering or bullet points and clean up each option
    options = []
    seen_options = {correct_answer.lower()} # Keep track to ensure uniqueness vs correct answer
    for opt in raw_options:
        # Fix the regex pattern to properly handle list markers without cutting off first letters
        # The previous pattern was too aggressive with [A-Z]+ which could match the first letter of the option
        clean_opt = re.sub(r'^[\d\-\*\.\)]+\s*|^[A-Z][\)\.]?\s+', '', opt).strip()
        
        # Remove surrounding quotes if present
        if len(clean_opt) >= 2 and clean_opt.startswith('"') and clean_opt.endswith('"'):
            clean_opt = clean_opt[1:-1].strip()

        if clean_opt and clean_opt.lower() not in seen_options:
            options.append(clean_opt)
            seen_options.add(clean_opt.lower())

    # If we didn't get enough options, try to generate more (simplified retry)
    # Note: A more robust retry might be needed if this consistently fails
    if len(options) < num_options:
        print(f"Warning: Only generated {len(options)}/{num_options} distinct options for: {question}")
        # You could add a retry mechanism here similar to before if needed,
        # but focus on the main prompt first.

    # Limit to exactly the number requested
    return options[:num_options]

def generate_quiz_question(front_content: str, back_content: str, 
                           difficulty: str = "medium",
                           topic: Optional[str] = None,
                           num_options: int = 3) -> Dict:
    """
    Generate a complete multiple-choice question based on a flashcard.
    
    Args:
        front_content: Content from the front of the flashcard (usually the question)
        back_content: Content from the back of the flashcard (usually the answer)
        difficulty: The difficulty level ('easy', 'medium', 'hard')
        topic: Optional topic context
        num_options: Number of incorrect options to generate
        
    Returns:
        Dict containing question, correct_answer, and options
    """
    # First, condense the correct answer if it's too long
    condensed_answer = condense_answer(back_content)
    
    # Generate incorrect options
    incorrect_options = generate_quiz_options(
        question=front_content,
        correct_answer=condensed_answer,
        num_options=num_options,
        difficulty=difficulty,
        topic=topic
    )
    
    # Create a list with all options (correct + incorrect)
    all_options = [condensed_answer] + incorrect_options
    
    # Return the complete question package
    return {
        "question_text": front_content,
        "correct_answer": condensed_answer,
        "options": all_options,
        "difficulty": difficulty
    }

def batch_generate_quiz_questions(cards: List[Tuple[str, str]], 
                                 difficulty: str = "medium",
                                 topic: Optional[str] = None,
                                 num_options: int = 3) -> List[Dict]:
    """
    Generate multiple quiz questions in a single batch to optimize API usage.
    
    Args:
        cards: List of (front_content, back_content) tuples
        difficulty: The difficulty level ('easy', 'medium', 'hard')
        topic: Optional topic context
        num_options: Number of incorrect options to generate per question
        
    Returns:
        List of question dictionaries
    """
    if not cards:
        return []
    
    # For small batches (1-3 cards), process them individually
    if len(cards) <= 3:
        return [generate_quiz_question(front, back, difficulty, topic, num_options) 
                for front, back in cards]
    
    # For larger batches, use a more efficient batched approach
    condensed_answers = []
    for _, back in cards:
        condensed_answers.append(condense_answer(back))
    
    # Build a batch prompt for generating all options at once
    card_infos = []
    for i, ((front, _), condensed) in enumerate(zip(cards, condensed_answers)):
        card_infos.append(f"Question {i+1}: \"{front}\" | Correct Answer: \"{condensed}\"")
    
    cards_text = "\n".join(card_infos)
    
    difficulty_guide = {
        "easy": "Create options that are clearly different from the correct answers but still related to the topics.",
        "medium": "Create plausible options that might be confused with the correct answers for someone with partial knowledge.",
        "hard": "Create very challenging distractors that are subtly different from the correct answers and test deep understanding."
    }
    
    topic_context = f"The cards are about: {topic}. " if topic else ""
    
    batch_prompt = f"""
    {topic_context}
    Here are multiple flashcard questions with their correct answers:
    
    {cards_text}
    
    For each question, generate {num_options} plausible but incorrect multiple-choice options.
    {difficulty_guide.get(difficulty, difficulty_guide["medium"])}
    
    Guidelines:
    - Each option should be distinct from the correct answer and from other options
    - Each option should be believable and relate to the question
    - Keep each option approximately the same length as the correct answer
    - Options should be complete sentences/phrases with proper grammar
    - Do not include explanations or elaborations
    
    Format your response with numbered questions and lettered options:
    Question 1:
    A) Option 1
    B) Option 2
    (etc.)
    
    Question 2:
    (and so on)
    """
    
    chat = client.chats.create(model="gemini-2.0-flash")
    response = chat.send_message(batch_prompt)
    
    # Parse the batch response
    result = []
    
    # Split the response by questions
    question_blocks = re.split(r'Question \d+:', clean_formatting(response.text))
    
    # Skip the first element if it's empty (usually is, due to the split)
    if question_blocks and not question_blocks[0].strip():
        question_blocks = question_blocks[1:]
    
    # Process each question block
    for i, block in enumerate(question_blocks):
        if i >= len(cards):
            break
            
        front, back = cards[i]
        condensed = condensed_answers[i]
        
        # Extract options (lines starting with A), B), etc.)
        option_lines = re.findall(r'[A-Z]\)?\s*(.*?)(?=$|\n[A-Z]\)|\n\n)', block, re.DOTALL)
        
        # Clean up the options
        options = []
        seen_options = {condensed.lower()}  # Track seen options to ensure uniqueness
        
        for opt in option_lines:
            clean_opt = opt.strip()
            # Remove surrounding quotes if present
            if len(clean_opt) >= 2 and clean_opt.startswith('"') and clean_opt.endswith('"'):
                clean_opt = clean_opt[1:-1].strip()
                
            if clean_opt and clean_opt.lower() not in seen_options:
                options.append(clean_opt)
                seen_options.add(clean_opt.lower())
        
        # If we didn't get enough options, generate them individually
        if len(options) < num_options:
            question_dict = generate_quiz_question(front, back, difficulty, topic, num_options)
            result.append(question_dict)
            continue
            
        # Create all options (correct + incorrect)
        all_options = [condensed] + options[:num_options]
        
        # Add the question dict to the result
        result.append({
            "question_text": front,
            "correct_answer": condensed,
            "options": all_options,
            "difficulty": difficulty
        })
    
    # If we got fewer results than cards, process the remaining cards individually
    if len(result) < len(cards):
        for i in range(len(result), len(cards)):
            front, back = cards[i]
            question_dict = generate_quiz_question(front, back, difficulty, topic, num_options)
            result.append(question_dict)
    
    return result


# --- New PDF Processing Function ---Make sure this is initialized with your API key

def generate_flashcards_from_pdf(pdf_source: str, num_flashcards: int, topic: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Generates flashcards (front/back pairs) from a PDF file using Gemini.

    Args:
        pdf_source: URL or local file path to the PDF.
        num_flashcards: The desired number of flashcards to generate.
        topic: Optional topic context to guide generation.

    Returns:
        A list of dictionaries, where each dictionary represents a flashcard
        with 'front' and 'back' keys. Returns an empty list on failure.

    Raises:
        FileNotFoundError: If a local PDF path is invalid.
        httpx.RequestError: If downloading from URL fails.
        Exception: For Gemini API errors during upload or generation.
    """
    pdf_path = None
    temp_pdf_path = None  # To keep track if we downloaded a temp file
    generated_flashcards = []

    try:
        # 1. Handle PDF Source (Download URL or use Local Path)
        if pdf_source.startswith(('http://', 'https://')):
            print(f"Downloading PDF from URL: {pdf_source}")
            temp_pdf_path = pathlib.Path(f"temp_{pathlib.Path(pdf_source).name}")
            # Use a reasonable timeout for potentially large files
            response = httpx.get(pdf_source, follow_redirects=True, timeout=60.0)
            response.raise_for_status()
            temp_pdf_path.write_bytes(response.content)
            pdf_path = temp_pdf_path
            print(f"PDF downloaded and saved to: {pdf_path}")
        elif pdf_source.startswith('/uploads/'):
            # Handle server-relative URLs from the web application
            import os
            # Get the base directory - adjust according to your project structure
            BASE_DIR = pathlib.Path(__file__).parent.parent  # Typically 2 levels up from utils
            
            # Map the URL path to the actual filesystem location
            # This should match where your upload endpoint stores files
            STATIC_DIR = BASE_DIR / "static"  # Adjust based on your setup
            
            # Convert URL path to filesystem path (removing leading slash)
            relative_path = pdf_source.lstrip('/')
            abs_path = STATIC_DIR / relative_path
            
            # Print debug information
            print(f"Resolving server path: {pdf_source}")
            print(f"Base directory: {BASE_DIR}")
            print(f"Looking for file at: {abs_path}")
            print(f"Directory exists: {abs_path.parent.exists()}")
            
            if abs_path.parent.exists():
                print(f"Files in directory: {list(abs_path.parent.glob('*'))}")
            
            if not abs_path.is_file():
                # Try an alternative location if the first attempt fails
                ALT_UPLOAD_DIR = BASE_DIR / "uploads"  # Try another common location
                alt_path = ALT_UPLOAD_DIR / relative_path.replace("uploads/", "")
                
                print(f"First path not found, trying alternative: {alt_path}")
                
                if not alt_path.is_file():
                    # One more attempt - some frameworks store with full path structure
                    final_attempt = pathlib.Path(pdf_source.lstrip('/'))
                    print(f"Second path not found, trying direct path: {final_attempt}")
                    
                    if not final_attempt.is_file():
                        raise FileNotFoundError(f"Local PDF file not found at any attempted path: {pdf_source}")
                    abs_path = final_attempt
                else:
                    abs_path = alt_path
            
            pdf_path = abs_path
            print(f"Using uploaded PDF file: {pdf_path}")
        else:
            # Original local path handling
            local_path = pathlib.Path(pdf_source)
            if not local_path.is_file():
                raise FileNotFoundError(f"Local PDF file not found: {pdf_source}")
            pdf_path = local_path
            print(f"Using local PDF file: {pdf_path}")

        # 2 & 3. Construct the Prompt and Generate with Gemini using PDF directly
        print(f"Reading PDF content from: {pdf_path}")
        
        # Read the PDF file content
        pdf_bytes = pdf_path.read_bytes()
        
        topic_instruction = f"Focus on the topic: {topic}." if topic else "Identify the main topics and concepts."
        prompt = f"""
        Analyze the content of the provided PDF document.
        {topic_instruction}

        Generate exactly {num_flashcards} flashcards based on the key information in the document.
        Each flashcard should have a 'Front' (a question, term, or concept) and a 'Back' (the answer or definition).

        Format each flashcard clearly like this, using '---' as a separator between cards:

        Front: [Front text of card 1]
        Back: [Back text of card 1]
        ---
        Front: [Front text of card 2]
        Back: [Back text of card 2]
        ---
        (continue for all {num_flashcards} cards)

        Ensure the Front and Back text are concise and suitable for flashcards.
        Do not include any extra explanations or text outside this format.
        
        IMPORTANT: Make sure the Front contains ONLY the question/term, and the Back contains ONLY the answer/definition.
        DO NOT include the answer in the Front.
        """

        # 4. Generate Content by sending the PDF directly
        print(f"Generating {num_flashcards} flashcards from PDF...")
        model_to_use = "gemini-1.5-flash"  # Or another appropriate model
        
        response = client.models.generate_content(
            model=model_to_use,
            contents=[
                types.Part.from_bytes(
                    data=pdf_bytes,
                    mime_type='application/pdf',
                ),
                prompt
            ]
        )
        print("Flashcard generation response received.")

        # 5. Parse the Response - IMPROVED PARSING LOGIC
        raw_text = response.text
        # Split into individual card blocks based on the '---' separator
        card_blocks = raw_text.strip().split('---')

        for block in card_blocks:
            if not block.strip():
                continue

            # Use non-greedy matching for front to stop at "Back:" or end of string
            front_match = re.search(r"Front:\s*(.*?)(?=\s*Back:|\Z)", block, re.IGNORECASE | re.DOTALL)
            back_match = re.search(r"Back:\s*(.*)", block, re.IGNORECASE | re.DOTALL)

            if front_match and back_match:
                # Extract content
                front_text = front_match.group(1).strip()
                back_text = back_match.group(1).strip()
                
                # Double-check for "Back:" that might have been included in front_text
                if "Back:" in front_text:
                    front_parts = front_text.split("Back:", 1)
                    front_text = front_parts[0].strip()
                
                # Similarly check for "Front:" that might have been included in back_text
                if "Front:" in back_text:
                    back_parts = back_text.split("Front:", 1)
                    back_text = back_parts[0].strip()
                
                # Further clean up any nested 'Front:' or 'Back:' text
                front_text = re.sub(r'^Front:\s*', '', front_text).strip()
                back_text = re.sub(r'^Back:\s*', '', back_text).strip()
                
                # Make sure the front_text doesn't contain the back_text
                if back_text in front_text:
                    front_text = front_text.replace(back_text, '').strip()
                    # Clean up any trailing colons, question marks, etc.
                    front_text = re.sub(r'[:\s]+$', '', front_text)
                    # Make sure it ends with a question mark if it's a question
                    if any(front_text.lower().startswith(q) for q in ['what', 'why', 'how', 'when', 'where', 'who', 'which']) and not front_text.endswith('?'):
                        front_text += '?'

                if front_text and back_text:  # Ensure both are non-empty
                    generated_flashcards.append({"front": front_text, "back": back_text})
                    print(f"Parsed flashcard: Front: {front_text[:30]}... Back: {back_text[:30]}...")
            else:
                print(f"Warning: Could not parse flashcard block:\n{block.strip()}")

        # Ensure we don't return more cards than requested if parsing is imperfect
        generated_flashcards = generated_flashcards[:num_flashcards]
        print(f"Successfully parsed {len(generated_flashcards)} flashcards.")

        return generated_flashcards

    except httpx.RequestError as e:
        print(f"Error downloading PDF from {pdf_source}: {e}")
        raise  # Re-raise the exception
    except FileNotFoundError as e:
        print(f"Error accessing local PDF file: {e}")
        raise  # Re-raise the exception
    except Exception as e:
        # Catch potential Gemini API errors or other issues
        print(f"An error occurred during flashcard generation from PDF: {e}")
        # Consider logging the full error details
        raise  # Re-raise the exception
    finally:
        # 6. Clean up the temporary file
        if temp_pdf_path and temp_pdf_path.exists():
            try:
                temp_pdf_path.unlink()
                print(f"Temporary file {temp_pdf_path} deleted.")
            except OSError as e:
                print(f"Error deleting temporary file {temp_pdf_path}: {e}")