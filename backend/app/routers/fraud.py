from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Fraud database with risk scores
FRAUD_DATABASE = {
    "0722123456": {"name": "Known Scammer", "risk": 95, "cluster": "Ring Leader", "transactions": 2400},
    "0722234567": {"name": "Reseller Account", "risk": 88, "cluster": "Ring Leader", "transactions": 1800},
    "0722345678": {"name": "Agent Account", "risk": 82, "cluster": "Ring Leader", "transactions": 950},
    "0711111111": {"name": "Verified Merchant", "risk": 5, "cluster": "Legitimate", "transactions": 50000},
    "0755555555": {"name": "Casual User", "risk": 45, "cluster": "Gray Zone", "transactions": 200},
}

# Rules engine configuration
RULES = {
    "block_threshold": 80,  # Block if risk > 80%
    "alert_threshold": 60,  # Alert if risk > 60%
    "categories": {
        "restricted": ["gambling", "betting", "loans"],
        "suspicious": ["money_transfer", "forex"],
        "safe": ["bills", "education", "health"]
    }
}

class FraudCheckRequest(BaseModel):
    phone_number: str
    amount: int = 0
    category: str = "General"

class FraudCheckResponse(BaseModel):
    phone_number: str
    risk_score: int
    risk_level: str
    action: str  # "block", "alert", "proceed"
    message: str
    cluster: str
    confidence: float

@router.post("/check", response_model=FraudCheckResponse)
async def check_fraud(request: FraudCheckRequest):
    """
    Comprehensive fraud check combining:
    1. Number reputation (known fraudsters)
    2. Transaction pattern
    3. Category risk
    4. Amount anomaly
    """
    
    phone = request.phone_number
    amount = request.amount
    category = request.category.lower()
    
    # Step 1: Check if number is in fraud database
    fraud_info = FRAUD_DATABASE.get(phone)
    
    if fraud_info:
        base_risk = fraud_info["risk"]
        cluster = fraud_info["cluster"]
        confidence = 0.95
    else:
        # Unknown number - moderate caution
        base_risk = 40
        cluster = "Unverified"
        confidence = 0.6
    
    # Step 2: Adjust risk based on category
    if category in RULES["categories"]["restricted"]:
        base_risk += 20
    elif category in RULES["categories"]["suspicious"]:
        base_risk += 10
    
    # Step 3: Adjust risk based on amount
    if amount > 10000:
        base_risk += 15
    elif amount > 50000:
        base_risk += 25
    
    # Clamp risk to 0-100
    risk_score = min(100, max(0, base_risk))
    
    # Determine action based on rules
    if risk_score >= RULES["block_threshold"]:
        action = "block"
        risk_level = "critical"
        message = f"🚨 BLOCKED: {phone} has {risk_score}% fraud risk"
    elif risk_score >= RULES["alert_threshold"]:
        action = "alert"
        risk_level = "high"
        message = f"⚠️ WARNING: {phone} has {risk_score}% fraud risk"
    elif risk_score >= 40:
        action = "alert"
        risk_level = "medium"
        message = f"⏱️ CAUTION: {phone} needs verification ({risk_score}% risk)"
    else:
        action = "proceed"
        risk_level = "low"
        message = f"✅ SAFE: {phone} is low risk ({risk_score}%)"
    
    return FraudCheckResponse(
        phone_number=phone,
        risk_score=risk_score,
        risk_level=risk_level,
        action=action,
        message=message,
        cluster=cluster,
        confidence=confidence
    )

@router.get("/rules")
async def get_rules():
    """Get current rules configuration"""
    return RULES

@router.post("/rules/update")
async def update_rules(new_rules: dict):
    """Update fraud detection rules (admin endpoint)"""
    RULES.update(new_rules)
    return {"status": "updated", "rules": RULES}

@router.get("/database")
async def get_fraud_database():
    """Get fraud database (for dashboard visualization)"""
    return {
        "nodes": [
            {
                "id": phone,
                "name": info["name"],
                "risk": info["risk"],
                "cluster": info["cluster"],
                "transactions": info["transactions"]
            }
            for phone, info in FRAUD_DATABASE.items()
        ],
        "total_entries": len(FRAUD_DATABASE),
        "high_risk_count": len([p for p, info in FRAUD_DATABASE.items() if info["risk"] > 80])
    }
