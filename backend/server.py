from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Stripe
stripe_api_key = os.environ.get('STRIPE_API_KEY')
if not stripe_api_key:
    logging.warning("STRIPE_API_KEY not found in environment variables")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Madinah Historical Tours API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class HistoricalSite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_arabic: str
    description: str
    significance: str
    duration: str
    distance: str
    image: str
    price: float
    rating: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    site_id: int
    site_name: str
    group_size: int = Field(ge=1, le=10)
    date: str
    time: str
    special_requests: Optional[str] = None
    total_price: float
    booking_type: str  # 'contact' or 'payment'

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    site_id: int
    site_name: str
    group_size: int
    date: str
    time: str
    special_requests: Optional[str] = None
    total_price: float
    booking_type: str
    status: str = "pending"  # pending, confirmed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

# Helper function to convert datetime objects for MongoDB storage
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and 'T' in value:
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    pass
    return item

# Routes
@api_router.get("/")
async def root():
    return {"message": "Madinah Historical Tours API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Historical Sites Routes
@api_router.get("/sites", response_model=List[HistoricalSite])
async def get_historical_sites():
    """Get all historical sites"""
    try:
        sites = await db.historical_sites.find().to_list(length=None)
        return [HistoricalSite(**parse_from_mongo(site)) for site in sites]
    except Exception as e:
        logging.error(f"Error fetching sites: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch historical sites")

@api_router.get("/sites/{site_id}", response_model=HistoricalSite)
async def get_site(site_id: str):
    """Get a specific historical site"""
    try:
        site = await db.historical_sites.find_one({"id": site_id})
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        return HistoricalSite(**parse_from_mongo(site))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching site {site_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch site")

# Booking Routes
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    """Create a new booking"""
    try:
        booking = Booking(**booking_data.dict())
        booking_dict = prepare_for_mongo(booking.dict())
        
        result = await db.bookings.insert_one(booking_dict)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create booking")
        
        # Log the booking
        logging.info(f"New booking created: {booking.id} for {booking.site_name}")
        
        return booking
    except Exception as e:
        logging.error(f"Error creating booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to create booking")

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(user_email: Optional[str] = None):
    """Get bookings, optionally filtered by user email"""
    try:
        query = {}
        if user_email:
            query["email"] = user_email
            
        bookings = await db.bookings.find(query).sort("created_at", -1).to_list(length=100)
        return [Booking(**parse_from_mongo(booking)) for booking in bookings]
    except Exception as e:
        logging.error(f"Error fetching bookings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch bookings")

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    """Get a specific booking"""
    try:
        booking = await db.bookings.find_one({"id": booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return Booking(**parse_from_mongo(booking))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching booking {booking_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch booking")

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str):
    """Update booking status"""
    try:
        if status not in ["pending", "confirmed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid status")
            
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        return {"message": f"Booking status updated to {status}"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating booking status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update booking status")

# User Routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        user = User(**user_data.dict())
        user_dict = prepare_for_mongo(user.dict())
        
        result = await db.users.insert_one(user_dict)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")

@api_router.get("/users/{email}", response_model=User)
async def get_user(email: str):
    """Get user by email"""
    try:
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**parse_from_mongo(user))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching user {email}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user")

# Analytics Routes
@api_router.get("/analytics/bookings")
async def get_booking_analytics():
    """Get booking analytics"""
    try:
        total_bookings = await db.bookings.count_documents({})
        pending_bookings = await db.bookings.count_documents({"status": "pending"})
        confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
        
        # Most popular sites
        pipeline = [
            {"$group": {"_id": "$site_name", "count": {"$sum": 1}, "total_revenue": {"$sum": "$total_price"}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        popular_sites = await db.bookings.aggregate(pipeline).to_list(length=5)
        
        return {
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "confirmed_bookings": confirmed_bookings,
            "popular_sites": popular_sites
        }
    except Exception as e:
        logging.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")

# Include the router in the main app
app.include_router(api_router)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    logger.info("Starting Madinah Historical Tours API")
    
    # Create indexes for better performance
    try:
        await db.bookings.create_index("email")
        await db.bookings.create_index("created_at")
        await db.bookings.create_index("status")
        await db.users.create_index("email", unique=True)
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Clean up database connection"""
    client.close()
    logger.info("Database connection closed")