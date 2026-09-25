import uvicorn
import os
from main import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting SecureAuth X FastAPI server on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
