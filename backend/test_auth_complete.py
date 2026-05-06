#!/usr/bin/env python3
"""
认证系统完整测试脚本
运行: python3 test_auth_complete.py
"""
from fastapi.testclient import TestClient
from main import app

def test_auth_system():
    client = TestClient(app)
    
    print("=" * 60)
    print("CareerPath AI 认证系统完整测试")
    print("=" * 60)
    
    tests_passed = 0
    tests_failed = 0
    
    # 1. 发送验证码
    print("\n[1/10] 发送验证码...")
    try:
        response = client.post('/api/auth/send-code', json={'email': 'autotest@example.com'})
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        code = data['code']
        print(f"   ✅ 通过 - 验证码: {code}")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
        code = '123456'
    
    # 2. 用户注册
    print("\n[2/10] 用户注册...")
    try:
        response = client.post('/api/auth/register', json={
            'email': 'autotest@example.com',
            'name': 'Auto Test User'
        })
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        token = data['token']
        user_id = data['user']['id']
        print(f"   ✅ 通过 - 用户ID: {user_id}")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
        token = None
    
    # 3. 用户登录
    print("\n[3/10] 用户登录...")
    try:
        response = client.post('/api/auth/login', json={
            'email': 'autotest@example.com',
            'code': code
        })
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        login_token = data['token']
        print(f"   ✅ 通过 - Token获取成功")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
        login_token = token
    
    # 4. 获取用户信息
    print("\n[4/10] 获取用户信息...")
    try:
        response = client.get('/api/auth/me', headers={
            'Authorization': f'Bearer {login_token}'
        })
        assert response.status_code == 200
        data = response.json()
        assert data['user']['email'] == 'autotest@example.com'
        print(f"   ✅ 通过 - 用户: {data['user']['email']}")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
    
    # 5. 保存用户数据
    print("\n[5/10] 保存用户数据...")
    try:
        test_data = {
            'skills': ['Python', 'JavaScript', 'React'],
            'targetJob': '全栈工程师',
            'experience': 3
        }
        response = client.post('/api/auth/data/resume', json=test_data, headers={
            'Authorization': f'Bearer {login_token}'
        })
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        print(f"   ✅ 通过 - 数据保存成功")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
    
    # 6. 获取用户数据
    print("\n[6/10] 获取用户数据...")
    try:
        response = client.get('/api/auth/data/resume', headers={
            'Authorization': f'Bearer {login_token}'
        })
        assert response.status_code == 200
        data = response.json()
        saved = data['data']['data']
        assert saved['skills'] == ['Python', 'JavaScript', 'React']
        assert saved['targetJob'] == '全栈工程师'
        print(f"   ✅ 通过 - 数据: {saved}")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
    
    # 7. 批量同步
    print("\n[7/10] 批量同步数据...")
    try:
        sync_data = {
            'jd': {'text': '测试JD内容', 'keywords': ['Python', 'AI']},
            'interview': {'history': [], 'scores': []},
            'skill_radar': {'skills': ['Python'], 'gaps': []}
        }
        response = client.post('/api/auth/sync', json=sync_data, headers={
            'Authorization': f'Bearer {login_token}'
        })
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert len(data['modules']) == 3
        print(f"   ✅ 通过 - 同步模块: {data['modules']}")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
    
    # 8. 获取所有数据
    print("\n[8/10] 获取所有数据...")
    try:
        response = client.get('/api/auth/data', headers={
            'Authorization': f'Bearer {login_token}'
        })
        assert response.status_code == 200
        data = response.json()
        assert data['count'] >= 4  # resume + jd + interview + skill_radar
        print(f"   ✅ 通过 - 数据条数: {data['count']}")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
    
    # 9. 未授权访问
    print("\n[9/10] 验证未授权访问...")
    try:
        response = client.get('/api/auth/me')
        assert response.status_code == 403
        print(f"   ✅ 通过 - 未授权访问被阻止")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
    
    # 10. 错误Token
    print("\n[10/10] 验证错误Token...")
    try:
        response = client.get('/api/auth/me', headers={
            'Authorization': 'Bearer invalid-token'
        })
        assert response.status_code == 401
        print(f"   ✅ 通过 - 错误Token被阻止")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ 失败 - {e}")
        tests_failed += 1
    
    # 总结
    print("\n" + "=" * 60)
    print(f"测试结果: {tests_passed} 通过, {tests_failed} 失败")
    print("=" * 60)
    
    if tests_failed == 0:
        print("🎉 全部测试通过! 认证系统功能完整!")
        return True
    else:
        print(f"⚠️  {tests_failed} 个测试失败，请检查")
        return False

if __name__ == '__main__':
    success = test_auth_system()
    exit(0 if success else 1)
