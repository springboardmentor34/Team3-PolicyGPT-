from fastapi import FastAPI

app = FastAPI(
    title="PolicyGPT API",
    description="Government Policy & Public Scheme Intelligence Platform",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to PolicyGPT Backend"
    }

@app.get("/health")
def health():
    return {
        "status": "Backend Running Successfully"
    }