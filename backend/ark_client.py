"""
火山引擎 ARK API 客户端
支持豆包大模型系列 + 开源模型 (DeepSeek/Kimi/GLM)
自动故障转移: 主模型失败 → 备用模型 → 备用模型2
"""

import os
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import httpx

load_dotenv()

# 默认配置
ARK_API_KEY = os.getenv("ARK_API_KEY", "e2056fa0-1f84-4cc0-9f3e-1f13c493c67e")
ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

# 模型路由表 (按优先级)
MODEL_ROUTES = [
    # 主模型: Doubao1.5-pro-32k (中文最优)
    {"id": "doubao1-5-pro-32k", "name": "Doubao1.5-pro-32k", "priority": 1},
    # 备用1: Doubao-Seed-2.0-pro
    {"id": "doubao-seed-2-0-pro", "name": "Doubao-Seed-2.0-pro", "priority": 2},
    # 备用2: Doubao1.5-think-pro (复杂推理)
    {"id": "doubao1-5-think-pro", "name": "Doubao1.5-think-pro", "priority": 3},
    # 备用3: DeepSeek-V3.2
    {"id": "deepseek-v3-2", "name": "DeepSeek-V3.2", "priority": 4},
    # 备用4: Kimi-K2
    {"id": "kimi-k2", "name": "Kimi-K2", "priority": 5},
    # 备用5: Doubao-Seed-2.0-code (代码)
    {"id": "doubao-seed-2-0-code", "name": "Doubao-Seed-2.0-code", "priority": 6},
    # 备用6: DeepSeek-V3.1
    {"id": "deepseek-v3-1", "name": "DeepSeek-V3.1", "priority": 7},
    # 备用7: DeepSeek-V3
    {"id": "deepseek-v3", "name": "DeepSeek-V3", "priority": 8},
    # 备用8: DeepSeek-R1 (深度推理)
    {"id": "deepseek-r1", "name": "DeepSeek-R1", "priority": 9},
    # 备用9: Doubao1.5-pro-256k (超长文本)
    {"id": "doubao1-5-pro-256k", "name": "Doubao1.5-pro-256k", "priority": 10},
]


class ArkClient:
    """火山引擎 ARK API 客户端 (带自动故障转移)"""

    def __init__(self, api_key: str = ARK_API_KEY):
        self.api_key = api_key
        self.base_url = ARK_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def chat(
        self,
        messages: list,
        model_id: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
        fallback: bool = True
    ) -> Dict[str, Any]:
        """
        调用 ARK 大模型 (带自动故障转移)
        
        Args:
            messages: OpenAI 格式消息列表
            model_id: 指定模型ID (None=使用主模型)
            temperature: 温度参数
            max_tokens: 最大输出tokens
            stream: 是否流式输出
            fallback: 是否启用故障转移
        
        Returns:
            {"success": True, "data": ..., "model_used": "...", "tokens": ...}
            or {"success": False, "error": "..."}
        """
        # 构建请求模型列表
        models_to_try = []
        if model_id:
            # 如果指定了模型，尝试它 + 故障转移
            models_to_try = [m for m in MODEL_ROUTES if m["id"] == model_id]
            if fallback:
                models_to_try += [m for m in MODEL_ROUTES if m["id"] != model_id]
        else:
            models_to_try = MODEL_ROUTES if fallback else [MODEL_ROUTES[0]]

        last_error = None
        for model in models_to_try:
            try:
                payload = {
                    "model": model["id"],
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": stream
                }

                with httpx.Client(timeout=60.0) as client:
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
                        "model_used": model["name"],
                        "model_id": model["id"],
                        "tokens": {
                            "prompt": usage.get("prompt_tokens", 0),
                            "completion": usage.get("completion_tokens", 0),
                            "total": usage.get("total_tokens", 0)
                        }
                    }
                else:
                    last_error = f"Model {model['name']}: HTTP {resp.status_code} - {resp.text[:200]}"
                    continue

            except Exception as e:
                last_error = f"Model {model['name']}: {str(e)}"
                continue

        return {
            "success": False,
            "error": f"所有模型调用失败。最后错误: {last_error}"
        }

    # 便捷方法
    def translate_jd(self, jd_text: str) -> Dict:
        """JD 翻译官：将招聘 JD 翻译为真实工作内容"""
        messages = [
            {"role": "system", "content": "你是一个专业的招聘JD分析专家。请将招聘JD翻译为真实工作日常，提取能力要求，拆解薪资结构，识别隐藏要求。"},
            {"role": "user", "content": f"请分析以下招聘JD:\n\n{jd_text}"}
        ]
        return self.chat(messages, temperature=0.3)

    def analyze_skills(self, skills_text: str, target_job: str) -> Dict:
        """能力雷达：分析技能差距和可迁移能力"""
        messages = [
            {"role": "system", "content": "你是一个职业能力分析专家。请分析用户的技能与目标岗位的匹配度，发现可迁移能力，生成提升路径。"},
            {"role": "user", "content": f"我的技能: {skills_text}\n目标岗位: {target_job}"}
        ]
        return self.chat(messages, temperature=0.4, model_id="doubao1-5-think-pro")

    def mock_interview(self, position: str, question: str) -> Dict:
        """AI 模拟面试官：生成面试题和评分"""
        messages = [
            {"role": "system", "content": "你是一个专业的面试官。请根据目标岗位生成面试题，并对用户的回答进行评分和反馈。"},
            {"role": "user", "content": f"目标岗位: {position}\n面试问题: {question}"}
        ]
        return self.chat(messages, temperature=0.5)

    def optimize_resume(self, resume_text: str, target_job: str) -> Dict:
        """简历工坊：简历分析和优化"""
        messages = [
            {"role": "system", "content": "你是一个专业的简历优化专家。请分析简历的质量，提供优化建议。"},
            {"role": "user", "content": f"我的简历:\n{resume_text}\n\n目标岗位: {target_job}"}
        ]
        return self.chat(messages, temperature=0.3)

    def generate_roadmap(self, current_level: str, target_role: str) -> Dict:
        """学习路线图：生成个性化学习路径"""
        messages = [
            {"role": "system", "content": "你是一个职业发展顾问。请根据用户的当前水平和目标岗位，生成详细的学习路线图。"},
            {"role": "user", "content": f"当前水平: {current_level}\n目标岗位: {target_role}"}
        ]
        return self.chat(messages, temperature=0.4)

    def evaluate_haic(self, answers: dict) -> Dict:
        """HAIC 评估：5维人机协作指数评估"""
        messages = [
            {"role": "system", "content": "你是一个HAIC人机协作指数评估专家。请根据用户的回答，从5个维度评估其AI协作能力：AI认知力(20%)、提示工程力(20%)、工作流重构力(25%)、质量判断力(20%)、伦理决策力(15%)。"},
            {"role": "user", "content": f"我的HAIC评估回答:\n{json.dumps(answers, ensure_ascii=False)}"}
        ]
        return self.chat(messages, temperature=0.3, model_id="doubao1-5-think-pro")


# 单例
client = ArkClient()
