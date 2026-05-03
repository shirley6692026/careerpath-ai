"""
简历工坊 v3 — ASC层核心功能 (优化版)
基于用户反馈的深度优化

优化内容:
1. 支持目标岗位JD输入
2. 简历模块化解析展示
3. 10分制评分体系
4. 诊断不重复评分
5. 优化后10分制评分
6. 美化PDF模板
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from pathlib import Path
import json
import re
from datetime import datetime

from resume_parser import extract_text_from_docx, extract_text_from_pdf, extract_text_from_txt, extract_text_from_xlsx, extract_text_from_doc, extract_resume_info
from ark_client import client

router = APIRouter(prefix="/api/resume", tags=["简历工坊v3"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ========== 数据模型 ==========

class ResumeUploadResponse(BaseModel):
    filename: str
    text: str
    parsed: dict
    modules: dict  # v3: 模块化解析
    word_count: int
    status: str

class ResumeScoreRequest(BaseModel):
    resume_text: str
    target_job: Optional[str] = None
    job_jd: Optional[str] = None  # v3: 目标岗位JD

class ResumeScoreResult(BaseModel):
    overall_score: float  # v3: 10分制
    six_dimensions: dict   # v3: 10分制
    ats_score: float       # v3: 10分制
    hr_score: float        # v3: 10分制
    match_score: float     # v3: 10分制
    screening_result: str
    hr_feedback: str
    improvement_areas: List[str]

class ResumeDiagnosisRequest(BaseModel):
    resume_text: str
    target_job: Optional[str] = None
    job_jd: Optional[str] = None
    initial_score: Optional[dict] = None  # v3: 带入初评结果但不重新评分

class ResumeDiagnosisResult(BaseModel):
    issues: List[dict]
    strengths: List[str]
    haic_analysis: dict
    optimization_plan: List[dict]
    keywords_match: dict

class ResumeOptimizeRequest(BaseModel):
    resume_text: str
    target_job: str
    job_jd: Optional[str] = None
    diagnosis_result: Optional[dict] = None
    initial_score: Optional[dict] = None  # v3: 带入初评
    user_notes: Optional[str] = None

class ResumeOptimizeResult(BaseModel):
    optimized_text: str
    changes: List[dict]
    new_score: dict        # v3: 优化后10分制评分
    score_improvement: dict
    skill_scores: Optional[dict] = None  # v3.2: 每项技能熟练度评分

# ========== 提示词模板 ==========

INITIAL_SCORE_PROMPT = """你是一位顶级HR总监和AI招聘系统专家。请根据以下2025年最新HR研究标准，对简历进行专业初评。

【评分标准】基于 McKinsey/Deloitte/Gartner/WEF 2025研究 (10分制):

1. 格式规范: 结构清晰、标准章节、ATS友好
2. 内容质量: 量化成果、STAR法则、关键词密度
3. 技能匹配: 技能标签化、熟练度标注、与岗位匹配
4. 经历描述: 成果导向、具体细节、影响力证明
5. 发展潜力: 学习轨迹、成长性、好奇心
6. AI素养: AI工具使用、人机协作证据、HAIC意识

简历内容:
{resume_text}

目标岗位: {target_job}

岗位JD:
{job_jd}

请按以下JSON格式输出初评结果:
{{
    "overall_score": 0-10的一位小数,
    "six_dimensions": {{
        "format": {{"score": 0-10的一位小数, "comment": "评价"}},
        "content": {{"score": 0-10的一位小数, "comment": "评价"}},
        "skills": {{"score": 0-10的一位小数, "comment": "评价"}},
        "experience": {{"score": 0-10的一位小数, "comment": "评价"}},
        "potential": {{"score": 0-10的一位小数, "comment": "评价"}},
        "ai_literacy": {{"score": 0-10的一位小数, "comment": "评价"}}
    }},
    "ats_score": 0-10的一位小数,
    "hr_score": 0-10的一位小数,
    "match_score": 0-10的一位小数,
    "screening_result": "通过|待定|淘汰",
    "hr_feedback": "HR会给的反馈",
    "improvement_areas": ["优先改进项1", "优先改进项2"]
}}

注意:
1. 评分要严格客观，10分制
2. 8分以上为优秀，6-8分为合格，6分以下为需改进
3. 所有输出用中文"""

DIAGNOSIS_PROMPT = """你是一位资深HR总监和AI招聘系统架构师。请对以下简历进行深度专业诊断。

【注意】你不需要重新评分，初评分数已提供。你的任务是发现问题、分析HAIC能力、给出优化方案。

简历内容:
{resume_text}

目标岗位: {target_job}

岗位JD:
{job_jd}

初评分数 (10分制):
{initial_score}

请按以下JSON格式输出诊断结果:
{{
    "issues": [
        {{"category": "关键词|量化|冗余|逻辑|表达|AI友好度", "severity": "高|中|低", "description": "具体问题", "suggestion": "改进建议", "priority": 1-5}}
    ],
    "strengths": ["优势1", "优势2"],
    "haic_analysis": {{
        "ai_cognition": {{"score": 0-10的一位小数, "evidence": "证据", "suggestion": "建议"}},
        "prompt_engineering": {{"score": 0-10的一位小数, "evidence": "证据", "suggestion": "建议"}},
        "workflow_reconstruction": {{"score": 0-10的一位小数, "evidence": "证据", "suggestion": "建议"}},
        "quality_judgment": {{"score": 0-10的一位小数, "evidence": "证据", "suggestion": "建议"}},
        "ethical_decision": {{"score": 0-10的一位小数, "evidence": "证据", "suggestion": "建议"}}
    }},
    "optimization_plan": [
        {{"step": 1, "action": "具体优化动作", "expected_impact": "预期效果"}}
    ],
    "keywords_match": {{
        "matched": ["已有关键词"],
        "missing": ["缺失关键词"],
        "match_rate": "百分比"
    }}
}}

注意:
1. 诊断要具体、可操作
2. HAIC分析基于简历实际内容
3. 优化方案按优先级排序"""

OPTIMIZE_PROMPT = """你是一位顶级简历优化师。请基于初评和诊断结果，对简历进行精准专业优化。

【优化原则】
1. 真实性: 不虚构经历
2. 量化导向: 用数字说话
3. 关键词植入: 自然融入岗位JD关键词
4. 自然叙述: 用流畅的中文段落描述经历，不要机械拆分STAR
5. 一页原则: 控制在一页A4纸

【重要】经历描述要求:
- 用一整段优美的语言描述每个经历
- 自然融入情境、任务、行动、结果四个要素
- 不要显式标注"S（情境）：""T（任务）：""A（行动）：""R（结果）："
- 不要机械拆分，要流畅自然
- 示例："在XX公司实习期间，面对XX挑战，我负责XX工作，通过XX方法，最终实现了XX成果，提升了XX%效率。"

原始简历:
{resume_text}

目标岗位: {target_job}

岗位JD:
{job_jd}

初评结果:
{initial_score}

诊断结果:
{diagnosis_result}

用户额外要求:
{user_notes}

请输出优化后的完整简历，【严格要求】:
1. 【重要】必须完整保留个人信息部分（姓名、电话、邮箱、年龄/出生年月、籍贯、政治面貌等）不变
2. 开头必须有完整的个人信息区域，包括姓名、求职意向、联系方式
3. 逻辑清晰、专业精准、语言流畅
4. 无重复啰嗦内容
5. 【关键】禁止使用任何markdown语法！包括：不加**加粗**、不加*斜体*、不加`代码`、不加>引用、不加```代码块、不画表格|、不画框线┌─┐、不加---分割线、不加#标题标记
6. 使用纯文本格式，经历描述用自然段落，不要机械STAR
7. 在文末附上3-5条核心改动说明

格式:
[优化后简历]
...

[核心改动说明]
1. ...
2. ..."""

NEW_SCORE_PROMPT = """请对优化后的简历进行10分制评分，同时分析简历中各技能的熟练度（0-10分）。

原简历评分:
{old_score}

优化后简历:
{optimized_text}

目标岗位: {target_job}

岗位JD:
{job_jd}

请按以下JSON格式输出:
{{
    "new_overall_score": 0-10的一位小数,
    "score_change": +/-X.X,
    "six_dimensions": {{
        "format": {{"old": 0-10的一位小数, "new": 0-10的一位小数, "change": +/-X.X}},
        "content": {{"old": 0-10的一位小数, "new": 0-10的一位小数, "change": +/-X.X}},
        "skills": {{"old": 0-10的一位小数, "new": 0-10的一位小数, "change": +/-X.X}},
        "experience": {{"old": 0-10的一位小数, "new": 0-10的一位小数, "change": +/-X.X}},
        "potential": {{"old": 0-10的一位小数, "new": 0-10的一位小数, "change": +/-X.X}},
        "ai_literacy": {{"old": 0-10的一位小数, "new": 0-10的一位小数, "change": +/-X.X}}
    }},
    "skill_scores": {{
        "Python": 8.5,
        "JavaScript": 7.0,
        "React": 6.5,
        "Docker": 5.0
    }},
    "improvement_summary": "总体改进总结"
}}

注意:
1. 评分严格客观，体现真实改进
2. skill_scores中提取简历中出现的每个核心技能，根据简历描述评估熟练度
3. 示例格式仅供参考，请填入真实技能名和分数"""

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
        return json.loads(text)
    except:
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end+1])
            except:
                pass
    return {}

def parse_resume_modules(text: str) -> dict:
    """v3: 将简历文本拆分为模块化结构"""
    result = {}  # renamed from 'modules' to avoid potential shadowing
    lines = text.split('\n')
    cur_sec = None
    cur_content = []
    import re
    
    section_keywords = {
        'personal': ['个人信息', '基本资料', '个人简介', '求职意向', '求职目标', '职业定位', '资源网络'],
        'education': ['教育背景', '教育经历', '教育培训'],
        'honors': ['所获荣誉', '荣誉奖项', '获得荣誉', '荣誉证书', '获奖情况', '专业认证', '证书'],
        'skills': ['专业技能', '技能特长', '职业技能', '核心技能', '技术栈', 'IT技能', '核心能力', '核心优势'],
        'work': ['工作经历', '工作履历', '实习经历', '工作背景', '主要经历', '工作业绩', '实战经验', '战绩数据'],
        'projects': ['项目经验', '项目经历', '项目成果', '项目背景', '项目案例', '实战项目'],
        'evaluation': ['自我评价', '个人评价', '个人总结', '自我总结', '个人优势', '综合描述', '个人特点']
    }
    excl_pre = ['最近', '最高', '目前', '目前年']
    
    # 密集格式PDF回退：全文搜索所有节关键词
    all_kws = []
    for sec, kws in section_keywords.items():
        for kw in kws:
            all_kws.append((sec, kw))
    kw_pos = []
    for sec, kw in all_kws:
        idx = text.find(kw)
        if idx >= 0:
            kw_pos.append((idx, sec, kw))
    kw_pos.sort()
    if kw_pos:
        # 去重：相同section类型50字内只保留第一个
        deduped = []
        seen = {}
        for pos, sec, kw in kw_pos:
            if sec in seen and abs(pos - seen[sec]) < 50:
                continue
            seen[sec] = pos
            deduped.append((pos, sec, kw))
        # 过滤：节标题特征 → 前有换行/空格/标点 且 前5字内汉字不超过2个
        filtered = []
        for pos, sec, kw in deduped:
            pre = text[max(0,pos-5):pos]
            chinese_count = len(re.findall(r'[\u4e00-\u9fff]', pre))
            at_start = pos == 0 or (pos > 0 and text[pos-1] in '\n ')
            is_title = at_start or chinese_count <= 2
            if is_title:
                filtered.append((pos, sec, kw))
        if len(filtered) >= 3:
            for i, (pos, sec, kw) in enumerate(filtered):
                start = pos
                end = filtered[i+1][0] if i+1 < len(filtered) else len(text)
                sec_text = text[start:end].strip()
                # 跳过内容太短的节（仅标题无正文，可能是假匹配）
                content_after_kw = sec_text[len(kw):].strip()
                if len(content_after_kw) < 5:
                    continue
                if sec_text:
                    if sec in result:
                        result[sec] += '\n\n' + sec_text
                    else:
                        result[sec] = sec_text
            if result:
                return result

    for line in lines:
        s = line.strip()
        if not s:
            continue
        clean = re.sub(r'^[^\w\u4e00-\u9fff]+\s*', '', s)
        
        found = None
        for sec, kws in section_keywords.items():
            if any(clean.startswith(p) for p in excl_pre):
                break
            if len(clean) >= 80:
                segs = [x.strip() for x in re.split(r'[。；;]', clean) if x.strip()]
                for seg in segs:
                    if any(seg.startswith(kw) for kw in kws):
                        found = sec
                        break
                if found:
                    break
            if any(clean.startswith(kw) for kw in kws) and len(s) < 80:
                found = sec
                break
        
        if found:
            if cur_sec and cur_content:
                txt = '\n'.join(cur_content)
                if cur_sec in result:
                    result[cur_sec] += '\n\n' + txt
                else:
                    result[cur_sec] = txt
            cur_sec = found
            cur_content = [s]
        elif cur_sec:
            cur_content.append(s)
    
    if cur_sec and cur_content:
        txt = '\n'.join(cur_content)
        if cur_sec in result:
            result[cur_sec] += '\n\n' + txt
        else:
            result[cur_sec] = txt
    
    if not result:
        result['raw'] = text
    
    return result
def generate_pdf_html(resume_text: str, title: str = "优化简历") -> str:
    """v3: 美化PDF用的HTML模板"""
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
                font-size: 10.5pt;
                line-height: 1.6;
                color: #2d3748;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #fff;
            }}
            .header {{
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 2px solid #3182ce;
            }}
            .header h1 {{
                font-size: 20pt;
                color: #1a365d;
                margin: 0;
                font-weight: 700;
            }}
            .header .subtitle {{
                font-size: 9pt;
                color: #718096;
                margin-top: 5px;
            }}
            .section {{
                margin-bottom: 18px;
            }}
            .section-title {{
                font-size: 12pt;
                font-weight: 700;
                color: #2c5282;
                border-left: 3px solid #3182ce;
                padding-left: 10px;
                margin-bottom: 8px;
            }}
            .content {{
                padding-left: 13px;
            }}
            .skill-tag {{
                display: inline-block;
                background: #ebf8ff;
                color: #2b6cb0;
                padding: 2px 8px;
                border-radius: 4px;
                margin: 2px;
                font-size: 9.5pt;
            }}
            .metric {{
                font-weight: bold;
                color: #38a169;
            }}
            .highlight {{
                background: #fffaf0;
                padding: 1px 3px;
                border-radius: 2px;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                font-size: 8pt;
                color: #a0aec0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{title}</h1>
            <div class="subtitle">由 CareerPath AI 简历工坊生成 | {datetime.now().strftime('%Y-%m-%d')}</div>
        </div>
        <div class="content">
            {resume_text.replace(chr(10), '<br>')}
        </div>
        <div class="footer">
            本简历由 CareerPath AI 智能优化生成 | 基于 McKinsey/Deloitte/Gartner/WEF 2025 研究标准
        </div>
    </body>
    </html>
    """
    return html

# ========== API端点 ==========

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """上传并解析简历 + v3模块化解析 (支持 .docx/.pdf/.txt/.xlsx)"""
    name = file.filename.lower()
    ext = name.rsplit('.', 1)[-1] if '.' in name else ''
    
    if ext not in ('docx', 'pdf', 'txt', 'xlsx', 'doc'):
        raise HTTPException(400, "仅支持 .docx/.pdf/.txt/.xlsx/.doc 格式")
    
    file_path = UPLOAD_DIR / file.filename
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    if ext == 'docx':
        text = extract_text_from_docx(str(file_path))
    elif ext == 'pdf':
        text = extract_text_from_pdf(str(file_path))
    elif ext == 'txt':
        text = extract_text_from_txt(str(file_path))
    elif ext == 'xlsx':
        text = extract_text_from_xlsx(str(file_path))
    elif ext == 'doc':
        text = extract_text_from_doc(str(file_path))
    else:
        text = ""
    info = extract_resume_info(text)
    modules = parse_resume_modules(text)  # v3: 模块化解析
    
    return ResumeUploadResponse(
        filename=file.filename,
        text=text,
        parsed=info,
        modules=modules,
        word_count=len(text),
        status="success"
    )

@router.post("/score", response_model=ResumeScoreResult)
async def score_resume(request: ResumeScoreRequest):
    """v3 简历评分: 10分制"""
    prompt = INITIAL_SCORE_PROMPT.format(
        resume_text=request.resume_text[:3000],
        target_job=request.target_job or "未指定",
        job_jd=request.job_jd or "未提供"
    )
    
    try:
        r = ark_call([{"role": "user", "content": prompt}], temp=0.3, max_tokens=4000)
        if not r.get('success'):
            raise Exception(r.get('error', 'ARK call failed'))
        
        result = extract_json_from_text(r['data'])
        
        return ResumeScoreResult(
            overall_score=result.get('overall_score', 6.0),
            six_dimensions=result.get('six_dimensions', {}),
            ats_score=result.get('ats_score', 6.0),
            hr_score=result.get('hr_score', 6.0),
            match_score=result.get('match_score', 6.0),
            screening_result=result.get('screening_result', '待定'),
            hr_feedback=result.get('hr_feedback', ''),
            improvement_areas=result.get('improvement_areas', [])
        )
    except Exception as e:
        return ResumeScoreResult(
            overall_score=6.0,
            six_dimensions={},
            ats_score=6.0,
            hr_score=6.0,
            match_score=6.0,
            screening_result="待定",
            hr_feedback=f"评分系统暂时不可用: {str(e)}",
            improvement_areas=["请稍后重试"]
        )

@router.post("/diagnose", response_model=ResumeDiagnosisResult)
async def diagnose_resume(request: ResumeDiagnosisRequest):
    """v3 AI诊断: 不重新评分，专注问题+HAIC+优化方案"""
    prompt = DIAGNOSIS_PROMPT.format(
        resume_text=request.resume_text[:3000],
        target_job=request.target_job or "未指定",
        job_jd=request.job_jd or "未提供",
        initial_score=json.dumps(request.initial_score or {}, ensure_ascii=False)
    )
    
    try:
        r = ark_call([{"role": "user", "content": prompt}], temp=0.3, max_tokens=5000)
        if not r.get('success'):
            raise Exception(r.get('error', 'ARK call failed'))
        
        result = extract_json_from_text(r['data'])
        
        return ResumeDiagnosisResult(
            issues=result.get('issues', []),
            strengths=result.get('strengths', []),
            haic_analysis=result.get('haic_analysis', {}),
            optimization_plan=result.get('optimization_plan', []),
            keywords_match=result.get('keywords_match', {})
        )
    except Exception as e:
        return ResumeDiagnosisResult(
            issues=[{"category": "系统", "severity": "中", "description": f"AI诊断暂时不可用: {str(e)}", "suggestion": "请稍后重试", "priority": 1}],
            strengths=["简历已上传成功"],
            haic_analysis={},
            optimization_plan=[],
            keywords_match={"matched": [], "missing": [], "match_rate": "未知"}
        )

@router.post("/optimize", response_model=ResumeOptimizeResult)
async def optimize_resume(request: ResumeOptimizeRequest):
    """v3 AI优化: 自动带入前续模块数据 + 10分制新评分"""
    prompt = OPTIMIZE_PROMPT.format(
        resume_text=request.resume_text[:3000],
        target_job=request.target_job,
        job_jd=request.job_jd or "未提供",
        initial_score=json.dumps(request.initial_score or {}, ensure_ascii=False),
        diagnosis_result=json.dumps(request.diagnosis_result or {}, ensure_ascii=False),
        user_notes=request.user_notes or "无额外要求"
    )
    
    try:
        r = ark_call([{"role": "user", "content": prompt}], temp=0.5, max_tokens=8192, retries=3)
        if not r.get('success'):
            raise Exception(r.get('error', 'ARK call failed'))
        
        content = r['data']
        
        # 分离优化后文本和改动说明
        optimized = content
        changes = []
        
        if "[优化后简历]" in content:
            parts = content.split("[优化后简历]")
            if len(parts) > 1:
                rest = parts[1]
                if "[核心改动说明]" in rest:
                    opt_parts = rest.split("[核心改动说明]")
                    optimized = opt_parts[0].strip()
                    changes_text = opt_parts[1] if len(opt_parts) > 1 else ""
                    
                    for line in changes_text.split('\n'):
                        if line.strip() and any(c.isdigit() for c in line[:3]):
                            changes.append({"type": "优化", "description": line.strip()})
                else:
                    optimized = rest.strip()
        
        # v3: 新评分
        new_score = None
        score_improvement = None
        try:
            old_score = request.initial_score or {}
            score_prompt = NEW_SCORE_PROMPT.format(
                old_score=json.dumps(old_score, ensure_ascii=False),
                optimized_text=optimized[:2000],
                target_job=request.target_job,
                job_jd=request.job_jd or "未提供"
            )
            r2 = ark_call([{"role": "user", "content": score_prompt}], temp=0.3, max_tokens=4096, retries=3)
            if r2.get('success'):
                score_result = extract_json_from_text(r2['data'])
                new_score = score_result
                score_improvement = {
                    "overall_change": score_result.get('score_change', 0),
                    "dimension_changes": score_result.get('six_dimensions', {})
                }
        except Exception as e:
            print(f"New score error: {e}")
        
        # 提取每项技能熟练度评分
        skill_scores = new_score.get('skill_scores', {}) if new_score else {}
        
        return ResumeOptimizeResult(
            optimized_text=optimized,
            changes=changes or [{"type": "整体", "description": "AI全面优化简历"}],
            new_score=new_score or {},
            score_improvement=score_improvement or {},
            skill_scores=skill_scores or None
        )
    except Exception as e:
        return ResumeOptimizeResult(
            optimized_text=request.resume_text,
            changes=[{"type": "错误", "description": f"优化失败: {str(e)}"}],
            new_score={},
            skill_scores=None,
            score_improvement={}
        )

@router.post("/generate-pdf")
async def generate_pdf(request: dict):
    """v3: 生成美化PDF格式的简历"""
    resume_text = request.get('resume_text', '')
    title = request.get('title', '优化简历')
    
    html = generate_pdf_html(resume_text, title)
    
    return {
        "html": html,
        "message": "请使用浏览器的'打印为PDF'功能，或复制HTML到在线PDF转换工具"
    }


@router.post("/extract-jd-keywords")
async def extract_jd_keywords(request: dict):
    """从JD中提取关键词"""
    jd_text = request.get('jd_text', '')
    
    if not jd_text or len(jd_text) < 20:
        return {"keywords": [], "error": "JD文本太短"}
    
    prompt = f"""你是一位HR专家。请从以下职位描述(JD)中提取核心关键词。

要求:
1. 提取硬技能关键词(如Python、React、数据分析等)
2. 提取软技能关键词(如沟通能力、团队协作等)
3. 提取行业/领域关键词
4. 提取工具/技术关键词
5. 总共提取10-15个最关键的词
6. 每个词不超过6个字

职位描述:
{jd_text[:2000]}

请直接输出JSON格式:
{{
    "keywords": ["关键词1", "关键词2", ...]
}}

只输出JSON，不要其他内容。"""
    
    try:
        r = ark_call([{"role": "user", "content": prompt}], temp=0.3, max_tokens=1000)
        if r.get('success'):
            result = extract_json_from_text(r['data'])
            return {"keywords": result.get('keywords', [])}
        else:
            return {"keywords": [], "error": "AI调用失败"}
    except Exception as e:
        return {"keywords": [], "error": str(e)}

