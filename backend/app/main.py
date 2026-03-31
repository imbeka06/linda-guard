import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

# Import your existing managers and routers
from app.websocket_manager import manager
from app.routers import mpesa, fraud

app = FastAPI(
    title="LINDA+ GUARD & NEUROVISION API",
    description="Unified Intelligence Layer for Financial Fraud Prevention and Blind Navigation",
    version="1.0.0"
)

# 1. Initialize OpenAI Client (Ensure OPENAI_API_KEY is in your .env)
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# 2. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "*" # Added for mobile testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 3. Connect existing Routers
app.include_router(mpesa.router, prefix="/api/mpesa", tags=["M-Pesa API"])
app.include_router(fraud.router, prefix="/api/fraud", tags=["Fraud Detection"])

# 4. NEUROVISION: Voice Navigation Endpoint
@app.post("/api/navigation/voice")
async def voice_navigation(audio: UploadFile = File(...)):
    """
    Pitch Strength: Converts live audio to navigation guidance 
    using Whisper (STT), GPT-4o (Logic), and OpenAI TTS (Voice).
    """
    try:
        # Step A: Transcribe the user's speech
        transcript = await client.audio.transcriptions.create(
            model="whisper-1",
            file=(audio.filename, audio.file) 
        )
        user_query = transcript.text
        
        # Step B: Placeholder for your Obstacle Detection Data
        # In production, this would be updated by your camera feed/sensors
        current_environment = "A clear path forward, but a staircase starts 3 feet ahead. A wall is on the immediate right."
        
        # Step C: Brain - Process query against environment
        system_prompt = (
            "You are an assistive navigation guide for a visually impaired user. "
            "Keep responses extremely concise, under 2 sentences, and prioritize immediate physical safety."
        )
        
        chat_response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User asked: '{user_query}'. Current environment: {current_environment}"}
            ]
        )
        guidance_text = chat_response.choices[0].message.content

        # Step D: Voice - Generate human-like response
        tts_response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=guidance_text
        )
        
        # Step E: Stream the audio back to the React Native app
        return StreamingResponse(tts_response.iter_bytes(), media_type="audio/mpeg")

    except Exception as e:
        print(f"❌ Navigation Error: {e}")
        return {"error": str(e)}

# 5. Existing WebSocket Logic
@app.websocket("/ws/mpesa")
async def mpesa_websocket(websocket: WebSocket):
    print("📡 WebSocket connection attempt from frontend")
    try:
        await manager.connect(websocket)
        print("✅ WebSocket client connected")
        while True:
            data = await websocket.receive_