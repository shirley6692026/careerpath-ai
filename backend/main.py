"""
CareerPath AI v3.0.3
- 简历感知的AI面试官 (机械/能源/金融等多行业)
- OCR增强JD翻译 + 能力雷达
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn, json, os, re, time
from pathlib import Path
from PIL import Image
import pytesseract
import cv2, docx
import numpy as np
from ark_client import client

app = FastAPI(title="CareerPath AI API", version="3.0.3")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ===== Models =====
class JDInput(BaseModel):
    jd_text: str

class SkillInput(BaseModel):
    skills: str
    target_job: str

class InterviewRequest(BaseModel):
    position: str
    domain: str = ""
    company: str = ""
    mode: str = "practice"
    skills: str = ""
    resume_text: str = ""

class InterviewAnswer(BaseModel):
    position: str
    domain: str = ""
    company: str = ""
    question: str
    question_type: str = ""
    answer: str
    resume_context: str = ""

# ===== Resume Parser =====
def parse_docx(filepath: str) -> dict:
    doc = docx.Document(filepath)
    text = '\n'.join(p.text for p in doc.paragraphs)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                text += '\n' + cell.text
    
    info = {"text": text[:3000], "education": [], "skills": [], "experience": []}
    section = "header"
    for line in text.split('\n'):
        line = line.strip()
        if not line: continue
        if any(k in line for k in ['教育', '学校', '大学', '专业']): section = "education"
        elif any(k in line for k in ['技能', '能力', '熟练', '掌握', '证书', '软件']): section = "skills"
        elif any(k in line for k in ['经历', '经验', '项目', '工作']): section = "experience"
        info[section].append(line) if section in info else None
    
    return info

# ===== OCR =====
def ocr_image_enhanced(image_path: str) -> str:
    try:
        img = cv2.imread(image_path)
        if img is None:
            pil_img = Image.open(image_path)
            img = np.array(pil_img)
            if len(img.shape) == 2: img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            elif img.shape[2] == 4: img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        h, w = img.shape[:2]
        if h < 500 or w < 500:
            scale = max(2, 1000 // min(h, w))
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=30)
        thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8)
        text1 = pytesseract.image_to_string(thresh, lang='chi_sim+eng', config='--psm 6')
        text2 = pytesseract.image_to_string(gray, lang='chi_sim+eng', config='--psm 4')
        best = max([text1.strip(), text2.strip()], key=len) if any([text1.strip(), text2.strip()]) else ""
        best = re.sub(r'[^\u4e00-\u9fff\uff00-\uffefa-zA-Z0-9\s\.\,\:\;\-\+#\(\)\[\]\/]', '', best)
        best = re.sub(r'\n{3,}', '\n\n', best).strip()
        return best if len(best) > 20 else f"识别内容过少({len(best)}字)"
    except Exception as e:
        return f"OCR失败: {str(e)}"

# ===== JSON Extractor =====
def extract_json(text: str) -> dict:
    try: return json.loads(text)
    except: pass
    for p in [r'```json\s*(.*?)\s*```', r'```\s*(.*?)\s*```', r'(\{[\s\S]*\})']:
        m = re.search(p, text, re.DOTALL)
        if m:
            try: return json.loads(m.group(1))
            except: continue
    return None

# ===== ARK Call with retry =====
def ark_call(messages, temp=0.3, max_tokens=4096, retries=2):
    last_err = None
    for i in range(retries + 1):
        try:
            r = client.chat(messages, temperature=temp, max_tokens=max_tokens)
            if r["success"]: return r
            last_err = r.get("error", "")
        except Exception as e:
            last_err = str(e)
        if i < retries: time.sleep(1 * (i + 1))
    return {"success": False, "error": f"重试失败: {last_err}"}

# ===== Prompts =====
JD_PROMPT = """你是一个JD分析专家。分析招聘JD，返回JSON:
{
  "daily_work": ["工作内容1", "工作内容2", "工作内容3"],
  "hard_skills": [{"name": "React", "level": "精通"}],
  "soft_skills": ["沟通能力", "团队协作"],
  "hidden_requirements": ["能接受加班"],
  "salary_info": {"base": "20k-35k", "year_end": "2-4个月", "total_annual": "28w-50w"},
  "interview_focus": ["框架原理", "项目经验"],
  "career_path": "发展方向",
  "match_advice": "匹配建议"
}只返回JSON。"""

SKILL_PROMPT = """你是职业能力分析师。分析用户技能与目标岗位，返回JSON:
{
  "match_score": 65,
  "match_analysis": "简短分析",
  "user_skills": [{"name": "React", "level": 7, "evidence": "来源"}],
  "transferable_skills": [{"skill": "能力名", "from": "来源", "to": "应用到", "impact": "高/中"}],
  "gaps": [{"skill": "差距", "gap": 5, "priority": "高/中/低", "reason": "原因", "fix": "解决"}],
  "recommendations": ["建议1"],
  "roadmap": {"month_1": [], "month_3": [], "month_6": []}
}只返回JSON。"""

# ===== Routes =====
@app.get("/") 
async def root():
    return {"service": "CareerPath AI", "version": "3.0.3", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# ----- Resume Upload -----
@app.post("/api/resume/parse")
async def resume_parse(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.docx'):
        raise HTTPException(400, "仅支持 .docx 格式")
    path = UPLOAD_DIR / file.filename
    with open(path, "wb") as f:
        f.write(await file.read())
    try:
        info = parse_docx(str(path))
        return {"success": True, "text": info["text"], "education": info["education"][:5], "skills": info["skills"][:5], "experience": info["experience"][:5]}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if path.exists(): os.remove(str(path))

# ----- JD Translate -----
@app.post("/api/jd-translate")
async def jd_translate(data: JDInput):
    if not data.jd_text.strip(): return {"success": False, "error": "JD为空"}
    r = ark_call([{"role":"system","content":JD_PROMPT},{"role":"user","content":data.jd_text}], temp=0.2)
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}

@app.post("/api/jd-from-image")
async def jd_from_image(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png','.jpg','.jpeg','.webp','.bmp')):
        raise HTTPException(400, "仅支持图片")
    path = UPLOAD_DIR / file.filename
    with open(path, "wb") as f: f.write(await file.read())
    ocr = ocr_image_enhanced(str(path))
    os.remove(str(path))
    if len(ocr) < 15: return {"success": False, "error": f"识别不足({len(ocr)}字)", "ocr_text": ocr}
    r = ark_call([{"role":"system","content":JD_PROMPT+"\n注意：文字有OCR误差，请推断正确内容"},{"role":"user","content":ocr}], temp=0.2)
    if not r["success"]: return {"success": True, "ocr_text": ocr, "data": None, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "ocr_text": ocr, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}

# ----- Skill Radar -----
@app.post("/api/skill-radar")
async def skill_radar(data: SkillInput):
    if not data.skills.strip() or not data.target_job.strip():
        return {"success": False, "error": "技能或目标岗位为空"}
    r = ark_call([{"role":"system","content":SKILL_PROMPT},{"role":"user","content":f"我的技能/经历:\n{data.skills}\n目标岗位: {data.target_job}"}], temp=0.3)
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}

# ----- AI Interviewer (Resume-Aware) -----
@app.post("/api/interview/generate")
async def interview_generate(data: InterviewRequest):
    if not data.position.strip(): return {"success": False, "error": "岗位为空"}
    
    ctx = f"岗位: {data.position}"
    if data.domain: ctx += f"\n行业领域: {data.domain}"
    if data.company: ctx += f"\n目标公司: {data.company}"
    ctx += f"\n模式: {'练习(有思路提示)' if data.mode=='practice' else '实战(限时)' if data.mode=='real' else '压力(追问质疑)'}"
    if data.skills: ctx += f"\n技能背景: {data.skills}"
    
    # 简历上下文（核心优化）
    resume_instruction = ""
    if data.resume_text and len(data.resume_text) > 10:
        ctx += f"\n\n候选人简历:\n{data.resume_text[:2000]}"
        resume_instruction = "\n\n⚠️ 必须基于候选人简历出题！考察其简历中提到的具体技能、项目经历和专业知识。如果简历是机械/能源背景，就出该领域的专业题，不要出互联网产品题。"
    
    interview_system = f"""你是行业专业面试官。根据岗位信息和候选人简历生成3-5个面试题。

核心规则:
1. 🎯 行业匹配：候选人是【{data.domain or data.position}】领域，所有问题必须围绕该领域
2. 📋 基于简历：问题必须针对候选人简历中提到的具体内容（项目、技能、经历）
3. 🧠 专业深度：问题要有行业深度，考察真实专业能力
4. 🚫 禁止跨行业：不得对机械工程师问互联网产品问题

按JSON格式返回:
{{
  "company_style": "行业风格描述",
  "questions": [
    {{
      "id": 1,
      "type": "技术/行为/场景/压力/专业",
      "question": "面试题内容（必须与候选人行业和简历匹配）",
      "difficulty": "简单/中等/困难",
      "tips": "答题思路提示（练习模式用）",
      "expected_keywords": ["关键词"],
      "time_limit": 180
    }}
  ],
  "total_duration": "预计时长",
  "focus_areas": ["考察方向"]
}}"""
    
    # Build system prompt with all context
    system_prompt = interview_system
    if data.resume_text:
        system_prompt += f"\n\n候选人简历信息:\n{data.resume_text[:2000]}\n\n⚠️ 所有面试题必须严格基于以上简历内容出题，考察候选人简历中提到的具体技能、项目和经历。"
    if data.domain:
        system_prompt += f"\n\n⚠️ 行业领域为【{data.domain}】，问题必须围绕该领域，不得跨行业。"
    
    r = ark_call([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"请为{data.position}({data.domain or '不限行业'})岗位生成{data.mode}模式面试题。必须基于简历中提到的具体项目、技能和经历出题。"}
    ], temp=0.4, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}


@app.post("/api/interview/feedback")
async def interview_feedback(data: InterviewAnswer):
    ctx = f"目标岗位: {data.position}"
    if data.domain: ctx += f"\n行业领域: {data.domain}"
    if data.company: ctx += f"\n目标公司: {data.company}"
    if data.resume_context: ctx += f"\n候选人背景: {data.resume_context[:1000]}"
    
    feedback_system = f"""你是专业的面试评分专家。基于候选人背景评估面试回答，返回JSON:
{{
  "score": 7,
  "overall": "总体评价（一句话）",
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1", "不足2"],
  "dimensions": {{
    "professional": {{"score": 7, "comment": "专业能力评价"}},
    "communication": {{"score": 8, "comment": "沟通表达"}},
    "logic": {{"score": 7, "comment": "逻辑思维"}},
    "fit": {{"score": 6, "comment": "岗位匹配"}}
  }},
  "improved_answer": "优化后的参考答案（基于行业背景）",
  "next_question_hint": "可能的追问方向"
}}只返回JSON。"""
    
    r = ark_call([
        {"role": "system", "content": feedback_system + f"\n注意：候选人是{data.domain or '通用'}领域，评价要符合该行业标准。"},
        {"role": "user", "content": f"面试题类型: {data.question_type or '通用'}\n面试题: {data.question}\n\n我的回答:\n{data.answer}"}
    ], temp=0.3, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
