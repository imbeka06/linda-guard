from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.websocket_manager import manager
from app.routers import mpesa

app = FastAPI(
    title="LINDA+ GUARD API",
    description="Triple Intelligence Layer for Fraud Prevention and Smart Spending",
    version="1.0.0"
)

# Configure CORS so your Vite React app can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Connect the M-Pesa routes
app.include_router(mpesa.router, prefix="/api/mpesa", tags=["M-Pesa API"])

@app.websocket("/ws/mpesa")
async def mpesa_websocket(websocket: WebSocket):
    print("📡 WebSocket connection attempt from frontend")
    try:
        await manager.connect(websocket)
        print("✅ WebSocket client connected")
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("🔌 WebSocket client disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {
        "system": "LINDA+ GUARD", 
        "status": "Online", 
        "intelligence_layer": "Active"
    }