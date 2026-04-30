"""
CareerPath AI - AI-Native 大学生求职导航系统
Backend: FastAPI + 火山引擎 ARK (豆包大模型)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="CareerPath AI API",
    description="AI-Native 大学生求职导航系统后端服务",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "CareerPath AI",
        "version": "3.0.0",
        "status": "running",
        "engine": "火山引擎 ARK (豆包大模型)"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
