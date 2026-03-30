from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.services import daraja

router = APIRouter()

# This defines the exact data we expect to receive from your React frontend
class TransactionRequest(BaseModel):
    phone_number: str
    amount: int
    category: str = "General" # We will use this later for the LINDA+ smart rules

@router.get("/status")
async def check_mpesa_status():
    return {"status": "active", "message": "Daraja API router is ready."}

@router.post("/pay")
async def initiate_payment(transaction: TransactionRequest):
    """Trigger the STK Push to the user's phone"""
    
    # NOTE: Later, we will insert the LINDA+ Fraud Engine check right here
    # before we allow the Daraja trigger to fire!
    
    response = await daraja.trigger_stk_push(
        phone_number=transaction.phone_number,
        amount=transaction.amount,
        account_reference="LINDA+"
    )
    
    # If Safaricom rejects our request
    if "error" in response or "errorMessage" in response:
        raise HTTPException(status_code=400, detail=response)
        
    return {
        "status": "success",
        "message": "STK Push triggered successfully. Check your phone!",
        "safaricom_data": response
    }

@router.post("/callback")
async def mpesa_callback(request: Request):
    """Safaricom will send the success/fail receipt to this endpoint"""
    data = await request.json()
    print("\n🔔 --- SAFARICOM CALLBACK RECEIVED --- 🔔")
    print(data)
    
    # We must respond to Safaricom letting them know we received the message
    return {"ResultCode": 0, "ResultDesc": "Accepted"}