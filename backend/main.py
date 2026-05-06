"""
CareerPath AI v3.0.3
- 简历感知的AI面试官 (机械/能源/金融等多行业)
- OCR增强JD翻译 + 能力雷达
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn, json, os, re, time
from datetime import datetime
from pathlib import Path
from PIL import Image
import pytesseract
import cv2, docx
import numpy as np
from ark_client import client
from resume_workshop_v3 import router as resume_router
from auth_routes import router as auth_router

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
}只返回JSON。不要用```json包裹，不要加说明文字。"""

SKILL_PROMPT = """你是职业能力分析师。分析用户技能与目标岗位，返回JSON:
{
  "match_score": 65,
  "match_analysis": "简短分析",
  "user_skills": [{"name": "React", "level": 7, "evidence": "来源"}],
  "transferable_skills": [{"skill": "能力名", "from": "来源", "to": "应用到", "impact": "高/中"}],
  "gaps": [{"skill": "差距", "gap": 5, "priority": "高/中/低", "reason": "原因", "fix": "解决"}],
  "recommendations": ["建议1"],
  "roadmap": {"month_1": [], "month_3": [], "month_6": []}
}只返回JSON。不要用```json包裹，不要加说明文字。"""

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
    
    # Build context
    ctx_parts = [f"岗位: {data.position}"]
    if data.domain: ctx_parts.append(f"行业领域: {data.domain}")
    if data.company: ctx_parts.append(f"目标公司: {data.company}")
    ctx_parts.append(f"模式: {'练习(有思路提示)' if data.mode=='practice' else '实战(限时)' if data.mode=='real' else '压力(追问质疑)'}")
    if data.skills: ctx_parts.append(f"技能背景: {data.skills}")
    
    resume_context = ""
    if data.resume_text and len(data.resume_text) > 10:
        resume_context = f"\n\n候选人简历信息:\n{data.resume_text[:2000]}\n\n⚠️ 所有面试题应基于以上简历内容出题(如未提供简历则基于岗位通用标准)。"
    
    # Framework selection by mode
    frameworks = {
        "practice": "采用以下6种面试框架混合出题，每种框架至少1题:\n1. 📖 STAR行为面试: 情境-任务-行动-结果\n2. 🔬 专业技术深挖: 针对简历技能深度追问\n3. 💡 场景案例分析: 给出行业真实问题\n4. 🎯 岗位认知: 考察对行业的理解\n5. 🧩 情景判断: 两难选择考察决策逻辑\n6. 📊 数据分析: 用数据驱动决策的能力",
        "real": "采用以下5种面试框架混合出题:\n1. 📖 STAR深度追问: 追问细节和量化结果\n2. 🔬 压力追问: 对项目连续追问\n3. 💡 案例分析: 限时解决行业问题\n4. 🎯 岗位匹配: 为什么适合该岗位\n5. 🧩 优先级排序: 多任务排序说明理由",
        "pressure": "采用压力面试5种框架:\n1. 🔥 质疑挑战: 对回答连续质疑\n2. 🎭 角色扮演: 模拟工作中的冲突\n3. ⏰ 限时决策: 极短时间内做关键决策\n4. 🔄 反转提问: 突然改变问题方向\n5. 💢 否定反馈: 给出负面测试应对能力"
    }
    
    time_limits = {"practice": 600, "real": 300, "pressure": 120}
    default_time = time_limits.get(data.mode, 180)
    
    system_prompt = """你是行业专业面试官。根据岗位和简历生成3-5个不同框架的面试题。

核心规则:
1. 行业匹配：所有问题必须围绕该行业领域
2. 基于简历：问题针对简历中的具体项目、技能和经历
3. 专业深度：问题要有行业深度，考察真实专业能力
4. 禁止跨行业：不得跨行业出题

""" + frameworks.get(data.mode, frameworks["practice"]) + f"""

按JSON格式返回:
{{
  "company_style": "行业风格描述",
  "questions": [
    {{
      "id": 1,
      "type": "STAR行为/专业技术/场景案例/岗位认知/情景判断/压力挑战",
      "question": "面试题内容（必须与行业和简历匹配）",
      "difficulty": "简单/中等/困难",
      "tips": "按对应框架的解题思路给出提示",
      "framework": "所属框架名称",
      "expected_keywords": ["关键词"],
      "time_limit": {default_time}
    }}
  ],
  "total_duration": "预计时长",
  "focus_areas": ["考察方向1", "方向2"]
}}"""
    
    # Add domain and resume context
    if data.domain:
        system_prompt += f"\n\n⚠️ 行业领域为【{data.domain}】，问题必须围绕该领域，不得跨行业。"
    if resume_context:
        system_prompt += resume_context
    
    r = ark_call([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"请为{data.position}({data.domain or '不限行业'})岗位生成{data.mode}模式面试题。如果有简历则基于简历内容出题；如果没有简历，则基于岗位和行业的通用专业要求出题。"}
    ], temp=0.4, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}
@app.post("/api/interview/feedback")
async def interview_feedback(data: InterviewAnswer):
    ctx_parts = [f"目标岗位: {data.position}"]
    if data.domain: ctx_parts.append(f"行业领域: {data.domain}")
    if data.company: ctx_parts.append(f"目标公司: {data.company}")
    if data.resume_context: ctx_parts.append(f"候选人背景: {data.resume_context[:1000]}")
    
    mode_label = {"practice": "练习模式", "real": "实战模式", "pressure": "压力模式"}
    mode_desc = getattr(data, 'mode', 'practice')
    
    feedback_system = """你是专业的面试评分专家。评估候选人的回答，必须提供候选人不知道的新知识和深度分析。

核心规则:
1. 禁止重复候选人的回答内容
2. "参考答案"必须包含候选人没有提到的行业洞见和专业深度
3. 从该行业的实际工作场景出发，提供真实的、有深度的专业知识
4. 如果候选人的回答正确但过于浅显，追问深层问题
5. 从行业最佳实践、前沿技术、常见误区等角度补充新知识

返回JSON:
{
  "score": 7,
  "overall": "总体评价",
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1", "不足2"],
  "dimensions": {
    "professional": {"score": 7, "comment": "专业能力评价"},
    "communication": {"score": 8, "comment": "沟通表达"},
    "logic": {"score": 7, "comment": "逻辑思维"},
    "fit": {"score": 6, "comment": "岗位匹配"}
  },
  "improved_answer": "优化后的参考答案。必须包含候选人没有提到的行业知识和全新视角。如果候选人提到了A，参考答案必须包含B+C+D。",
  "next_question_hint": "基于回答的下一层深入追问方向。注意不是重复问，而是深入追问候选人没回答清楚的部分。"
}
只返回JSON。不要用```json包裹，不要加说明文字。"""
    
    if data.domain:
        feedback_system += f"\n注意：候选人是{data.domain}领域，评价要符合该行业标准。"
    
    r = ark_call([
        {"role": "system", "content": feedback_system},
        {"role": "user", "content": f"面试题类型: {data.question_type or '通用'}\n面试题: {data.question}\n\n我的回答:\n{data.answer}"}
    ], temp=0.3, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    
    # 如果没解析出JSON，重试一次（严格强调JSON格式）
    if not parsed:
        r2 = ark_call([
            {"role": "system", "content": feedback_system + "\n\n⚠️ 警告：上一次回答不是有效的JSON！这次必须只返回JSON，不要任何其他文字。"},
            {"role": "user", "content": f"面试题类型: {data.question_type or '通用'}\n面试题: {data.question}\n\n我的回答:\n{data.answer}"}
        ], temp=0.2, max_tokens=4096)
        if r2["success"]:
            parsed2 = extract_json(r2["data"])
            if parsed2:
                return {"success": True, "data": parsed2, "model_used": r2["model_used"], "tokens": r2["tokens"]}
    
    return {"success": True, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}



@app.post("/api/interview/summary")
async def interview_summary(data: dict):
    """面试总结：汇总所有问题的评分，给出整体评价"""
    answers = data.get("answers", [])
    position = data.get("position", "")
    domain = data.get("domain", "")
    
    if not answers:
        return {"success": False, "error": "没有回答记录"}
    
    # Build summary from all answers
    scores = [a.get("score", 0) for a in answers if a.get("score")]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    
    summary_prompt = f"""你是面试总结专家。基于以下{len(answers)}轮面试回答的评分和反馈，生成总结报告JSON:

岗位: {position}
行业: {domain or '不限'}

各题表现:
{chr(10).join([f'第{i+1}题: {a.get("question","")[:50]}... 评分: {a.get("score","?")}/10, 优点: {a.get("strengths",[])}' for i,a in enumerate(answers)])}

返回JSON:
{{
  "overall_score": {avg_score},
  "total_questions": {len(answers)},
  "dimension_averages": {{
    "professional": 7,
    "communication": 7,
    "logic": 7,
    "fit": 6
  }},
  "top_strengths": ["在整个面试中表现最好的能力1", "能力2"],
  "key_improvements": ["最需要提升的方向1", "方向2"],
  "action_plan": {{
    "immediate": "面试后可立即做的改进",
    "short_term": "1-2周内可准备的方向",
    "long_term": "长期职业发展规划建议"
  }},
  "overall_assessment": "对整个面试表现的总结评价（含行业针对性建议）",
  "etiquette_feedback": "面试过程中礼仪、表达、谈吐等方面的建议",
  "follow_up_advice": "面试结束后如何跟进、联系HR、写感谢信等建议"
}}
只返回JSON。不要用```json包裹，不要加说明文字。"""
    
    r = ark_call([{"role": "system", "content": summary_prompt},
                  {"role": "user", "content": "请生成面试总结报告"}], temp=0.3, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}



# 简单内存缓存
_prep_cache = {}
_prep_cache_key = ""

@app.post("/api/interview/preparation")
async def interview_preparation(data: dict):
    global _prep_cache, _prep_cache_key
    position = data.get("position", "")
    domain = data.get("domain", "")
    company = data.get("company", "")
    cache_key = f"{position}|{domain}|{company}"
    
    # 如果缓存命中且相同参数，直接返回
    if _prep_cache and _prep_cache_key == cache_key:
        return _prep_cache
    
    prep_prompt = f"""你是面试指导专家。为求职者提供面试全流程建议，返回JSON:

求职信息: 岗位={position}, 行业={domain or '不限'}, 公司={company or '不限'}

返回JSON:
{{
  "before_interview": {{
    "dress_code": "着装建议（基于行业和公司文化）",
    "preparation": "面试前应做的准备工作清单",
    "company_research": "如何研究目标公司",
    "common_questions": ["常见问题1及准备思路", "问题2"],
    "materials_to_bring": "需要携带的材料"
  }},
  "during_interview": {{
    "etiquette": "面试礼仪（进门/坐姿/眼神/语速等）",
    "self_introduction": "自我介绍的STAR框架建议",
    "answering_skills": "回答问题的技巧（表达/逻辑/时间控制）",
    "body_language": "肢体语言注意事项",
    "questions_to_ask": "可以反问面试官的问题"
  }},
  "after_interview": {{
    "follow_up": "面试结束后如何跟进（时间/方式/内容）",
    "thank_you_note": "感谢信模板和发送时机",
    "next_steps": "如果多轮面试的后续安排",
    "negotiation": "谈薪的基本技巧和注意事项",
    "if_rejected": "如果被拒如何正确应对"
  }},
  "common_mistakes": ["面试常见错误1", "错误2", "错误3"]
}}
只返回JSON。不要用```json包裹，不要加说明文字。"""
    
    r = ark_call([{"role": "system", "content": prep_prompt},
                  {"role": "user", "content": f"请为{position}岗位提供面试全流程建议"}], temp=0.3, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r["model_used"], "tokens": r["tokens"]}

app.include_router(resume_router)
app.include_router(auth_router)
# ============ HAIC Coach API ============
HAIC_PLAN_PROMPT = """你是HAIC(Human-AI Collaboration Index)人机协作指数教练。根据用户的5维评估结果生成个性化提升计划。返回JSON:
{
  "summary": "总体评价，基于得分和水平",
  "strengths": [{"name": "维度名", "score": 80, "analysis": "优势分析"}],
  "weaknesses": [{"name": "维度名", "score": 30, "priority": "high", "analysis": "为什么弱，影响什么"}],
  "improvement_plan": [
    {"dimension": "维度名", "actions": ["具体行动1", "行动2"], "resources": ["资源链接或书籍"], "expected_time": "预计提升时间"}
  ],
  "timeline": [{"phase": "阶段名", "duration": "时长", "focus": "重点内容", "hours_per_week": 5}],
  "career_impact": "HAIC水平对求职的具体影响"
}
只返回JSON，不要用```json包裹。"""

@app.post("/api/haic/generate-plan")
async def haic_generate_plan(data: dict):
    scores = data.get("scores", {})
    if not scores:
        return {"success": False, "error": "缺少评估分数"}
    
    dims_text = "\n".join([f"{k}: {v}分" for k, v in scores.items() if k != "total"])
    total = scores.get("total", 0)
    
    r = ark_call([
        {"role": "system", "content": HAIC_PLAN_PROMPT},
        {"role": "user", "content": f"HAIC评估结果:\n总分: {total}/100\n各维度:\n{dims_text}\n请生成个性化提升计划。"}
    ], temp=0.3, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r.get("model_used"), "tokens": r.get("tokens")}

@app.post("/api/haic/coach-chat")
async def haic_coach_chat(data: dict):
    message = data.get("message", "")
    context = data.get("context", {})
    
    if not message.strip():
        return {"success": False, "error": "消息为空"}
    
    system_prompt = """你是HAIC人机协作教练。你只用**提问**来引导，不给建议不说教。

🎯 GROW结构(每轮必用):
G: 帮用户明确具体目标
R: 1-10分量表帮用户自评现状
O: 用提问让用户自己想出3个方案
W: 以"接下来24小时你会做什么？"收尾

🧠 NLP层次(得分<40启用):
"你希望成为怎样的AI使用者？"(身份层)
"优秀AI协作者会怎么做？"(信念层)
"你过去成功学新技能用了什么方法？"(能力层)

💬 私董会追问:
"如果我是面试官，看到这个得分..."(角色切换)
"换个角度，这个弱点可能是什么优势？"(重构)

格式: [共情1句] → [GROW提问2-3个] → [行动承诺1句]
禁止: 直接给建议、长篇大论、说教
字数≤150字"""
    
    ctx_text = ""
    if context:
        ctx_text = f"\n\n用户评估结果: {json.dumps(context, ensure_ascii=False)}"
    
    r = ark_call([
        {"role": "system", "content": system_prompt + ctx_text},
        {"role": "user", "content": message}
    ], temp=0.6, max_tokens=1024)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    return {"success": True, "data": r["data"], "model_used": r.get("model_used"), "tokens": r.get("tokens")}

# ============ Career Navigator API ============
CAREER_NAV_PROMPT = """你是职业规划专家。根据用户当前技能和目标岗位，生成职业发展导航。返回JSON:
{
  "current_level": "当前水平描述",
  "target_level": "目标水平描述",
  "path_steps": [
    {"step": 1, "title": "步骤名称", "duration": "预计时间", "skills_to_acquire": ["技能1"], "milestones": ["里程碑1"], "resources": ["学习资源"]}
  ],
  "skill_gap_analysis": {"matched": ["匹配技能"], "missing": ["缺失技能"], "match_rate": 65},
  "salary_projection": {"current": "15-20K", "target": "25-35K", "growth": "60%"},
  "industry_insights": ["行业趋势1", "趋势2"],
  "alternative_paths": ["备选路径1", "路径2"]
}
只返回JSON，不要用```json包裹。"""

@app.post("/api/career/navigate")
async def career_navigate(data: dict):
    position = data.get("position", "")
    skills = data.get("skills", "")
    domain = data.get("domain", "")
    
    if not position:
        return {"success": False, "error": "缺少目标岗位"}
    
    r = ark_call([
        {"role": "system", "content": CAREER_NAV_PROMPT},
        {"role": "user", "content": f"当前技能: {skills}\n目标岗位: {position}\n行业领域: {domain or '不限'}\n请生成职业发展导航。"}
    ], temp=0.3, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r.get("model_used"), "tokens": r.get("tokens")}

# ============ Learning Roadmap API ============
ROADMAP_PROMPT = """你是学习路径规划专家。根据用户目标岗位和当前技能，生成个性化学习路线。返回JSON:
{
  "position": "目标岗位",
  "overview": "学习概述",
  "phases": [
    {
      "phase": "阶段名称",
      "duration": "预计时间",
      "items": [
        {"name": "技能/知识", "type": "course/book/project", "priority": "high/medium/low", "description": "学习内容描述", "estimated_hours": 20, "resources": ["推荐资源"]}
      ]
    }
  ],
  "total_duration": "总时长预估",
  "certifications": ["推荐证书"],
  "practice_projects": ["实战项目1", "项目2"],
  "success_metrics": ["衡量标准"]
}
只返回JSON，不要用```json包裹。"""

@app.post("/api/career/roadmap")
async def career_roadmap(data: dict):
    position = data.get("position", "")
    skills = data.get("skills", "")
    
    if not position:
        return {"success": False, "error": "缺少目标岗位"}
    
    r = ark_call([
        {"role": "system", "content": ROADMAP_PROMPT},
        {"role": "user", "content": f"目标岗位: {position}\n当前技能: {skills or '基础水平'}\n请生成详细学习路线。"}
    ], temp=0.3, max_tokens=4096)
    
    if not r["success"]: return {"success": False, "error": r["error"]}
    parsed = extract_json(r["data"])
    return {"success": True, "data": parsed or r["data"], "model_used": r.get("model_used"), "tokens": r.get("tokens")}

# ============ Dashboard & Battle Report API ============
DASHBOARD_FILE = Path("dashboard_data.json")

def load_dashboard():
    if DASHBOARD_FILE.exists():
        try: return json.loads(DASHBOARD_FILE.read_text())
        except: pass
    return {"applications": [], "interviews": [], "offers": []}

def save_dashboard(data):
    DASHBOARD_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))

@app.get("/api/dashboard/stats")
async def dashboard_stats():
    d = load_dashboard()
    apps = d.get("applications", [])
    interviews = d.get("interviews", [])
    offers = d.get("offers", [])
    
    return {
        "success": True,
        "data": {
            "applications": len(apps),
            "interviews": len(interviews),
            "offers": len(offers),
            "rejection_rate": round((len(apps) - len(interviews)) / max(len(apps), 1) * 100, 1),
            "interview_rate": round(len(interviews) / max(len(apps), 1) * 100, 1),
            "offer_rate": round(len(offers) / max(len(interviews), 1) * 100, 1),
            "recent_apps": apps[-5:][::-1],
            "active_interviews": [
                {"company": i.get("company"), "stage": i.get("stage"), "date": i.get("date")}
                for i in interviews if i.get("stage") not in ("offer", "rejected")
            ]
        }
    }

@app.post("/api/dashboard/update")
async def dashboard_update(data: dict):
    action = data.get("action")
    record = data.get("record", {})
    
    d = load_dashboard()
    
    if action == "add_application":
        d.setdefault("applications", []).append({
            "company": record.get("company", "未知"),
            "position": record.get("position", ""),
            "date": record.get("date", ""),
            "source": record.get("source", ""),
            "status": "applied"
        })
    elif action == "add_interview":
        d.setdefault("interviews", []).append({
            "company": record.get("company", "未知"),
            "stage": record.get("stage", "初面"),
            "date": record.get("date", ""),
            "notes": record.get("notes", "")
        })
    elif action == "add_offer":
        d.setdefault("offers", []).append({
            "company": record.get("company", "未知"),
            "position": record.get("position", ""),
            "salary": record.get("salary", ""),
            "date": record.get("date", ""),
            "accepted": False
        })
    
    save_dashboard(d)
    
    # Generate AI insight
    apps = d.get("applications", [])
    interviews = d.get("interviews", [])
    insight_prompt = f"""用户在求职中: 投递{len(apps)}次，面试{len(interviews)}次。作为求职导师，给一条鼓励性但实用的建议，20字以内。"""
    
    r = ark_call([
        {"role": "system", "content": "你是求职导师，回复简洁（20字内）、鼓舞、有实用性。"},
        {"role": "user", "content": insight_prompt}
    ], temp=0.6, max_tokens=200)
    
    insight = r.get("data", "坚持就是胜利，优化简历提升转化率！") if r["success"] else "持续努力，好机会在路上！"
    
    return {"success": True, "data": {"message": "更新成功", "insight": insight}}


@app.get("/api/salary/map")
async def salary_map():
    d = load_dashboard()
    apps = d.get("applications", [])
    offers = d.get("offers", [])
    
    # Aggregate salary data from applications with salary info
    salary_data = []
    for a in apps:
        if a.get("salary"):
            salary_data.append({"company": a["company"], "position": a.get("position", ""), "salary": a["salary"]})
    
    # Add offer salary data
    for o in offers:
        if o.get("salary"):
            salary_data.append({"company": o["company"], "position": o.get("position", ""), "salary": o["salary"], "type": "offer"})
    
    # Generate AI-powered salary insight if we have data
    insight = ""
    if len(salary_data) > 0:
        prompt = f"基于以下求职薪资数据，用一句话(30字内)简洁分析薪资趋势：{json.dumps([s['salary'] for s in salary_data])}"
        r = ark_call([
            {"role": "system", "content": "你是薪资分析师，回复极度简洁，30字以内"},
            {"role": "user", "content": prompt}
        ], temp=0.6, max_tokens=200)
        insight = r.get("data", "") if r["success"] else ""
    
    # Position-based salary ranges (from stored data + general market)
    position_salaries = {}
    for s in salary_data:
        pos = s.get("position", "其他")
        if pos not in position_salaries:
            position_salaries[pos] = []
        position_salaries[pos].append(s["salary"])
    
    position_stats = []
    for pos, sals in position_salaries.items():
        try:
            nums = []
            for s in sals:
                # Extract number from salary string like "15-20K" or "20K"
                import re
                nums_raw = re.findall(r'\d+', str(s))
                if nums_raw:
                    nums.extend([float(n) for n in nums_raw])
            if nums:
                position_stats.append({
                    "position": pos,
                    "min": round(min(nums), 1),
                    "max": round(max(nums), 1),
                    "avg": round(sum(nums)/len(nums), 1),
                    "count": len(sals)
                })
        except:
            pass
    
    return {
        "success": True,
        "data": {
            "salary_records": salary_data,
            "position_stats": position_stats,
            "insight": insight,
            "total_records": len(salary_data)
        }
    }

@app.get("/api/battlereport")
async def battlereport():
    d = load_dashboard()
    apps = d.get("applications", [])
    interviews = d.get("interviews", [])
    offers = d.get("offers", [])
    
    # Calculate weekly trends
    from collections import defaultdict
    from datetime import datetime, timedelta
    
    weekly = defaultdict(lambda: {"applications": 0, "interviews": 0})
    for a in apps:
        try: 
            dt = datetime.fromisoformat(a.get("date", ""))
            week_key = dt.strftime("%Y-W%W")
            weekly[week_key]["applications"] += 1
        except: pass
    for iv in interviews:
        try:
            dt = datetime.fromisoformat(iv.get("date", ""))
            week_key = dt.strftime("%Y-W%W")
            weekly[week_key]["interviews"] += 1
        except: pass
    
    weekly_sorted = sorted(weekly.items())[-4:]  # Last 4 weeks
    
    return {
        "success": True,
        "data": {
            "total_applications": len(apps),
            "total_interviews": len(interviews),
            "total_offers": len(offers),
            "pending": len(apps) - len(interviews) - len(offers),
            "weekly_trends": [
                {"week": w, "applications": d["applications"], "interviews": d["interviews"]}
                for w, d in weekly_sorted
            ],
            "active_interviews": [
                {"company": i.get("company"), "stage": i.get("stage"), "progress": 60 if i.get("stage") == "HR面" else 80 if "二面" in i.get("stage", "") else 20}
                for i in interviews if i.get("stage") not in ("offer", "rejected")
            ][-5:]
        }
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)




# ===== 竞品分析 API =====
@app.get("/api/competitive/analysis")
async def competitive_analysis():
    """
    竞品深度分析 - 基于 Gartner Magic Quadrant 方法论
    返回竞品对比数据和 CareerPath AI 定位分析
    """
    competitors = [
        {
            "id": "boss",
            "name": "BOSS直聘",
            "logo": "💼",
            "category": "招聘平台",
            "scores": {"matching": 90, "ai": 60, "interview": 40, "resume": 65, "career": 55, "haic": 0},
            "strengths": ["岗位数量最多", "直聊模式高效", "AI职位推荐"],
            "weaknesses": ["无面试训练", "无职业规划", "信息过载", "被动等待"],
            "desc": "国内最大招聘平台，核心价值在'连接'，但不帮助候选人'提升'。AI主要用于匹配推荐，缺少主动赋能。"
        },
        {
            "id": "nowcoder",
            "name": "牛客网",
            "logo": "🐮",
            "category": "技能练习",
            "scores": {"matching": 20, "ai": 40, "interview": 70, "resume": 30, "career": 20, "haic": 0},
            "strengths": ["笔试题库丰富", "面经社区活跃", "公司真题"],
            "weaknesses": ["模拟面试固定", "缺乏AI实时反馈", "无协作能力评估", "简历功能弱"],
            "desc": "以题库和面经为核心，适合笔试刷题。但模拟面试是静态题库，没有AI实时互动和反馈。"
        },
        {
            "id": "wondercv",
            "name": "超级简历",
            "logo": "📄",
            "category": "简历工具",
            "scores": {"matching": 30, "ai": 35, "interview": 0, "resume": 90, "career": 0, "haic": 0},
            "strengths": ["简历模板专业", "ATS友好格式", "智能排版"],
            "weaknesses": ["仅限简历优化", "无面试功能", "无职业导航", "单一维度"],
            "desc": "专注简历优化，模板和排版确实不错。但求职不只是简历——缺少面试、规划、追踪等完整链路。"
        },
        {
            "id": "chatgpt",
            "name": "ChatGPT",
            "logo": "🤖",
            "category": "通用AI",
            "scores": {"matching": 30, "ai": 95, "interview": 50, "resume": 70, "career": 60, "haic": 30},
            "strengths": ["通用能力最强", "知识面广", "灵活应变"],
            "weaknesses": ["无求职专项优化", "无评估体系", "数据不垂直", "需高质量提示词"],
            "desc": "最强大的通用AI，但求职是垂直场景。需要用户自己设计提示词、构建工作流，缺乏专业评估和结构化引导。"
        },
        {
            "id": "careerpath",
            "name": "CareerPath AI",
            "logo": "🚀",
            "category": "AI求职系统（本产品）",
            "scores": {"matching": 85, "ai": 90, "interview": 85, "resume": 85, "career": 90, "haic": 95},
            "strengths": ["HAIC评估体系·独家", "6框架AI面试", "端到端闭环", "GROW教练对话", "9模块全覆盖"],
            "weaknesses": ["用户规模尚小", "缺少企业侧数据", "移动端适配进行中"],
            "desc": "首创HAIC人机协作指数，填补AI时代求职能力评估空白。唯一覆盖'评估→训练→追踪'全链路的AI求职系统。",
            "highlight": True
        }
    ]
    
    dimensions = [
        {"key": "matching", "label": "岗位匹配", "icon": "🎯"},
        {"key": "ai", "label": "AI能力", "icon": "🧠"},
        {"key": "interview", "label": "面试训练", "icon": "🤖"},
        {"key": "resume", "label": "简历优化", "icon": "📄"},
        {"key": "career", "label": "职业规划", "icon": "🧭"},
        {"key": "haic", "label": "HAIC", "icon": "⭐", "exclusive": True}
    ]
    
    # 计算 CareerPath AI 的综合优势
    cp = next(c for c in competitors if c["id"] == "careerpath")
    avg_scores = {k["key"]: sum(c["scores"][k["key"]] for c in competitors if c["id"] != "careerpath") / 4 for k in dimensions if k["key"] != "haic"}
    
    advantages = []
    for dim in dimensions:
        if dim["key"] == "haic":
            advantages.append({
                "dimension": "HAIC",
                "careerpath_score": 95,
                "market_avg": 7.5,  # (0+0+0+30)/4
                "gap": 87.5,
                "significance": "独家首创，市场空白"
            })
        else:
            cp_score = cp["scores"][dim["key"]]
            avg = avg_scores[dim["key"]]
            gap = cp_score - avg
            if gap > 10:
                advantages.append({
                    "dimension": dim["label"],
                    "careerpath_score": cp_score,
                    "market_avg": round(avg, 1),
                    "gap": round(gap, 1),
                    "significance": "领先" if gap > 20 else "持平"
                })
    
    return {
        "success": True,
        "data": {
            "competitors": competitors,
            "dimensions": dimensions,
            "advantages": advantages,
            "market_position": {
                "quadrant": "挑战者→领导者",
                "x_axis": "AI能力",
                "y_axis": "求职完成度",
                "careerpath": {"x": 90, "y": 88},
                "insight": "CareerPath AI在AI能力和求职完成度双维度领先，HAIC为独家差异化"
            },
            "generated_at": datetime.now().isoformat()
        }
    }


# ===== HAIC AI教练对话 API =====
@app.post("/api/haic/coach-chat")
async def haic_coach_chat(body: dict):
    """
    HAIC AI教练对话 - 基于用户评估结果提供个性化指导
    """
    try:
        message = body.get("message", "")
        context = body.get("context", {})
        history = body.get("history", [])
        
        # 构建系统提示
        system_prompt = f"""你是CareerPath AI的HAIC教练，专门帮助用户提升人机协作能力。

用户的HAIC评估结果:
- 总分: {context.get('total', 0)}/100
- 等级: {context.get('level', {}).get('level', '未知')}

各维度得分:
"""
        
        for dim in context.get("dimensions", []):
            system_prompt += f"- {dim['name']}: {dim['score']}分\n"
        
        system_prompt += """
你的职责:
1. 根据用户的HAIC评估结果，提供针对性的建议
2. 回答关于AI协作、提示工程、工作流优化等问题
3. 鼓励用户，帮助他们建立信心
4. 推荐具体的学习资源和实践方法

回复要求:
- 简洁明了，不超过200字
- 使用中文
- 语气友好、专业
- 给出可执行的建议
"""
        
        # 构建对话历史
        messages = [{"role": "system", "content": system_prompt}]
        
        # 添加历史对话
        for msg in history[-5:]:  # 最近5条
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})
        
        # 添加当前消息
        messages.append({"role": "user", "content": message})
        
        # 调用ARK API
        from ark_client import client
        response = await client.chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return {
            "success": True,
            "data": {
                "response": response.get("content", "抱歉，我暂时无法回答。请稍后再试。"),
                "model": response.get("model", "unknown"),
                "tokens": response.get("tokens", {})
            }
        }
        
    except Exception as e:
        print(f"[HAIC Coach] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": {
                "response": "抱歉，AI教练暂时无法连接。请检查网络后重试，或使用页面上的学习资源。"
            }
        }
