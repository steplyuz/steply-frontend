// Admin test yuklash sahifalari uchun JSON namunalari (backend import qabul qiladigan shakl).

export const READING_JSON_TEMPLATE = `{
  "title": "Reading B1 #1",
  "cefr_level": "B1",
  "language": "en",
  "duration_minutes": 60,
  "parts": [
    {
      "title": "Part 1",
      "description": "Read the text and answer the questions.",
      "passage": "Your passage text...",
      "questions": [
        {
          "question_number": 1,
          "type": "MULTIPLE_CHOICE",
          "text": "What is the main idea?",
          "correct_answer": ["A"],
          "options": [
            {"label": "A", "value": "First option"},
            {"label": "B", "value": "Second option"}
          ]
        }
      ]
    }
  ]
}`

export const LISTENING_JSON_TEMPLATE = `{
  "title": "Listening B1 #1",
  "level": "B1",
  "duration": 35,
  "audio_mode": "PARTS",
  "audio_url": null,
  "sections": "Part 1 | Part 2 | Part 3",
  "parts": [
    {
      "part_number": 1,
      "title": "Part 1",
      "instruction": "Listen and answer the questions.",
      "task_type": "MULTIPLE_CHOICE",
      "audio_url": "/static/listening_audio/part-1.mp3",
      "questions": [
        {
          "question_number": 1,
          "type": "MULTIPLE_CHOICE",
          "question": "Where does the conversation take place?",
          "correct_answer": "A",
          "options": [
            {"label": "A", "value": "First option"},
            {"label": "B", "value": "Second option"},
            {"label": "C", "value": "Third option"},
            {"label": "D", "value": "Fourth option"}
          ]
        }
      ]
    }
  ]
}`

export const WRITING_JSON_TEMPLATE = `{
  "title": "Writing Multilevel 2025 #1",
  "cefr_level": "B2",
  "duration_minutes": 60,
  "tasks": [
    {
      "part_number": 1,
      "sub_part": 1,
      "cefr_level": "B1",
      "topic": "Informal email to a friend",
      "instruction": "Write an informal email to your friend about your feelings and what the club should do. Write about 50 words.",
      "context_text": "You are a member of a fitness club. You received an email from the manager: the fitness centre is closing for a month from next Monday. The building needs repairs and new equipment will be installed.",
      "word_limit": { "min": 45, "max": 55 }
    },
    {
      "part_number": 1,
      "sub_part": 2,
      "cefr_level": "B2",
      "topic": "Formal email to the manager",
      "instruction": "Write a formal letter to the manager about your feelings and what the club management should do. Write 120-150 words.",
      "context_text": "Same situation as Task 1.1: the fitness centre is closing for a month for repairs and new equipment.",
      "word_limit": { "min": 120, "max": 150 }
    },
    {
      "part_number": 2,
      "cefr_level": "C1",
      "topic": "Big city or small town",
      "instruction": "You are participating in an online discussion for language learners. Post your response, giving reasons and examples.",
      "question": "Is it better to live in a big city or a small town?",
      "word_limit": { "min": 180, "max": 200 }
    }
  ]
}`

export const SPEAKING_JSON_TEMPLATE = `{
  "title": "Speaking Test B2 #1",
  "description": "B2 darajasi uchun speaking testi",
  "is_free": false,
  "is_practice": false,
  "is_active": true,
  "part_1_1": {
    "question_1": "Tell me about your hometown.",
    "question_2": "What do you usually do in your free time?",
    "question_3": "How often do you use the internet?",
    "prep_seconds": 10,
    "answer_seconds": 30
  },
  "part_1_2": {
    "image_1_url": "/static/speaking/img1.jpg",
    "image_2_url": "/static/speaking/img2.jpg",
    "question_describe": "Describe what you see in the picture.",
    "question_2": "Which place would you prefer to visit?",
    "question_3": "Why is travel important?",
    "prep_seconds": 15,
    "describe_answer_seconds": 45,
    "answer_seconds": 30
  },
  "part_2": {
    "image_url": "/static/speaking/part2.jpg",
    "question_1": "What is happening in the picture?",
    "question_2": "How does this relate to modern life?",
    "question_3": "What changes do you predict in this area?",
    "prep_seconds": 60,
    "answer_seconds": 120
  },
  "part_3": {
    "topic": "Technology and communication",
    "for_points": ["Connects people globally", "Speeds up information"],
    "against_points": ["Reduces face-to-face contact", "Can spread misinformation"],
    "prep_seconds": 60,
    "answer_seconds": 180
  }
}`

