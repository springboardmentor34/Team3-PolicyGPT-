from fastapi import FastAPI
from app.routers import policy, scheme, notification, auth


app = FastAPI(
    title="PolicyGPT API",
    description="Government Policy & Public Scheme Intelligence Platform",
    version="1.0.0"
)

app.include_router(policy.router)
app.include_router(scheme.router)
app.include_router(notification.router)
app.include_router(auth.router)

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
