import os
import base64
from datetime import datetime
import httpx
from dotenv import load_dotenv

load_dotenv()

# Constants
CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
PASSKEY = os.getenv("MPESA_PASSKEY")
SHORTCODE = os.getenv("MPESA_BUSINESS_SHORTCODE")
CALLBACK_URL = os.getenv("NGROK_CALLBACK_URL")

AUTH_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
STK_PUSH_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

async def get_access_token():
    """Generates the Daraja OAuth Access Token"""
    credentials = f"{CONSUMER_KEY}:{CONSUMER_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {"Authorization": f"Basic {encoded_credentials}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(AUTH_URL, headers=headers)
        response.raise_for_status()
        return response.json().get("access_token")

async def trigger_stk_push(phone_number: str, amount: int, account_reference: str = "LINDA+ GUARD"):
    """Initiates the STK Push prompt on the user's phone"""
    try:
        access_token = await get_access_token()
        
        # Format the timestamp and generate the password
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{SHORTCODE}{PASSKEY}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()
        
        # Ensure phone number is in 254 format
        if phone_number.startswith("0"):
            phone_number = "254" + phone_number[1:]
        elif phone_number.startswith("+"):
            phone_number = phone_number[1:]

        headers = {"Authorization": f"Bearer {access_token}"}
        
        payload = {
            "BusinessShortCode": SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": CALLBACK_URL,
            "AccountReference": account_reference,
            "TransactionDesc": "LINDA+ Safe Transaction"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(STK_PUSH_URL, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPError as e:
        print(f"HTTP Exception for {e.request.url} - {e}")
        return {"error": "Failed to trigger STK Push"}
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}