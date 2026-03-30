from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from app.routers import mpesa

app = FastAPI(
    title="LINDA+ GUARD API",
    description="Triple Intelligence Layer for Fraud Prevention and Smart Spending",
    version="1.0.0"
)

# Configure CORS so your Vite React app can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager for real-time frontend communication
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# Connect the M-Pesa routes
app.include_router(mpesa.router, prefix="/api/mpesa", tags=["M-Pesa API"])

@app.websocket("/ws/mpesa")
async def mpesa_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {
        "system": "LINDA+ GUARD", 
        "status": "Online", 
        "intelligence_layer": "Active"
    }