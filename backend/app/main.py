from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, resume, company, roadmap, interview, dashboard
from app.utils.logging_config import logger

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI-powered Placement Preparation Agent Backend API.",
    version="1.0.0"
)

# Enable CORS for React frontend client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup and Shutdown Lifecycle events
@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting FastAPI application...")
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB on startup: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down FastAPI application...")
    await close_mongo_connection()

# Register Routers
app.include_router(auth.router)
app.include_router(resume.router)
# Company and JD router has paths at root level e.g. /company/select, /jd/analyze, /skill-gap/analyze
app.include_router(company.router)
app.include_router(roadmap.router)
app.include_router(interview.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "message": "Welcome to the Placement Preparation Agent API. Use /docs for documentation."
    }

# Global exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught on request {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check logs."}
    )
