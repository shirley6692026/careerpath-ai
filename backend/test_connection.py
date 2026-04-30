"""
火山引擎 ARK 连接测试脚本
用法: python test_connection.py [endpoint_id]
如果没有提供 endpoint_id，会列出可用的模型列表
"""

import sys
import httpx

API_KEY = "e2056fa0-1f84-4cc0-9f3e-1f13c493c67e"
BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

def list_models():
    """列出所有可用模型"""
    resp = httpx.get(
        f"{BASE_URL}/models",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    if resp.status_code == 200:
        models = resp.json().get("data", [])
        print(f"\n📋 火山引擎 ARK 可用模型 ({len(models)} 个):\n")
        for m in models:
            print(f"  • {m['id']}")
        print(f"\n💡 提示: 需要在 ARK 控制台创建推理接入点 (Endpoint)")
        print(f"   → https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint")
    else:
        print(f"❌ 获取模型列表失败: {resp.status_code}")
        print(resp.text[:300])

def test_endpoint(endpoint_id):
    """测试指定 endpoint"""
    payload = {
        "model": endpoint_id,
        "messages": [{"role": "user", "content": "请用一句话介绍你自己"}],
        "temperature": 0.3,
        "max_tokens": 100
    }
    
    print(f"\n🔍 测试 Endpoint: {endpoint_id}")
    
    with httpx.Client(timeout=30) as client:
        resp = client.post(
            f"{BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
            json=payload
        )
    
    if resp.status_code == 200:
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        print(f"✅ 连接成功!")
        print(f"📝 回复: {content}")
        print(f"📊 Token: {usage}")
        return True
    else:
        error = resp.json().get("error", {})
        print(f"❌ 失败: {error.get('message', 'unknown')}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_endpoint(sys.argv[1])
    else:
        list_models()
