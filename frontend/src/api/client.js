// CareerPath AI API 客户端
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.careerpath-ai.example.com';

class APIClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // 模拟数据 - 实际部署时连接真实API
  async getJobStats() {
    return {
      applications: 24,
      interviews: 5,
      offers: 2,
      rejections: 3,
      pending: 14,
      responseRate: 45,
      interviewRate: 25,
      offerRate: 8
    };
  }

  async getCareerPaths(role) {
    const paths = {
      '前端工程师': {
        current: ['HTML/CSS', 'JavaScript', 'React'],
        target: ['TypeScript', 'Node.js', '微前端'],
        salary: { current: '15-20K', target: '25-35K' },
        timeline: '6-12个月'
      }
    };
    return paths[role] || paths['前端工程师'];
  }

  async getDashboardData() {
    return {
      stats: { applications: 24, responseRate: 45, interviewRate: 25, offerRate: 8 },
      skills: [
        { name: 'React', level: 85, target: 90 },
        { name: 'TypeScript', level: 70, target: 80 }
      ]
    };
  }
}

export const apiClient = new APIClient();
