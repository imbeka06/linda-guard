import os
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/voice")
async def voice_navigation(audio: UploadFile = File(...)):
    try:
        # Step A: Whisper STT
        transcript = await client.audio.transcriptions.create(
            model="whisper-1",
            file=(audio.filename, audio.file) 
        )
        
        # Step B: Guidance Logic (NeuroVision Core)
        current_environment = "A clear path forward, but a staircase starts 3 feet ahead."
        
        chat_response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a concise blind navigation guide. 2 sentences max."},
                {"role": "user", "content": f"User: {transcript.text}. Environment: {current_environment}"}
            ]
        )
        guidance = chat_response.choices[0].message.content

        # Step C: TTS Voice
        tts_response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=guidance
        )
        
        return StreamingResponse(tts_response.iter_bytes(), media_type="audio/mpeg")
    except Exception as e:
        return {"error": str(e)}