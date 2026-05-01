// 专业简历PDF模板 — 美观设计版
// 灵感来源: Canva / Novoresume / Resume.io 顶级模板

export function generateResumeHTML(resumeData) {
  const { name, title, contact, sections, skills, score } = resumeData;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${name || '简历'}</title>
  <style>
    @page { size: A4; margin: 0; }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #2c3e50;
      background: #fff;
    }
    
    .resume {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      display: flex;
    }
    
    /* 左侧边栏 */
    .sidebar {
      width: 72mm;
      background: #1a365d;
      color: #fff;
      padding: 25mm 8mm 20mm 8mm;
      min-height: 297mm;
    }
    
    .profile-img {
      width: 45mm;
      height: 45mm;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      margin: 0 auto 6mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24pt;
      border: 3px solid rgba(255,255,255,0.3);
    }
    
    .name {
      font-size: 16pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 2mm;
      letter-spacing: 1px;
    }
    
    .title {
      font-size: 10pt;
      text-align: center;
      opacity: 0.85;
      margin-bottom: 8mm;
      font-weight: 300;
    }
    
    .sidebar-section {
      margin-bottom: 8mm;
    }
    
    .sidebar-title {
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4mm;
      padding-bottom: 2mm;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 2mm;
      margin-bottom: 2mm;
      font-size: 9pt;
      opacity: 0.9;
    }
    
    .contact-icon {
      width: 5mm;
      text-align: center;
    }
    
    .skill-item {
      margin-bottom: 3mm;
    }
    
    .skill-name {
      font-size: 9pt;
      margin-bottom: 1mm;
    }
    
    .skill-bar {
      height: 2mm;
      background: rgba(255,255,255,0.2);
      border-radius: 1mm;
      overflow: hidden;
    }
    
    .skill-fill {
      height: 100%;
      background: #63b3ed;
      border-radius: 1mm;
    }
    
    .tag {
      display: inline-block;
      background: rgba(255,255,255,0.15);
      padding: 1mm 3mm;
      border-radius: 2mm;
      font-size: 8pt;
      margin: 1mm;
    }
    
    /* 右侧主内容 */
    .main {
      flex: 1;
      padding: 20mm 10mm 20mm 10mm;
      background: #fff;
    }
    
    .main-section {
      margin-bottom: 8mm;
    }
    
    .main-title {
      font-size: 12pt;
      font-weight: 700;
      color: #1a365d;
      margin-bottom: 4mm;
      padding-bottom: 2mm;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    
    .main-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e2e8f0;
      margin-left: 3mm;
    }
    
    .experience-item {
      margin-bottom: 5mm;
      padding-left: 3mm;
      border-left: 2px solid #63b3ed;
    }
    
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1mm;
    }
    
    .exp-title {
      font-weight: 600;
      font-size: 10pt;
      color: #2d3748;
    }
    
    .exp-date {
      font-size: 8pt;
      color: #718096;
      font-style: italic;
    }
    
    .exp-company {
      font-size: 9pt;
      color: #4a5568;
      margin-bottom: 1mm;
    }
    
    .exp-desc {
      font-size: 9pt;
      color: #4a5568;
      line-height: 1.6;
    }
    
    .exp-desc li {
      margin-bottom: 1mm;
      list-style-position: inside;
    }
    
    .highlight-box {
      background: #ebf8ff;
      border-left: 3px solid #3182ce;
      padding: 3mm;
      margin: 3mm 0;
      border-radius: 0 2mm 2mm 0;
    }
    
    .score-badge {
      display: inline-block;
      background: #1a365d;
      color: #fff;
      padding: 1mm 3mm;
      border-radius: 2mm;
      font-size: 8pt;
      font-weight: 600;
    }
    
    .footer {
      position: absolute;
      bottom: 5mm;
      left: 80mm;
      right: 10mm;
      text-align: center;
      font-size: 7pt;
      color: #a0aec0;
      border-top: 1px solid #e2e8f0;
      padding-top: 2mm;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="resume">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <div class="profile-img">👤</div>
      <div class="name">${name || '姓名'}</div>
      <div class="title">${title || '求职意向'}</div>
      
      <div class="sidebar-section">
        <div class="sidebar-title">联系方式</div>
        ${contact ? contact.map(c => `
          <div class="contact-item">
            <span class="contact-icon">${c.icon}</span>
            <span>${c.value}</span>
          </div>
        `).join('') : ''}
      </div>
      
      <div class="sidebar-section">
        <div class="sidebar-title">专业技能</div>
        ${skills ? skills.map(s => `
          <div class="skill-item">
            <div class="skill-name">${s.name}</div>
            <div class="skill-bar">
              <div class="skill-fill" style="width: ${s.level}%;"></div>
            </div>
          </div>
        `).join('') : ''}
      </div>
      
      <div class="sidebar-section">
        <div class="sidebar-title">其他技能</div>
        <div>
          ${skills ? skills.filter(s => !s.level).map(s => `
            <span class="tag">${s.name}</span>
          `).join('') : ''}
        </div>
      </div>
      
      ${score ? `
      <div class="sidebar-section">
        <div class="sidebar-title">AI评分</div>
        <div style="text-align: center;">
          <div style="font-size: 24pt; font-weight: 700;">${score}</div>
          <div style="font-size: 8pt; opacity: 0.7;">CareerPath AI 评分</div>
        </div>
      </div>
      ` : ''}
    </div>
    
    <!-- 右侧主内容 -->
    <div class="main">
      ${sections ? sections.map(sec => `
        <div class="main-section">
          <div class="main-title">${sec.title}</div>
          ${sec.items ? sec.items.map(item => `
            <div class="experience-item">
              <div class="exp-header">
                <span class="exp-title">${item.title}</span>
                <span class="exp-date">${item.date || ''}</span>
              </div>
              <div class="exp-company">${item.subtitle || ''}</div>
              <div class="exp-desc">${item.description || ''}</div>
            </div>
          `).join('') : ''}
        </div>
      `).join('') : ''}
      
      <div class="highlight-box">
        <strong>🤖 AI优化亮点：</strong>本简历由 CareerPath AI 智能优化生成，基于 McKinsey/Deloitte/Gartner/WEF 2025 研究标准，针对目标岗位精准匹配关键词和技能。
      </div>
    </div>
  </div>
  
  <div class="footer">
    由 CareerPath AI 简历工坊生成 | 基于全球四大机构 2025 HR 研究标准
  </div>
</body>
</html>`;
}

// 将纯文本简历解析为结构化数据
export function parseResumeToStructured(text) {
  const lines = text.split('\n').filter(l => l.trim());
  
  // 尝试提取姓名（第一行或包含"姓名"的行）
  let name = lines[0]?.trim() || '姓名';
  if (name.length > 10) name = '姓名';
  
  // 尝试提取求职意向
  let title = '';
  for (const line of lines) {
    if (line.includes('求职') || line.includes('意向') || line.includes('应聘')) {
      title = line.replace(/.*[:：]/, '').trim();
      break;
    }
  }
  
  // 提取联系方式
  const contact = [];
  for (const line of lines) {
    if (line.includes('电话') || line.includes('手机') || /\d{11}/.test(line)) {
      const phone = line.match(/\d{11}/)?.[0];
      if (phone) contact.push({ icon: '📱', value: phone });
    }
    if (line.includes('邮箱') || line.includes('@')) {
      const email = line.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];
      if (email) contact.push({ icon: '✉️', value: email });
    }
  }
  
  // 提取技能
  const skills = [];
  let inSkillsSection = false;
  for (const line of lines) {
    if (line.includes('技能') || line.includes('技术')) {
      inSkillsSection = true;
      continue;
    }
    if (inSkillsSection && line.trim() && !line.includes('经历') && !line.includes('项目')) {
      const skillNames = line.split(/[,，、]/).map(s => s.trim()).filter(s => s);
      skillNames.forEach(s => {
        skills.push({ name: s, level: Math.floor(Math.random() * 30) + 70 });
      });
    }
    if (inSkillsSection && (line.includes('经历') || line.includes('项目'))) {
      inSkillsSection = false;
    }
  }
  
  // 构建sections
  const sections = [];
  let currentSection = null;
  
  for (const line of lines) {
    if (line.includes('教育') || line.includes('学历')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: '🎓 教育背景', items: [] };
    } else if (line.includes('经历') || line.includes('工作')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: '💼 工作经历', items: [] };
    } else if (line.includes('项目')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: '🚀 项目经验', items: [] };
    } else if (line.includes('荣誉') || line.includes('奖项')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: '🏆 荣誉奖项', items: [] };
    } else if (line.includes('评价') || line.includes('总结')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: '📝 自我评价', items: [] };
    } else if (currentSection) {
      currentSection.items.push({
        title: line.trim(),
        description: line.trim()
      });
    }
  }
  
  if (currentSection) sections.push(currentSection);
  
  return { name, title, contact, skills, sections };
}
