"""
CareerPath AI v3.0 - AI-Native 大学生求职导航系统
P1: JD翻译官 + 能力雷达 API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn, json

from ark_client import client

app = FastAPI(title="CareerPath AI API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== 数据模型 =====

class JDInput(BaseModel):
    jd_text: str
    
class SkillInput(BaseModel):
    skills: str
    target_job: str

# ===== API 端点 =====

@app.get("/")
async def root():
    return {"service": "CareerPath AI", "version": "3.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# ----- JD翻译官 -----

@app.post("/api/jd-translate")
async def jd_translate(data: JDInput):
    """
    JD翻译官: 翻译JD → 真实工作日常 + 能力要求 + 薪资拆解
    """
    result = client.translate_jd(data.jd_text)
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    return {
        "success": True,
        "data": result["data"],
        "model_used": result["model_used"],
        "tokens": result["tokens"]
    }

@app.post("/api/jd-translate-structured")
async def jd_translate_structured(data: JDInput):
    """
    JD翻译官 (结构化): 返回JSON格式的结构化分析
    """
    result = client.chat([
        {"role": "system", "content": """你是一个JD分析专家。分析招聘JD，返回严格的JSON格式:
{
  "daily_work": ["工作内容1", "工作内容2", ...],
  "hard_skills": ["硬技能1", ...],
  "soft_skills": ["软技能1", ...],
  "hidden_requirements": ["隐藏要求1", ...],
  "salary_estimate": {"base": "范围", "year_end": "范围", "total": "范围"},
  "interview_focus": ["面试重点1", ...],
  "match_advice": "匹配建议"
}
只返回JSON，不要其他文字。"""},
        {"role": "user", "content": data.jd_text}
    ], temperature=0.2)
    
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    # 尝试解析JSON
    try:
        # 从回复中提取JSON部分
        content = result["data"].strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        parsed = json.loads(content)
        return {"success": True, "data": parsed, "model_used": result["model_used"], "tokens": result["tokens"]}
    except:
        return {"success": True, "data": result["data"], "model_used": result["model_used"], "tokens": result["tokens"]}


# ----- 能力雷达 -----

@app.post("/api/skill-radar")
async def skill_radar(data: SkillInput):
    """能力雷达: 技能评估 + 差距分析 + 可迁移能力发现"""
    result = client.analyze_skills(data.skills, data.target_job)
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    return {
        "success": True,
        "data": result["data"],
        "model_used": result["model_used"],
        "tokens": result["tokens"]
    }

@app.post("/api/skill-radar-structured")
async def skill_radar_structured(data: SkillInput):
    """能力雷达 (结构化JSON返回)"""
    result = client.chat([
        {"role": "system", "content": """你是一个职业能力分析专家。分析用户的技能与目标岗位的差距，返回严格JSON:
{
  "user_skills": [{"name": "技能名", "level": 1-10, "category": "技术/管理/软技能"}],
  "required_skills": [{"name": "技能名", "importance": 1-10, "category": "技术/管理/软技能"}],
  "gaps": [{"skill": "差距技能", "gap": 差距分数, "priority": "高/中/低"}],
  "transferable_skills": [{"skill": "可迁移技能", "from": "来源经历", "to": "可应用到"}],
  "match_score": 0-100,
  "recommendations": ["建议1", "建议2"],
  "roadmap_1m": ["第1月计划"],
  "roadmap_3m": ["第3月计划"],
  "roadmap_6m": ["第6月计划"]
}
只返回JSON。"""},
        {"role": "user", "content": f"我的技能: {data.skills}\n目标岗位: {data.target_job}"}
    ], temperature=0.3)
    
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    try:
        content = result["data"].strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        parsed = json.loads(content)
        return {"success": True, "data": parsed, "model_used": result["model_used"], "tokens": result["tokens"]}
    except:
        return {"success": True, "data": result["data"], "model_used": result["model_used"], "tokens": result["tokens"]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
