"""简历解析器: 支持 .docx/.pdf/.txt/.xlsx → 纯文本"""
import docx
import PyPDF2
import openpyxl
import csv
from io import StringIO
from pathlib import Path
import re

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def extract_text_from_docx(filepath: str) -> str:
    """从 .docx 提取文本 (按文档顺序交错表格内容)"""
    doc = docx.Document(filepath)
    text = []
    
    # 获取文档body的XML子元素，按文档顺序遍历段落和表格
    body = doc.element.body
    for child in body:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'p':
            # 段落
            para = docx.text.paragraph.Paragraph(child, doc)
            t = para.text.strip()
            if t:
                text.append(t)
        elif tag == 'tbl':
            # 表格 - 提取所有单元格内容
            table = docx.table.Table(child, doc)
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if cells:
                    text.append(' | '.join(cells))
    
    return '\n'.join(text).strip()


def extract_text_from_pdf(filepath: str) -> str:
    """从 .pdf 提取文本 (支持OCR回退)"""
    # 方法1: PyPDF2直接提取
    raw_text = []
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                t = page.extract_text()
                if t and t.strip():
                    raw_text.append(t.strip())
    except Exception as e:
        raw_text.append(f"[PDF解析错误: {e}]")
    
    joined = '\n'.join(raw_text).strip()
    
    # 方法2: 如果文本太少, 尝试OCR
    if len(joined) < 50:
        try:
            from PIL import Image
            import pytesseract
            import subprocess, tempfile, os
            
            # 每页转PNG → OCR
            ocr_lines = []
            num_pages = 0
            try:
                with open(filepath, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    num_pages = len(reader.pages)
            except:
                num_pages = 1
            
            for i in range(num_pages):
                tmp = f"/tmp/_pdf_page_{i}.png"
                subprocess.run([
                    "sips", "-s", "format", "png",
                    "-z", "1684", "1190",
                    filepath, "--out", tmp
                ], capture_output=True, timeout=30)
                if os.path.exists(tmp):
                    img = Image.open(tmp)
                    t = pytesseract.image_to_string(img, lang='chi_sim+eng')
                    if t.strip():
                        ocr_lines.append(t.strip())
                    os.remove(tmp)
            
            if ocr_lines:
                return '\n'.join(ocr_lines)
        except Exception as ocr_e:
            pass  # OCR失败, 返回原始空结果
    
    return joined if joined else f"[无法从该PDF提取文字, 请尝试转换格式]\n{joined}"

def extract_text_from_txt(filepath: str) -> str:
    """从 .txt 提取文本"""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()

def extract_text_from_doc(filepath: str) -> str:
    """从 .doc (旧版Word) 提取文本 (用macOS内置textutil)"""
    import subprocess, os
    try:
        tmp = '/tmp/_doc_convert.txt'
        subprocess.run(['textutil', '-convert', 'txt', filepath, '-output', tmp],
                      capture_output=True, timeout=30)
        if os.path.exists(tmp):
            with open(tmp, 'r', encoding='utf-8', errors='replace') as f:
                result = f.read()
            os.remove(tmp)
            return result.strip()
    except Exception as e:
        pass
    return "[.doc解析失败: 请转换为.docx格式]"


def extract_text_from_xlsx(filepath: str) -> str:
    """从 .xlsx 提取文本"""
    lines = []
    try:
        wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
        for sheet in wb.worksheets:
            for row in sheet.iter_rows(values_only=True):
                cells = [str(c).strip() for c in row if c is not None]
                if cells:
                    lines.append(' '.join(cells))
        wb.close()
    except Exception as e:
        lines.append(f"[XLSX解析错误: {e}]")
    return '\n'.join(lines)

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
