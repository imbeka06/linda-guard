from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
async def check_mpesa_status():
    return {"status": "active", "message": "Daraja API router is ready."}

# We will add the actual STK Push POST route here shortly!