# AskWise – Text, Image and Voice Chatbot

A beginner-friendly Flask chatbot using Groq.

## Features
- Text questions using a Groq text model.
- Upload JPG, PNG or WebP images (up to 5 MB) and ask questions about them.
- Browser speech recognition where supported.
- Responsive desktop and mobile layout.
- Shorter, structured answers.

## Setup
1. Keep your existing `.env` file and Groq API key.
2. Install/update packages:
   `pip install -r requirements.txt`
3. Make sure `.env` contains:
   `GROQ_API_KEY=your_real_key`
   `GROQ_TEXT_MODEL=openai/gpt-oss-20b`
   `GROQ_VISION_MODEL=qwen/qwen3.8-27b`
4. Start:
   `python app.py`
5. Open http://127.0.0.1:5000

## Updating an existing AskWise project
Copy these files from this ZIP into your existing project, replacing the matching files:
- app.py
- templates/index.html
- static/style.css
- static/script.js
- requirements.txt

Do not overwrite your existing `.env` file. Add the two model settings above to it if missing.

## How it works
- `index.html`: chat layout, image picker and microphone button.
- `style.css`: styling and mobile layout.
- `script.js`: sends questions, previews images and uses browser speech recognition.
- `app.py`: receives text/image data and selects the text or vision model.
- `.env`: stores your private Groq API key and model settings.

## Notes
- Groq model availability and free-tier quotas can change. Image understanding uses `qwen/qwen3.8-27b`; verify that it is available to your Groq account.
- Browser speech recognition is not supported in every browser. HTTPS is generally required outside localhost.
- Images are sent to Groq for analysis; do not upload private or sensitive images.
- The app has no database or user accounts. Chat history is held in browser memory while the page is open.
