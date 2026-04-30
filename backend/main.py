"""
CareerPath AI v3.0 - P1 Enhanced (v3.0.2)
- 增强 OCR 预处理 (降噪/二值化/放大)
- ARK 自动重试 + 超时控制
- 更好的错误日志
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn, json, os, re, time
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import cv2
import numpy as np
from ark_client import client

app = FastAPI(title="CareerPath AI API", version="3.0.2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class JDInput(BaseModel):
    jd_text: str

class SkillInput(BaseModel):
    skills: str
    target_job: str


# ===== Enhanced OCR =====
def ocr_image_enhanced(image_path: str) -> str:
    """多步骤 OCR 预处理以提升文字识别质量"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            # Try PIL fallback
            pil_img = Image.open(image_path)
            img = np.array(pil_img)
            if len(img.shape) == 2:
                img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            elif img.shape[2] == 4:
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)

        # Step 1: Upscale if image is small
        h, w = img.shape[:2]
        if h < 500 or w < 500:
            scale = max(2, 1000 // min(h, w))
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        # Step 2: Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Step 3: Denoise
        denoised = cv2.fastNlMeansDenoising(gray, h=30)

        # Step 4: Adaptive threshold (handles varying lighting)
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8
        )

        # Step 5: OCR with both preprocessed and original
        results = {}
        
        # Try preprocessed
        text1 = pytesseract.image_to_string(thresh, lang='chi_sim+eng', config='--psm 6')
        results['preprocessed'] = text1.strip()

        # Try original with different PSM
        text2 = pytesseract.image_to_string(gray, lang='chi_sim+eng', config='--psm 4')
        results['original'] = text2.strip()

        # Take the longer result
        best = max(results.values(), key=len) if any(results.values()) else ""

        # Clean up: remove garbage characters, normalize spacing
        best = re.sub(r'[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffefa-zA-Z0-9\s\.\,\:\;\-\+\#\(\)\[\]\/]', '', best)
        best = re.sub(r'\n{3,}', '\n\n', best)
        best = best.strip()

        return best if len(best) > 20 else f"OCR识别内容过少({len(best)}字)，请检查图片清晰度:\n{best}"

    except Exception as e:
        return f"OCR处理失败: {str(e)}"


# ===== JSON Extractor =====
def extract_json(text: str) -> Optional[dict]:
    try:
        return json.loads(text)
    except:
        pass
    for pattern in [r'```json\s*(.*?)\s*```', r'```\s*(.*?)\s*```', r'(\{[\s\S]*\})']:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except:
                continue
    return None


# ===== Robust ARK Call =====
def ark_call(messages, temperature=0.3, max_tokens=4096, retries=2):
    """ARK API 调用带重试"""
    last_error = None
    for attempt in range(retries + 1):
        try:
            result = client.chat(messages, temperature=temperature, max_tokens=max_tokens)
            if result["success"]:
                return result
            last_error = result.get("error", "Unknown error")
        except Exception as e:
            last_error = str(e)
        
        if attempt < retries:
            time.sleep(1 * (attempt + 1))  # Exponential backoff
    
    return {"success": False, "error": f"重试{retries}次后仍失败: {last_error}"}


# ===== System Prompts =====
JD_PROMPT = """你是一个专业的JD分析专家。分析招聘JD，返回严格JSON格式:
{
  "daily_work": ["每天和业务沟通需求，了解系统要实现的功能", "根据需求进行前端架构设计", "使用React/Vue进行核心代码开发", "与后端联调接口，确保前后端对接顺畅", "参与代码评审和技术方案讨论"],
  "hard_skills": [{"name": "技能名", "level": "精通/熟练/了解"}],
  "soft_skills": ["沟通能力", "团队协作"],
  "hidden_requirements": ["能接受加班", "抗压能力"],
  "salary_info": {"base": "范围", "year_end": "范围", "total_annual": "范围"},
  "interview_focus": ["面试重点1", "重点2"],
  "career_path": "职业发展方向",
  "match_advice": "匹配建议"
}
如果JD文字不全或有不规范字符，尽最大努力分析可识别的信息。只返回JSON。"""

SKILL_PROMPT = """你是职业能力分析师。分析用户技能与目标岗位，返回JSON:
{
  "match_score": 65,
  "match_analysis": "简短分析",
  "user_skills": [{"name": "技能", "level": 7, "evidence": "来源"}],
  "transferable_skills": [
    {"skill": "可迁移能力名", "from": "来源经历", "to": "可应用到目标岗位", "impact": "高/中"}
  ],
  "gaps": [{"skill": "差距技能", "gap": 5, "priority": "高/中/低", "reason": "原因", "fix": "解决方法"}],
  "recommendations": ["建议1"],
  "roadmap": {"month_1": ["计划1"], "month_3": ["计划2"], "month_6": ["计划3"]}
}
强调从非技术/非相关经历中发现可迁移到目标岗位的能力。只返回JSON。"""


# ===== Routes =====
@app.get("/")
async def root():
    return {"service": "CareerPath AI", "version": "3.0.2", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/jd-from-image")
async def jd_from_image(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')):
        raise HTTPException(400, "仅支持图片格式")
    
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    ocr_text = ocr_image_enhanced(str(file_path))
    os.remove(file_path)
    
    if len(ocr_text) < 15:
        return {"success": False, "error": f"图片文字识别不足 ({len(ocr_text)}字)，建议直接粘贴文字", "ocr_text": ocr_text}
    
    # Send OCR text to JD analysis with special handling for imperfect text
    result = ark_call([
        {"role": "system", "content": f"{JD_PROMPT}\n注意：以下文字可能包含OCR识别误差，请根据上下文推断正确内容。"},
        {"role": "user", "content": ocr_text}
    ], temperature=0.2, max_tokens=4096, retries=1)
    
    if not result["success"]:
        return {"success": True, "ocr_text": ocr_text, "data": None, "error": result["error"]}
    
    parsed = extract_json(result["data"])
    return {
        "success": True,
        "ocr_text": ocr_text,
        "data": parsed or result["data"],
        "model_used": result["model_used"],
        "tokens": result["tokens"]
    }


@app.post("/api/jd-translate")
async def jd_translate(data: JDInput):
    if not data.jd_text.strip():
        return {"success": False, "error": "JD内容为空"}
    
    result = ark_call([
        {"role": "system", "content": JD_PROMPT},
        {"role": "user", "content": data.jd_text}
    ], temperature=0.2, max_tokens=4096, retries=2)
    
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    parsed = extract_json(result["data"])
    return {
        "success": True,
        "data": parsed or result["data"],
        "model_used": result["model_used"],
        "tokens": result["tokens"]
    }


@app.post("/api/skill-radar")
async def skill_radar(data: SkillInput):
    if not data.skills.strip() or not data.target_job.strip():
        return {"success": False, "error": "技能或目标岗位为空"}
    
    result = ark_call([
        {"role": "system", "content": SKILL_PROMPT},
        {"role": "user", "content": f"我的技能/经历:\n{data.skills}\n\n目标岗位: {data.target_job}"}
    ], temperature=0.3, max_tokens=4096, retries=2)
    
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    parsed = extract_json(result["data"])
    return {
        "success": True,
        "data": parsed or result["data"],
        "model_used": result["model_used"],
        "tokens": result["tokens"]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
