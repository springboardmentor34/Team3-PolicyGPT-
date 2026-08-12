from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import policy, scheme, notification, auth, search
from app.routers import eligibility_rule


app = FastAPI(
    title="PolicyGPT API",
    description="Government Policy & Public Scheme Intelligence Platform",
    version="1.0.0"
)


# CORS Configuration
origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(policy.router)
app.include_router(scheme.router)
app.include_router(notification.router)
app.include_router(auth.router)
app.include_router(eligibility_rule.router)
app.include_router(search.router)

@app.get("/")
def root():
    return {
        "project": "PolicyGPT",
        "message": "Government Policy & Public Scheme Intelligence Platform API",
        "status": "Backend Initialized Successfully"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "service": "PolicyGPT Backend"
    }