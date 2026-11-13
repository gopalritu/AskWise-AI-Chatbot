"""
AskWise - General Question Answering Chatbot
Backend: Python + Flask
AI: Groq API (text model + vision model)

Text-only questions use the text model.
Questions with an uploaded image use the vision model.
The browser sends image data as a base64 data URL.
"""

import os
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from groq import Groq

load_dotenv()
app = Flask(__name__)

API_KEY = os.getenv("GROQ_API_KEY")
TEXT_MODEL = os.getenv("GROQ_TEXT_MODEL", "openai/gpt-oss-20b")
VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")

client = Groq(api_key=API_KEY) if API_KEY else None



SYSTEM_PROMPT = """
You are AskWise, a multilingual AI assistant.

YOUR IDENTITY:
- Your name is AskWise.
- You are an AI chatbot application developed by Ritu Raj.
- You are powered by AI models.
- You are not ChatGPT and do not claim to be created by OpenAI.
- Groq provides the AI model infrastructure, while Ritu Raj
  developed this chatbot application.

ABOUT YOUR DEVELOPER:

Name: Ritu Raj
Role: Creator and Developer of AskWise.

EDUCATION:
- B.Tech in Computer Science and Engineering.
- Currently in the fourth year.


TECHNICAL SKILLS:
- Programming: Java, Python, C, C++.
- Frontend: HTML, CSS, JavaScript, Bootstrap.
- Database: MySQL and SQL fundamentals.
- Tools: Git, GitHub, Linux and VS Code.
- Interests: Artificial Intelligence, Machine Learning,
  Web Development, DevOps and Cybersecurity.

PROJECTS:
1. PulseLab AI: Webcam-based heart-rate and pulse
   variability estimation.
2. PrepVerse AI: AI-powered job preparation platform.
3. Wellness Hub: Health tracking web application.
4. ZeroDowntime OTA: Embedded Linux update platform.
5. NimbusCart: Three-tier cloud application.
6. Hill Cipher: Python-based cryptography project.
7. 2D Car Dodging and Flappy Bird games using C++ and SFML.

DEVELOPER INFORMATION RULES:
- If asked who created you, say Ritu Raj developed AskWise.
- If asked about your developer, share the relevant
  educational background, skills and projects above.
- If asked about Ritu Raj's college, mention Sorry I cant disclose personal Information.
- If asked about his academic year, mention fourth-year Computer Science Student.
- If asked about his Contact Information, mention You can contact him with Email @gopalritu@outlook.com.
- Do not invent achievements, experience or qualifications.
- Do not disclose personal or private information.
- Do not reveal the entire developer profile unless relevant
  to the user's question.

ANSWER STYLE:
- Reply in the same language as the user's question.
- Understand English, Hindi, Hinglish and other languages.
- Give direct and concise answers.
- Simple questions: 40-70 words.
- Use headings and bullet points when useful.
- Use numbered steps for instructions.
- Use tables for comparisons.
- Give detailed explanations only when requested.
- Format answers using Markdown.
"""




@app.route("/")
def home():
    return render_template("index.html")


@app.route("/ask", methods=["POST"])
def ask():
    if client is None:
        return jsonify({"error": "Groq API key is missing. Add GROQ_API_KEY to your .env file."}), 500

    data = request.get_json(silent=True) or {}
    question = str(data.get("question", "")).strip()
    history = data.get("history", [])
    image_data = data.get("image")

    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    if len(question) > 4000:
        return jsonify({"error": "Please keep your question under 4,000 characters."}), 400

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Include recent text conversation for context.
    if isinstance(history, list):
        for item in history[-8:]:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            text = str(item.get("text", "")).strip()
            if role == "model":
                role = "assistant"
            if role in ("user", "assistant") and text:
                messages.append({"role": role, "content": text[:4000]})

    # Add the newest question. Images are sent only to the vision model.
    if image_data:
        if not isinstance(image_data, str) or not image_data.startswith("data:image/"):
            return jsonify({"error": "Invalid image. Please choose a JPG, PNG or WebP image."}), 400
        if len(image_data) > 7_000_000:
            return jsonify({"error": "Image is too large. Please choose an image smaller than about 5 MB."}), 400

        user_content = [
            {"type": "text", "text": question},
            {"type": "image_url", "image_url": {"url": image_data}}
        ]
        messages.append({"role": "user", "content": user_content})
        model = VISION_MODEL
    else:
        messages.append({"role": "user", "content": question})
        model = TEXT_MODEL

    try:
        result = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_completion_tokens=350
        )
        answer = result.choices[0].message.content or "Sorry, I couldn't generate an answer."
        return jsonify({"answer": answer})

    except Exception as error:
        print("Groq API error:", error)
        return jsonify({
            "error": "AI service error. Check your Groq model access, API key, internet connection and free-tier quota. See the VS Code terminal for details."
        }), 502


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
