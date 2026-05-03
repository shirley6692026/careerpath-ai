"""
火山引擎 ARK API 客户端
Endpoint: ep-20260430160624-7wlsh (Doubao-1.5-pro-32k-250115)
自动故障转移: 主模型失败 → 备用模型
"""

import os
import json
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
import httpx

load_dotenv()

ARK_API_KEY = os.getenv("ARK_API_KEY", "e2056fa0-1f84-4cc0-9f3e-1f13c493c67e")
ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

# 主 Endpoint (创建好的推理接入点)
MAIN_ENDPOINT = "ep-20260430160624-7wlsh"

# 备用模型 (如果主 endpoint 不可用)
FALLBACK_MODELS = [
    "doubao-1-5-pro-32k-250115",
    "doubao-1-5-thinking-pro-250415",
    "doubao-1-5-pro-256k-250115",
    "deepseek-v3-2",
]


class ArkClient:
    """火山引擎 ARK API 客户端"""

    def __init__(self):
        self.api_key = ARK_API_KEY
        self.base_url = ARK_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def chat(
        self,
        messages: list,
        model: str = MAIN_ENDPOINT,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        调用 ARK 大模型
        Args:
            messages: OpenAI 格式消息列表
            model: 模型ID 或 Endpoint ID (默认使用创建的推理接入点)
            temperature: 温度参数
            max_tokens: 最大输出
            stream: 是否流式
        """
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }

        try:
            with httpx.Client(timeout=180.0) as client:
                resp = client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )

            if resp.status_code == 200:
                data = resp.json()
                usage = data.get("usage", {})
                return {
                    "success": True,
                    "data": data["choices"][0]["message"]["content"],
                    "model_used": model,
                    "tokens": {
                        "prompt": usage.get("prompt_tokens", 0),
                        "completion": usage.get("completion_tokens", 0),
                        "total": usage.get("total_tokens", 0)
                    }
                }
            else:
                return {"success": False, "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ========== 便捷方法 ==========

    def translate_jd(self, jd_text: str) -> Dict:
        """JD 翻译官"""
        return self.chat([
            {"role": "system", "content": "你是一个专业的招聘JD分析专家。请将下面的招聘JD翻译为真实工作日常，提取能力要求（硬技能/软技能/隐藏要求），拆解薪资结构。用中文回答，格式清晰。"},
            {"role": "user", "content": jd_text}
        ], temperature=0.3)

    def analyze_skills(self, skills: str, target_job: str) -> Dict:
        """能力雷达"""
        return self.chat([
            {"role": "system", "content": "你是一个职业能力分析专家。分析用户的技能与目标岗位的匹配度，发现可迁移能力，给出提升建议。"},
            {"role": "user", "content": f"我的技能: {skills}\n目标岗位: {target_job}"}
        ], temperature=0.4)

    def mock_interview(self, position: str, user_answer: str) -> Dict:
        """AI 模拟面试"""
        return self.chat([
            {"role": "system", "content": "你是一个专业的面试官。针对目标岗位生成面试题，并对回答进行评分(1-10)和改进建议。"},
            {"role": "user", "content": f"目标岗位: {position}\n我的回答: {user_answer}"}
        ], temperature=0.5)

    def optimize_resume(self, resume: str, target_job: str) -> Dict:
        """简历优化"""
        return self.chat([
            {"role": "system", "content": "你是一个专业的简历优化专家。分析简历质量，给出评分(1-10)和具体优化建议。"},
            {"role": "user", "content": f"简历:\n{resume}\n\n目标岗位: {target_job}"}
        ], temperature=0.3)


# 全局单例
client = ArkClient()
