from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.services import daraja
from app.websocket_manager import manager

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
    try:
        data = await request.json()
        print("\n🔔 --- SAFARICOM CALLBACK RECEIVED --- 🔔")
        print(data)
        
        result_code = data['Body']['stkCallback']['ResultCode']
        result_desc = data['Body']['stkCallback']['ResultDesc']
        
        # Broadcast the result to the frontend!
        message = {
            "status": "completed" if result_code == 0 else "failed",
            "message": result_desc
        }
        print(f"📨 Broadcasting to frontend: {message}")
        await manager.broadcast(message)
        
        # We must respond to Safaricom letting them know we received the message
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    except Exception as e:
        print(f"❌ Callback error: {e}")
        return {"ResultCode": 1, "ResultDesc": f"Error: {str(e)}"}