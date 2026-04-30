"""
CareerPath AI v3.0 - P1 Enhanced
- JD翻译官 (含图片OCR识别)
- 能力雷达 (增强版可迁移能力)
- 结构化JSON解析
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn, json, os, shutil
from pathlib import Path
from PIL import Image
import pytesseract
import cv2
import numpy as np
from ark_client import client

app = FastAPI(title="CareerPath AI API", version="3.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ===== Models =====
class JDInput(BaseModel):
    jd_text: str

class SkillInput(BaseModel):
    skills: str
    target_job: str


# ===== OCR Helper =====
def ocr_image(image_path: str) -> str:
    """使用 Tesseract OCR 提取图片中的文字"""
    try:
        # Read with OpenCV for preprocessing
        img = cv2.imread(image_path)
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Apply threshold to make text clearer
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
        # Save preprocessed temp
        temp_path = image_path.replace('.', '_processed.')
        cv2.imwrite(temp_path, thresh)
        
        # OCR with Chinese + English
        text = pytesseract.image_to_string(Image.open(temp_path), lang='chi_sim+eng')
        os.remove(temp_path)
        return text.strip()
    except Exception as e:
        # Fallback to direct PIL
        try:
            text = pytesseract.image_to_string(Image.open(image_path), lang='chi_sim+eng')
            return text.strip()
        except Exception as e2:
            return f"OCR识别失败: {e2}"


# ===== JSON Extraction Helper =====
def extract_json(text: str) -> Optional[dict]:
    """从 AI 回复中提取 JSON"""
    # Try direct parse
    try:
        return json.loads(text)
    except:
        pass
    
    # Try ```json ... ```
    import re
    for pattern in [r'```json\s*(.*?)\s*```', r'```\s*(.*?)\s*```', r'(\{.*\})']:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except:
                continue
    return None


# ===== Routes =====
@app.get("/")
async def root():
    return {"service": "CareerPath AI", "version": "3.0.1", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


# ----- Image JD Upload -----
@app.post("/api/jd-from-image")
async def jd_from_image(file: UploadFile = File(...)):
    """上传图片 → OCR识别 → JD翻译"""
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')):
        raise HTTPException(400, "仅支持图片格式: PNG, JPG, JPEG, WebP, BMP")
    
    # Save uploaded file
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # OCR
    ocr_text = ocr_image(str(file_path))
    os.remove(file_path)
    
    if not ocr_text or len(ocr_text) < 10:
        return {"success": False, "error": "图片中未识别到足够的文字，请尝试更清晰的图片", "ocr_text": ocr_text}
    
    # Translate
    result = client.translate_jd(ocr_text)
    if not result["success"]:
        return {"success": False, "error": result["error"], "ocr_text": ocr_text}
    
    return {
        "success": True,
        "ocr_text": ocr_text,
        "data": result["data"],
        "model_used": result["model_used"],
        "tokens": result["tokens"]
    }


# ----- JD Translate (Structured) -----
JD_SYSTEM_PROMPT = """你是一个JD分析专家。分析招聘JD，返回严格的JSON格式:
{
  "daily_work": ["工作内容1", "工作内容2", "工作内容3"],
  "hard_skills": [{"name": "React", "level": "精通", "importance": 9}],
  "soft_skills": ["沟通能力", "团队协作"],
  "hidden_requirements": ["能接受加班", "有抗压能力"],
  "salary_info": {"base": "20k-35k", "year_end": "2-4个月", "total_annual": "28w-50w"},
  "company_info": {"industry": "互联网", "stage": "D轮及以上"},
  "career_path": "前端架构师/技术负责人方向发展",
  "interview_focus": ["框架原理", "项目经验", "系统设计"],
  "match_advice": "建议补充Node.js后端经验"
}
只返回JSON，不要其他文字。"""

@app.post("/api/jd-translate")
async def jd_translate(data: JDInput):
    """JD翻译官 (结构化JSON)"""
    result = client.chat([
        {"role": "system", "content": JD_SYSTEM_PROMPT},
        {"role": "user", "content": data.jd_text}
    ], temperature=0.2)
    
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    parsed = extract_json(result["data"])
    if parsed:
        return {"success": True, "data": parsed, "raw": result["data"], "model_used": result["model_used"], "tokens": result["tokens"]}
    
    return {"success": True, "data": result["data"], "raw_mode": True, "model_used": result["model_used"], "tokens": result["tokens"]}


# ----- Skill Radar (Enhanced) -----
SKILL_SYSTEM_PROMPT = """你是顶尖的职业能力分析师。分析用户技能与目标岗位的差距，返回JSON:
{
  "match_score": 65,
  "match_analysis": "你的技术基础不错，但缺少...",
  "user_skills": [
    {"name": "React", "level": 7, "category": "技术", "evidence": "2年项目经验"},
    {"name": "Python", "level": 5, "category": "技术", "evidence": "课程项目"}
  ],
  "required_skills": [
    {"name": "React", "importance": 9, "category": "技术"},
    {"name": "TypeScript", "importance": 8, "category": "技术"}
  ],
  "gaps": [
    {"skill": "TypeScript", "gap": 8, "priority": "高", "reason": "岗位核心要求", "fix": "花2周学习TypeScript"},
    {"skill": "系统设计", "gap": 5, "priority": "中", "reason": "高级岗位需要"}
  ],
  "transferable_skills": [
    {"skill": "数据分析思维", "from": "曾用Excel做校园活动数据统计", "to": "产品岗位的数据驱动决策能力", "impact": "高"},
    {"skill": "项目管理", "from": "组织过50人社团活动", "to": "跨部门协作的项目管理能力"}
  ],
  "recommendations": ["建议1", "建议2"],
  "roadmap": {
    "month_1": ["学习TypeScript基础", "完成1个小型React+TS项目"],
    "month_3": ["深入学习Node.js", "做1个全栈项目"],
    "month_6": ["学习系统设计", "准备面试题库"]
  }
}
只返回JSON。强调可迁移能力发现：从非技术经历中发现可迁移到目标岗位的能力。"""

@app.post("/api/skill-radar")
async def skill_radar(data: SkillInput):
    result = client.chat([
        {"role": "system", "content": SKILL_SYSTEM_PROMPT},
        {"role": "user", "content": f"我的技能/经历: {data.skills}\n目标岗位: {data.target_job}"}
    ], temperature=0.3, model="ep-20260430160624-7wlsh")
    
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    parsed = extract_json(result["data"])
    if parsed:
        return {"success": True, "data": parsed, "raw": result["data"], "model_used": result["model_used"], "tokens": result["tokens"]}
    
    return {"success": True, "data": result["data"], "raw_mode": True, "model_used": result["model_used"], "tokens": result["tokens"]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
