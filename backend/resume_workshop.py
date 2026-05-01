"""
简历工坊模块 — ASC层核心功能
支持: 简历上传解析、AI诊断、AI优化、简历评分
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import json

from resume_parser import extract_text_from_docx, extract_resume_info
from ark_client import client

router = APIRouter(prefix="/api/resume", tags=["简历工坊"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ========== 数据模型 ==========

class ResumeDiagnosisRequest(BaseModel):
    resume_text: str
    target_job: Optional[str] = None

class ResumeDiagnosisResult(BaseModel):
    overall_score: int  # 0-100
    issues: List[dict]  # 问题列表
    strengths: List[str]  # 优势
    suggestions: List[str]  # 改进建议
    keywords_match: dict  # 关键词匹配度

class ResumeOptimizeRequest(BaseModel):
    resume_text: str
    target_job: str
    focus: Optional[str] = "general"  # general, keywords, format, content

class ResumeOptimizeResult(BaseModel):
    optimized_text: str
    changes: List[dict]  # 改动说明
    before_after: dict  # 前后对比

class ResumeScoreRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None

class ResumeScoreResult(BaseModel):
    ats_score: int  # AI筛选系统分数
    hr_score: int  # HR人工评分
    match_score: int  # 岗位匹配度
    details: dict  # 详细评分维度

# ========== 提示词模板 ==========

DIAGNOSIS_PROMPT = """你是一位资深HR和AI招聘系统专家。请对以下简历进行深度诊断。

简历内容:
{resume_text}

目标岗位: {target_job}

请按以下JSON格式输出诊断结果:
{{
    "overall_score": 0-100的整数,
    "issues": [
        {{"category": "格式|内容|关键词|表达", "severity": "高|中|低", "description": "具体问题", "suggestion": "改进建议"}}
    ],
    "strengths": ["优势1", "优势2"],
    "suggestions": ["建议1", "建议2"],
    "keywords_match": {{
        "matched": ["已有关键词"],
        "missing": ["缺失关键词"],
        "match_rate": "百分比"
    }}
}}

注意:
1. overall_score要客观，不要给虚高分
2. issues至少找出3-5个真实问题
3. 如果目标岗位明确，重点分析与岗位的匹配度
4. 所有输出用中文"""

OPTIMIZE_PROMPT = """你是一位专业简历优化师。请优化以下简历，使其更适合目标岗位。

原始简历:
{resume_text}

目标岗位: {target_job}

优化重点: {focus}

请输出优化后的完整简历文本，并在末尾附上改动说明:

[优化后简历]
...

[改动说明]
1. ...
2. ...

要求:
1. 保持简历真实性，不虚构经历
2. 突出与目标岗位相关的技能和经验
3. 使用STAR法则描述项目经历
4. 增加量化数据（数字、百分比）
5. 优化关键词匹配度
6. 控制在一页A4纸以内"""

SCORE_PROMPT = """你是一位AI简历筛选系统和资深HR。请对以下简历进行双重评分。

简历内容:
{resume_text}

岗位描述:
{job_description}

请按以下JSON格式输出:
{{
    "ats_score": 0-100,
    "hr_score": 0-100,
    "match_score": 0-100,
    "details": {{
        "format": {{"score": 0-100, "comment": "格式评价"}},
        "content": {{"score": 0-100, "comment": "内容评价"}},
        "keywords": {{"score": 0-100, "comment": "关键词匹配"}},
        "experience": {{"score": 0-100, "comment": "经历描述"}},
        "potential": {{"score": 0-100, "comment": "发展潜力"}}
    }},
    "screening_result": "通过|待定|淘汰",
    "hr_feedback": "HR会给的反馈"
}}

评分标准:
- ATS分数: AI系统能否正确解析和匹配
- HR分数: 人类HR的主观评价
- Match分数: 与岗位的匹配程度
- 80分以上为优秀，60-80为合格，60以下为需改进"""

# ========== API端点 ==========

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """上传并解析简历"""
    if not file.filename.endswith('.docx'):
        raise HTTPException(400, "仅支持 .docx 格式")
    
    # 保存文件
    file_path = UPLOAD_DIR / file.filename
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # 解析
    text = extract_text_from_docx(str(file_path))
    info = extract_resume_info(text)
    
    return {
        "filename": file.filename,
        "text": text,
        "parsed": info,
        "word_count": len(text),
        "status": "success"
    }

@router.post("/diagnose", response_model=ResumeDiagnosisResult)
async def diagnose_resume(request: ResumeDiagnosisRequest):
    """AI诊断简历问题"""
    prompt = DIAGNOSIS_PROMPT.format(
        resume_text=request.resume_text[:3000],
        target_job=request.target_job or "未指定"
    )
    
    try:
        response = client.chat.completions.create(
            model="doubao-1.5-pro-32k-250115",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=4000
        )
        
        content = response.choices[0].message.content
        # 提取JSON
        json_str = content[content.find('{'):content.rfind('}')+1]
        result = json.loads(json_str)
        
        return ResumeDiagnosisResult(**result)
    except Exception as e:
        # 降级: 返回结构化分析
        return ResumeDiagnosisResult(
            overall_score=65,
            issues=[{"category": "系统", "severity": "中", "description": f"AI诊断暂时不可用: {str(e)}", "suggestion": "请稍后重试"}],
            strengths=["简历已上传成功"],
            suggestions=["尝试手动检查格式和内容"],
            keywords_match={"matched": [], "missing": [], "match_rate": "未知"}
        )

@router.post("/optimize", response_model=ResumeOptimizeResult)
async def optimize_resume(request: ResumeOptimizeRequest):
    """AI优化简历"""
    prompt = OPTIMIZE_PROMPT.format(
        resume_text=request.resume_text[:3000],
        target_job=request.target_job,
        focus=request.focus
    )
    
    try:
        response = client.chat.completions.create(
            model="doubao-1.5-pro-32k-250115",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=6000
        )
        
        content = response.choices[0].message.content
        
        # 分离优化后文本和改动说明
        if "[改动说明]" in content:
            parts = content.split("[改动说明]")
            optimized = parts[0].replace("[优化后简历]", "").strip()
            changes_text = parts[1].strip()
        else:
            optimized = content
            changes_text = ""
        
        # 解析改动说明
        changes = []
        for line in changes_text.split('\n'):
            if line.strip() and any(c.isdigit() for c in line[:3]):
                changes.append({"type": "优化", "description": line.strip()})
        
        return ResumeOptimizeResult(
            optimized_text=optimized,
            changes=changes or [{"type": "整体", "description": "AI全面优化简历"}],
            before_after={
                "before": request.resume_text[:500] + "...",
                "after": optimized[:500] + "..."
            }
        )
    except Exception as e:
        return ResumeOptimizeResult(
            optimized_text=request.resume_text,
            changes=[{"type": "错误", "description": f"优化失败: {str(e)}"}],
            before_after={"before": "原始", "after": "未变更"}
        )

@router.post("/score", response_model=ResumeScoreResult)
async def score_resume(request: ResumeScoreRequest):
    """简历评分(ATS+HR双重评分)"""
    prompt = SCORE_PROMPT.format(
        resume_text=request.resume_text[:3000],
        job_description=request.job_description or "未提供岗位描述"
    )
    
    try:
        response = client.chat.completions.create(
            model="doubao-1.5-pro-32k-250115",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=4000
        )
        
        content = response.choices[0].message.content
        json_str = content[content.find('{'):content.rfind('}')+1]
        result = json.loads(json_str)
        
        return ResumeScoreResult(**result)
    except Exception as e:
        return ResumeScoreResult(
            ats_score=60,
            hr_score=60,
            match_score=60,
            details={
                "format": {"score": 60, "comment": f"评分系统暂时不可用: {str(e)}"},
                "content": {"score": 60, "comment": "请稍后重试"},
                "keywords": {"score": 60, "comment": "-"},
                "experience": {"score": 60, "comment": "-"},
                "potential": {"score": 60, "comment": "-"}
            }
        )

