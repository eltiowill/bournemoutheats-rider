from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("DB_NAME")

async def get_database():
    client = AsyncIOMotorClient(MONGODB_URL)
    return client[DB_NAME]
