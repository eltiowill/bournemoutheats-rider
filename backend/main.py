from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
import bcrypt
from models.user import User, UserCreate, UserLogin, UserResponse
from models.delivery import Delivery, DeliveryCreate, DeliveryResponse
from models.order import Order, OrderCreate, OrderResponse
from models.payment import PaymentRequest, PaymentResponse
from models.bank_account import BankAccount, BankAccountCreate
from models.verification import DocumentVerification, VerificationStatus
from models.commission import Commission
from database.connection import get_database
from auth.jwt_handler import create_access_token, get_current_user
from services.priority_service import PriorityService
from services.payment_service import PaymentService
from services.websocket_service import websocket_service
from services.google_maps_service import google_maps_service
from services.notification_service import notification_service
from services.bournemoutheats_api_service import bournemoutheats_api_service
import random

app = FastAPI(title="BournemouthEats Rider API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Services
priority_service = PriorityService()
payment_service = PaymentService()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Message text was: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncIOMotorClient = Depends(get_database)):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_dict = user_data.dict()
    user_dict["password"] = hashed_password.decode('utf-8')
    user_dict["role"] = "Rider"
    user_dict["is_active"] = False
    user_dict["efficiency_score"] = 100
    user_dict["total_deliveries"] = 0
    user_dict["total_earnings"] = 0.0
    user_dict["created_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    return UserResponse(**user_dict)

@app.post("/auth/login")
async def login(user_data: UserLogin, db: AsyncIOMotorClient = Depends(get_database)):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not bcrypt.checkpw(user_data.password.encode('utf-8'), user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", False):
        raise HTTPException(status_code=403, detail="Account not activated")
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

# User management
@app.get("/users/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return UserResponse(**user)

@app.put("/users/me")
async def update_user_info(updates: dict, current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    result = await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": updates}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes made")
    return {"message": "User updated successfully"}

# Admin endpoints
@app.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = []
    cursor = db.users.find({})
    async for user in cursor:
        user["_id"] = str(user["_id"])
        users.append(UserResponse(**user))
    return users

@app.get("/admin/deliveries", response_model=List[DeliveryResponse])
async def get_all_deliveries(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    deliveries = []
    cursor = db.deliveries.find({})
    async for delivery in cursor:
        delivery["_id"] = str(delivery["_id"])
        deliveries.append(DeliveryResponse(**delivery))
    return deliveries

@app.get("/admin/riders-locations")
async def get_riders_locations(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get active riders with their current locations
    riders = []
    cursor = db.users.find({"role": "Rider", "is_active": True})
    async for rider in cursor:
        riders.append({
            "id": str(rider["_id"]),
            "name": rider.get("full_name", "Unknown"),
            "location": rider.get("current_location", {"lat": 0, "lng": 0}),
            "status": rider.get("status", "offline")
        })
    return riders

@app.get("/admin/orders-status")
async def get_orders_status(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get orders grouped by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    cursor = db.orders.aggregate(pipeline)
    
    status_counts = {}
    async for result in cursor:
        status_counts[result["_id"]] = result["count"]
    
    return status_counts

@app.get("/admin/orders")
async def get_all_orders(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = []
    cursor = db.orders.find({}).sort("created_at", -1)
    async for order in cursor:
        order["_id"] = str(order["_id"])
        orders.append(order)
    return orders

@app.post("/admin/assign-order/{order_id}")
async def assign_order_to_rider(order_id: str, rider_id: str, current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Update order with rider assignment
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"rider_id": rider_id, "status": "assigned", "assigned_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Order not found or already assigned")
    
    return {"message": "Order assigned successfully"}

@app.get("/admin/rider-performance")
async def get_rider_performance(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get rider performance metrics
    pipeline = [
        {"$match": {"role": "Rider"}},
        {"$project": {
            "name": "$full_name",
            "efficiency_score": "$efficiency_score",
            "total_deliveries": "$total_deliveries",
            "total_earnings": "$total_earnings",
            "average_delivery_time": "$average_delivery_time"
        }}
    ]
    
    riders = []
    cursor = db.users.aggregate(pipeline)
    async for rider in cursor:
        riders.append(rider)
    
    return riders

@app.get("/admin/rider-performance/{rider_id}")
async def get_specific_rider_performance(rider_id: str, current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    rider = await db.users.find_one({"_id": ObjectId(rider_id), "role": "Rider"})
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    
    # Get delivery history for this rider
    deliveries = []
    cursor = db.deliveries.find({"rider_id": rider_id}).sort("created_at", -1)
    async for delivery in cursor:
        delivery["_id"] = str(delivery["_id"])
        deliveries.append(delivery)
    
    return {
        "rider": {
            "id": str(rider["_id"]),
            "name": rider.get("full_name", "Unknown"),
            "efficiency_score": rider.get("efficiency_score", 100),
            "total_deliveries": rider.get("total_deliveries", 0),
            "total_earnings": rider.get("total_earnings", 0.0)
        },
        "deliveries": deliveries
    }

@app.get("/admin/payment-reports")
async def get_payment_reports(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get payment reports
    pipeline = [
        {"$match": {"role": "Rider"}},
        {"$project": {
            "name": "$full_name",
            "total_earnings": "$total_earnings",
            "efficiency_score": "$efficiency_score",
            "bonus_eligible": {"$gte": ["$efficiency_score", 70]}
        }}
    ]
    
    reports = []
    cursor = db.users.aggregate(pipeline)
    async for report in cursor:
        reports.append(report)
    
    return reports

@app.post("/admin/award-bonus/{rider_id}")
async def award_bonus_to_rider(rider_id: str, bonus_amount: float, current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Award bonus to rider
    result = await db.users.update_one(
        {"_id": ObjectId(rider_id), "role": "Rider"},
        {"$inc": {"total_earnings": bonus_amount}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Rider not found")
    
    return {"message": f"Bonus of ${bonus_amount} awarded successfully"}

@app.get("/admin/incident-alerts")
async def get_incident_alerts(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get incident alerts
    incidents = []
    cursor = db.incidents.find({"status": "open"}).sort("created_at", -1)
    async for incident in cursor:
        incident["_id"] = str(incident["_id"])
        incidents.append(incident)
    
    return incidents

@app.put("/admin/resolve-incident/{incident_id}")
async def resolve_incident(incident_id: str, resolution: str, current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Resolve incident
    result = await db.incidents.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"status": "resolved", "resolution": resolution, "resolved_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Incident not found")
    
    return {"message": "Incident resolved successfully"}

# Payment management endpoints
@app.get("/admin/payment-settings")
async def get_payment_settings(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return payment_service.get_settings()

@app.put("/admin/payment-settings")
async def update_payment_settings(settings: dict, current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    payment_service.update_settings(settings)
    return {"message": "Payment settings updated successfully"}

@app.post("/admin/calculate-payment")
async def calculate_payment(request: PaymentRequest, current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    payment_data = payment_service.calculate_payment(
        pickup_lat=request.pickup_lat,
        pickup_lng=request.pickup_lng,
        delivery_lat=request.delivery_lat,
        delivery_lng=request.delivery_lng,
        rider_efficiency=request.rider_efficiency,
        estimated_time=request.estimated_time,
        peak_hours=request.peak_hours,
        weather_conditions=request.weather_conditions
    )
    
    return PaymentResponse(**payment_data)

@app.get("/admin/weekly-payout-report")
async def get_weekly_payout_report(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return payment_service.generate_weekly_payout_report()

# Phase 5 Features
@app.get("/admin/google-maps/status")
async def get_google_maps_status(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return google_maps_service.get_status()

@app.get("/admin/google-maps/high-demand-zones")
async def get_high_demand_zones(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return google_maps_service.get_high_demand_zones()

@app.post("/admin/google-maps/calculate-route")
async def calculate_route(origin: dict, destination: dict, current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return google_maps_service.calculate_route(origin, destination)

@app.get("/admin/notification-service/status")
async def get_notification_service_status(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return notification_service.get_status()

@app.post("/admin/notification-service/test-email")
async def test_email(email: str, current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return notification_service.send_test_email(email)

@app.post("/admin/notification-service/test-sms")
async def test_sms(phone: str, current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return notification_service.send_test_sms(phone)

@app.get("/admin/bournemoutheats-api/status")
async def get_bournemoutheats_api_status(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return bournemoutheats_api_service.get_status()

@app.get("/admin/bournemoutheats-api/import-stats")
async def get_bournemoutheats_import_stats(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return bournemoutheats_api_service.get_import_stats()

@app.post("/admin/bournemoutheats-api/import-orders")
async def trigger_bournemoutheats_import(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return bournemoutheats_api_service.import_orders()

@app.put("/admin/bournemoutheats-api/settings")
async def update_bournemoutheats_settings(settings: dict, current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return bournemoutheats_api_service.update_settings(settings)

@app.get("/admin/websocket-service/status")
async def get_websocket_service_status(current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return websocket_service.get_status()

# Delivery endpoints
@app.get("/delivery-requests")
async def get_delivery_requests(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Rider":
        raise HTTPException(status_code=403, detail="Rider access required")
    
    # Get available delivery requests
    deliveries = []
    cursor = db.deliveries.find({"status": "pending", "rider_id": None})
    async for delivery in cursor:
        delivery["_id"] = str(delivery["_id"])
        deliveries.append(delivery)
    
    # Send notification to admin about new delivery requests
    await manager.broadcast(f"New delivery requests available: {len(deliveries)}")
    
    return deliveries

@app.post("/delivery-requests/{delivery_id}/accept")
async def accept_delivery(delivery_id: str, current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Rider":
        raise HTTPException(status_code=403, detail="Rider access required")
    
    # Accept delivery
    result = await db.deliveries.update_one(
        {"_id": ObjectId(delivery_id), "status": "pending"},
        {"$set": {"rider_id": str(current_user["_id"]), "status": "accepted", "accepted_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Delivery not available")
    
    # Update rider stats
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$inc": {"total_deliveries": 1}}
    )
    
    return {"message": "Delivery accepted successfully"}

@app.post("/delivery-requests/{delivery_id}/reject")
async def reject_delivery(delivery_id: str, current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Rider":
        raise HTTPException(status_code=403, detail="Rider access required")
    
    # Get delivery details
    delivery = await db.deliveries.find_one({"_id": ObjectId(delivery_id)})
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    # Check if rejection penalty applies
    penalty_applies = False
    if delivery.get("preparation_start_time"):
        try:
            prep_time = datetime.fromisoformat(delivery["preparation_start_time"])
            wait_time = datetime.utcnow() - prep_time
            if wait_time.total_seconds() < 600:  # 10 minutes
                penalty_applies = True
        except ValueError:
            pass
    
    # Apply penalty if needed
    if penalty_applies:
        penalty_points = 5
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$inc": {"efficiency_score": -penalty_points}}
        )
    
    # Update delivery status
    await db.deliveries.update_one(
        {"_id": ObjectId(delivery_id)},
        {"$set": {"status": "rejected", "rejected_at": datetime.utcnow()}}
    )
    
    return {"message": "Delivery rejected", "penalty_applied": penalty_applies}

@app.get("/delivery-history")
async def get_delivery_history(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Rider":
        raise HTTPException(status_code=403, detail="Rider access required")
    
    deliveries = []
    cursor = db.deliveries.find({"rider_id": str(current_user["_id"])}).sort("created_at", -1)
    async for delivery in cursor:
        delivery["_id"] = str(delivery["_id"])
        deliveries.append(delivery)
    
    return deliveries

@app.get("/efficiency-score")
async def get_efficiency_score(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Rider":
        raise HTTPException(status_code=403, detail="Rider access required")
    
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "efficiency_score": user.get("efficiency_score", 100),
        "total_deliveries": user.get("total_deliveries", 0),
        "bonus_eligible": user.get("efficiency_score", 100) > 70
    }

@app.post("/send-notification")
async def send_notification(message: str, current_user: User = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await manager.broadcast(message)
    return {"message": "Notification sent successfully"}

@app.post("/generate-sample-orders")
async def generate_sample_orders(current_user: User = Depends(get_current_user), db: AsyncIOMotorClient = Depends(get_database)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Generate sample delivery requests
    sample_deliveries = []
    for i in range(5):
        delivery = {
            "pickup_address": f"Restaurant {i+1}, Bournemouth",
            "delivery_address": f"Customer {i+1}, Bournemouth",
            "pickup_lat": 50.7184 + (random.random() - 0.5) * 0.01,
            "pickup_lng": -1.8805 + (random.random() - 0.5) * 0.01,
            "delivery_lat": 50.7184 + (random.random() - 0.5) * 0.01,
            "delivery_lng": -1.8805 + (random.random() - 0.5) * 0.01,
            "estimated_distance": round(random.uniform(1.0, 5.0), 2),
            "estimated_time": random.randint(15, 45),
            "status": "pending",
            "rider_id": None,
            "created_at": datetime.utcnow(),
            "preparation_start_time": (datetime.utcnow() - timedelta(minutes=random.randint(5, 15))).isoformat()
        }
        sample_deliveries.append(delivery)
    
    # Insert sample deliveries
    result = await db.deliveries.insert_many(sample_deliveries)
    
    return {"message": f"Generated {len(sample_deliveries)} sample delivery requests", "count": len(sample_deliveries)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
