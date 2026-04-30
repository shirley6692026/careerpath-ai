"""简历解析器: 支持 .docx → 纯文本"""
import docx
from pathlib import Path
import re

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def extract_text_from_docx(filepath: str) -> str:
    """从 .docx 提取文本"""
    doc = docx.Document(filepath)
    text = []
    for para in doc.paragraphs:
        text.append(para.text)
    # Also extract from tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                text.append(cell.text)
    return '\n'.join(text).strip()

def extract_resume_info(text: str) -> dict:
    """从简历文本提取关键信息"""
    info = {
        "education": [],
        "skills": [],
        "experience": [],
        "target_position": "",
        "raw_text": text[:3000]  # 保留前3000字
    }
    
    lines = text.split('\n')
    current_section = "header"
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Detect sections
        if any(k in line for k in ['教育', '学校', '大学', '学院', '专业']):
            current_section = "education"
            info["education"].append(line)
        elif any(k in line for k in ['技能', '能力', '熟练', '掌握', '证书']):
            current_section = "skills"
            info["skills"].append(line)
        elif any(k in line for k in ['经历', '经验', '项目', '工作']):
            current_section = "experience"
            info["experience"].append(line)
        elif any(k in line for k in ['求职', '意向', '目标', '应聘', '岗位']):
            info["target_position"] = line
        else:
            if current_section == "education":
                info["education"].append(line)
            elif current_section == "skills":
                info["skills"].append(line)
            elif current_section == "experience":
                info["experience"].append(line)
    
    return info
