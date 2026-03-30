from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Connect the M-Pesa routes
app.include_router(mpesa.router, prefix="/api/mpesa", tags=["M-Pesa API"])

@app.get("/")
async def root():
    return {
        "system": "LINDA+ GUARD", 
        "status": "Online", 
        "intelligence_layer": "Active"
    }