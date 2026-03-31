import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Import from your specific folder structure
from app.websocket_manager import manager
from app.routers import mpesa, fraud, navigation # Added navigation here

load_dotenv()

app = FastAPI(
    title="LINDA-GUARD API",
    description="Triple Intelligence Layer for Fraud Prevention and NeuroVision Navigation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your Vite frontend & Mobile app to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect all the routes in your screenshot
app.include_router(mpesa.router, prefix="/api/mpesa", tags=["M-Pesa API"])
app.include_router(fraud.router, prefix="/api/fraud", tags=["Fraud Detection"])
app.include_router(navigation.router, prefix="/api/navigation", tags=["Navigation"])

@app.websocket("/ws/mpesa")
async def mpesa_websocket(websocket: WebSocket):
    try:
        await manager.connect(websocket)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"system": "LINDA-GUARD", "status": "Online"}