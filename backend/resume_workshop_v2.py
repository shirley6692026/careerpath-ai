"""
简历工坊 v2 — ASC层核心功能 (升级版)
基于AI+HR研究成果的知识驱动简历优化系统

v2 升级内容:
1. 知识库驱动的评分体系 (6维度)
2. 专业AI诊断 (6大诊断项)
3. 优化前后对比评分
4. PDF生成和下载
5. 动态适配目标岗位
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Response
from pydantic import BaseModel
from typing import List, Optional, Dict
from pathlib import Path
import json
import re
from datetime import datetime

from resume_parser import extract_text_from_docx, extract_resume_info
from ark_client import client

router = APIRouter(prefix="/api/resume", tags=["简历工坊v2"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ========== 数据模型 ==========

class ResumeUploadResponse(BaseModel):
    filename: str
    text: str
    parsed: dict
    word_count: int
    initial_score: dict  # v2: 初评分数
    status: str

class ResumeDiagnosisRequest(BaseModel):
    resume_text: str
    target_job: Optional[str] = None
    initial_score: Optional[dict] = None  # v2: 带入初评结果

class ResumeDiagnosisResult(BaseModel):
    overall_score: int
    initial_score: Optional[dict]  # v2: 初评对比
    score_change: Optional[int]    # v2: 分数变化
    issues: List[dict]
    strengths: List[str]
    suggestions: List[str]
    keywords_match: dict
    optimization_plan: List[dict]  # v2: 优化方案
    haic_analysis: dict            # v2: HAIC分析

class ResumeOptimizeRequest(BaseModel):
    resume_text: str
    target_job: str
    diagnosis_result: Optional[dict] = None  # v2: 基于诊断结果优化
    focus: Optional[str] = "general"
    user_notes: Optional[str] = None  # v2: 用户额外想法

class ResumeOptimizeResult(BaseModel):
    optimized_text: str
    changes: List[dict]
    before_after: dict
    new_score: dict                # v2: 优化后评分
    score_improvement: dict        # v2: 分数提升
    pdf_url: Optional[str]         # v2: PDF下载链接

class ResumeScoreRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None
    target_job: Optional[str] = None

class ResumeScoreResult(BaseModel):
    ats_score: int
    hr_score: int
    match_score: int
    six_dimensions: dict           # v2: 6维度评分
    details: dict
    screening_result: str
    hr_feedback: str
    improvement_areas: List[str]   # v2: 优先改进项

# ========== 知识库驱动的提示词 ==========

INITIAL_SCORE_PROMPT = """你是一位顶级HR总监和AI招聘系统专家。请根据以下2025年最新HR研究标准，对简历进行专业初评。

【评分标准】基于 McKinsey/Deloitte/Gartner/WEF 2025研究:

1. 格式规范 (15%): 结构清晰、标准章节、ATS友好
2. 内容质量 (25%): 量化成果、STAR法则、关键词密度
3. 技能匹配 (20%): 技能标签化、熟练度标注、与岗位匹配
4. 经历描述 (20%): 成果导向、具体细节、影响力证明
5. 发展潜力 (10%): 学习轨迹、成长性、好奇心
6. AI素养 (10%): AI工具使用、人机协作证据、HAIC意识

简历内容:
{resume_text}

目标岗位: {target_job}

请按以下JSON格式输出初评结果:
{{
    "overall_score": 0-100,
    "six_dimensions": {{
        "format": {{"score": 0-100, "comment": "评价"}},
        "content": {{"score": 0-100, "comment": "评价"}},
        "skills": {{"score": 0-100, "comment": "评价"}},
        "experience": {{"score": 0-100, "comment": "评价"}},
        "potential": {{"score": 0-100, "comment": "评价"}},
        "ai_literacy": {{"score": 0-100, "comment": "评价"}}
    }},
    "ats_score": 0-100,
    "hr_score": 0-100,
    "match_score": 0-100,
    "screening_result": "通过|待定|淘汰",
    "hr_feedback": "HR会给的反馈",
    "improvement_areas": ["优先改进项1", "优先改进项2"]
}}

注意:
1. 评分要严格，不要给虚高分
2. 60分以下为不合格，60-80为合格，80以上为优秀
3. 所有输出用中文"""

DIAGNOSIS_V2_PROMPT = """你是一位资深HR总监和AI招聘系统架构师。请对以下简历进行深度专业诊断。

【诊断框架】基于2025年AI-Native招聘趋势:

诊断维度:
1. 关键词缺口分析: 对比目标岗位JD，找出缺失的核心关键词
2. 量化成果评估: 识别缺乏数字支撑的描述，建议量化方式
3. 冗余内容识别: 找出与目标岗位无关或低价值的经历
4. 逻辑连贯性: 检查经历间的逻辑断层和跳跃
5. 表达专业性: 指出不够专业、不够简洁的表达方式
6. AI友好度: 评估ATS系统解析友好度

简历内容:
{resume_text}

目标岗位: {target_job}

初评分数: {initial_score}

请按以下JSON格式输出诊断结果:
{{
    "overall_score": 0-100,
    "issues": [
        {{"category": "关键词|量化|冗余|逻辑|表达|AI友好度", "severity": "高|中|低", "description": "具体问题", "suggestion": "改进建议", "priority": 1-5}}
    ],
    "strengths": ["优势1", "优势2"],
    "optimization_plan": [
        {{"step": 1, "action": "具体优化动作", "expected_impact": "预期效果"}}
    ],
    "haic_analysis": {{
        "ai_cognition": {{"score": 0-100, "evidence": "证据", "suggestion": "建议"}},
        "prompt_engineering": {{"score": 0-100, "evidence": "证据", "suggestion": "建议"}},
        "workflow_reconstruction": {{"score": 0-100, "evidence": "证据", "suggestion": "建议"}},
        "quality_judgment": {{"score": 0-100, "evidence": "证据", "suggestion": "建议"}},
        "ethical_decision": {{"score": 0-100, "evidence": "证据", "suggestion": "建议"}}
    }},
    "keywords_match": {{
        "matched": ["已有关键词"],
        "missing": ["缺失关键词"],
        "match_rate": "百分比"
    }}
}}

注意:
1. 诊断要具体、可操作，不要泛泛而谈
2. 每个问题都要有明确的改进建议
3. HAIC分析要基于简历中实际体现的内容
4. 优化方案要按优先级排序"""

OPTIMIZE_V2_PROMPT = """你是一位顶级简历优化师和职业顾问。请基于以下诊断结果，对简历进行专业优化。

【优化原则】基于2025年AI-Native招聘标准:

1. 真实性: 不虚构经历，所有优化基于真实内容
2. 量化导向: 用数字、百分比、规模说话
3. 关键词植入: 自然融入目标岗位关键词
4. STAR法则: 情境→任务→行动→结果
5. AI素养展示: 突出人机协作能力和AI工具使用
6. 一页原则: 控制在一页A4纸以内

原始简历:
{resume_text}

目标岗位: {target_job}

诊断结果:
{diagnosis_result}

用户额外要求:
{user_notes}

请输出:
1. 优化后的完整简历 (可直接使用)
2. 改动说明 (具体改了什么，为什么)
3. 优化亮点 (3-5个核心改进点)

格式:
[优化后简历]
...

[改动说明]
1. ...
2. ...

[优化亮点]
1. ...
2. ..."""

NEW_SCORE_PROMPT = """请对优化后的简历进行重新评分，并与原简历对比。

原简历评分:
{old_score}

优化后简历:
{optimized_text}

目标岗位: {target_job}

请按以下JSON格式输出:
{{
    "new_overall_score": 0-100,
    "score_change": +N,
    "six_dimensions": {{
        "format": {{"old": 0-100, "new": 0-100, "change": +/-N}},
        "content": {{"old": 0-100, "new": 0-100, "change": +/-N}},
        "skills": {{"old": 0-100, "new": 0-100, "change": +/-N}},
        "experience": {{"old": 0-100, "new": 0-100, "change": +/-N}},
        "potential": {{"old": 0-100, "new": 0-100, "change": +/-N}},
        "ai_literacy": {{"old": 0-100, "new": 0-100, "change": +/-N}}
    }},
    "improvement_summary": "总体改进总结"
}}

注意: 评分要严格客观，体现真实改进"""

# ========== 工具函数 ==========

def ark_call(messages, temp=0.3, max_tokens=4096, retries=2):
    """调用ARK大模型的统一封装"""
    for _ in range(retries):
        try:
            r = client.chat(messages, temperature=temp, max_tokens=max_tokens)
            if r.get('success'):
                return r
        except Exception as e:
            print(f'ARK call error: {e}')
    return {'success': False, 'error': 'All retries failed'}

def extract_json_from_text(text: str) -> dict:
    """从文本中提取JSON"""
    try:
        # 尝试直接解析
        return json.loads(text)
    except:
        # 尝试从文本中提取JSON块
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end+1])
            except:
                pass
    return {}

def generate_pdf_html(resume_text: str, title: str = "优化简历") -> str:
    """生成PDF用的HTML模板"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{title}</title>
        <style>
            @page {{ size: A4; margin: 2cm; }}
            body {{
                font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
                font-size: 11pt;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }}
            h1 {{
                font-size: 18pt;
                color: #1a365d;
                border-bottom: 2px solid #3182ce;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }}
            h2 {{
                font-size: 14pt;
                color: #2c5282;
                margin-top: 20px;
                margin-bottom: 10px;
            }}
            .section {{
                margin-bottom: 15px;
            }}
            .skill-tag {{
                display: inline-block;
                background: #ebf8ff;
                color: #2b6cb0;
                padding: 2px 8px;
                border-radius: 4px;
                margin: 2px;
                font-size: 10pt;
            }}
            .highlight {{
                background: #fffaf0;
                padding: 2px 4px;
                border-radius: 3px;
            }}
            .metric {{
                font-weight: bold;
                color: #38a169;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .contact {{
                color: #666;
                font-size: 10pt;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{title}</h1>
            <p class="contact">由 CareerPath AI 简历工坊生成 | {datetime.now().strftime('%Y-%m-%d')}</p>
        </div>
        <div class="content">
            {resume_text.replace(chr(10), '<br>')}
        </div>
    </body>
    </html>
    """
    return html

# ========== API端点 ==========

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """上传并解析简历 + v2初评"""
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
    
    # v2: 初评
    initial_score = None
    try:
        prompt = INITIAL_SCORE_PROMPT.format(
            resume_text=text[:3000],
            target_job="未指定"
        )
        r = ark_call([{"role": "user", "content": prompt}], temp=0.3, max_tokens=4000)
        if r.get('success'):
            initial_score = extract_json_from_text(r['data'])
    except Exception as e:
        print(f"Initial score error: {e}")
    
    return ResumeUploadResponse(
        filename=file.filename,
        text=text,
        parsed=info,
        word_count=len(text),
        initial_score=initial_score or {},
        status="success"
    )

@router.post("/diagnose", response_model=ResumeDiagnosisResult)
async def diagnose_resume(request: ResumeDiagnosisRequest):
    """v2 AI诊断: 基于初评的深度专业诊断"""
    prompt = DIAGNOSIS_V2_PROMPT.format(
        resume_text=request.resume_text[:3000],
        target_job=request.target_job or "未指定",
        initial_score=json.dumps(request.initial_score or {}, ensure_ascii=False)
    )
    
    try:
        r = ark_call([{"role": "user", "content": prompt}], temp=0.3, max_tokens=5000)
        if not r.get('success'):
            raise Exception(r.get('error', 'ARK call failed'))
        
        content = r['data']
        result = extract_json_from_text(content)
        
        # 计算分数变化
        initial_overall = request.initial_score.get('overall_score', 0) if request.initial_score else 0
        new_overall = result.get('overall_score', 0)
        score_change = new_overall - initial_overall
        
        return ResumeDiagnosisResult(
            overall_score=new_overall,
            initial_score=request.initial_score,
            score_change=score_change,
            issues=result.get('issues', []),
            strengths=result.get('strengths', []),
            suggestions=result.get('suggestions', []),
            keywords_match=result.get('keywords_match', {}),
            optimization_plan=result.get('optimization_plan', []),
            haic_analysis=result.get('haic_analysis', {})
        )
    except Exception as e:
        return ResumeDiagnosisResult(
            overall_score=65,
            initial_score=request.initial_score,
            score_change=0,
            issues=[{"category": "系统", "severity": "中", "description": f"AI诊断暂时不可用: {str(e)}", "suggestion": "请稍后重试", "priority": 1}],
            strengths=["简历已上传成功"],
            suggestions=["尝试手动检查格式和内容"],
            keywords_match={"matched": [], "missing": [], "match_rate": "未知"},
            optimization_plan=[],
            haic_analysis={}
        )

@router.post("/optimize", response_model=ResumeOptimizeResult)
async def optimize_resume(request: ResumeOptimizeRequest):
    """v2 AI优化: 基于诊断结果的专业优化 + 新评分"""
    prompt = OPTIMIZE_V2_PROMPT.format(
        resume_text=request.resume_text[:3000],
        target_job=request.target_job,
        diagnosis_result=json.dumps(request.diagnosis_result or {}, ensure_ascii=False),
        user_notes=request.user_notes or "无额外要求"
    )
    
    try:
        r = ark_call([{"role": "user", "content": prompt}], temp=0.5, max_tokens=6000)
        if not r.get('success'):
            raise Exception(r.get('error', 'ARK call failed'))
        
        content = r['data']
        
        # 分离优化后文本和改动说明
        optimized = content
        changes = []
        highlights = []
        
        if "[优化后简历]" in content:
            parts = content.split("[优化后简历]")
            if len(parts) > 1:
                rest = parts[1]
                if "[改动说明]" in rest:
                    opt_parts = rest.split("[改动说明]")
                    optimized = opt_parts[0].strip()
                    changes_text = opt_parts[1] if len(opt_parts) > 1 else ""
                    
                    # 解析改动说明
                    for line in changes_text.split('\n'):
                        if line.strip() and any(c.isdigit() for c in line[:3]):
                            changes.append({"type": "优化", "description": line.strip()})
                else:
                    optimized = rest.strip()
        
        # 解析优化亮点
        if "[优化亮点]" in content:
            highlights_text = content.split("[优化亮点]")[1] if len(content.split("[优化亮点]")) > 1 else ""
            for line in highlights_text.split('\n'):
                if line.strip() and any(c.isdigit() for c in line[:3]):
                    highlights.append(line.strip())
        
        # v2: 新评分
        new_score = None
        score_improvement = None
        try:
            old_score = request.diagnosis_result.get('initial_score', {}) if request.diagnosis_result else {}
            score_prompt = NEW_SCORE_PROMPT.format(
                old_score=json.dumps(old_score, ensure_ascii=False),
                optimized_text=optimized[:2000],
                target_job=request.target_job
            )
            r2 = ark_call([{"role": "user", "content": score_prompt}], temp=0.3, max_tokens=3000)
            if r2.get('success'):
                score_result = extract_json_from_text(r2['data'])
                new_score = score_result
                score_improvement = {
                    "overall_change": score_result.get('score_change', 0),
                    "dimension_changes": score_result.get('six_dimensions', {})
                }
        except Exception as e:
            print(f"New score error: {e}")
        
        return ResumeOptimizeResult(
            optimized_text=optimized,
            changes=changes or [{"type": "整体", "description": "AI全面优化简历"}],
            before_after={
                "before": request.resume_text[:500] + "...",
                "after": optimized[:500] + "..."
            },
            new_score=new_score or {},
            score_improvement=score_improvement or {},
            pdf_url=None  # 前端生成PDF
        )
    except Exception as e:
        return ResumeOptimizeResult(
            optimized_text=request.resume_text,
            changes=[{"type": "错误", "description": f"优化失败: {str(e)}"}],
            before_after={"before": "原始", "after": "未变更"},
            new_score={},
            score_improvement={},
            pdf_url=None
        )

@router.post("/score", response_model=ResumeScoreResult)
async def score_resume(request: ResumeScoreRequest):
    """v2 简历评分: 6维度专业评分"""
    prompt = INITIAL_SCORE_PROMPT.format(
        resume_text=request.resume_text[:3000],
        target_job=request.target_job or request.job_description or "未指定"
    )
    
    try:
        r = ark_call([{"role": "user", "content": prompt}], temp=0.3, max_tokens=4000)
        if not r.get('success'):
            raise Exception(r.get('error', 'ARK call failed'))
        
        content = r['data']
        result = extract_json_from_text(content)
        
        return ResumeScoreResult(
            ats_score=result.get('ats_score', 60),
            hr_score=result.get('hr_score', 60),
            match_score=result.get('match_score', 60),
            six_dimensions=result.get('six_dimensions', {}),
            details=result.get('details', {}),
            screening_result=result.get('screening_result', '待定'),
            hr_feedback=result.get('hr_feedback', ''),
            improvement_areas=result.get('improvement_areas', [])
        )
    except Exception as e:
        return ResumeScoreResult(
            ats_score=60,
            hr_score=60,
            match_score=60,
            six_dimensions={},
            details={
                "format": {"score": 60, "comment": f"评分系统暂时不可用: {str(e)}"},
                "content": {"score": 60, "comment": "请稍后重试"},
                "skills": {"score": 60, "comment": "-"},
                "experience": {"score": 60, "comment": "-"},
                "potential": {"score": 60, "comment": "-"},
                "ai_literacy": {"score": 60, "comment": "-"}
            },
            screening_result="待定",
            hr_feedback="评分系统暂时不可用",
            improvement_areas=["请稍后重试"]
        )

@router.post("/generate-pdf")
async def generate_pdf(request: dict):
    """生成PDF格式的简历"""
    resume_text = request.get('resume_text', '')
    title = request.get('title', '优化简历')
    
    html = generate_pdf_html(resume_text, title)
    
    # 返回HTML，前端可用html2pdf或类似工具转换
    return {
        "html": html,
        "message": "请使用浏览器的'打印为PDF'功能，或复制HTML到在线PDF转换工具"
    }

