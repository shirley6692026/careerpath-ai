// 专业简历PDF模板 v2 — 简洁单栏设计
// 设计原则: 白底为主、蓝底白字标题、单栏清晰、照片区右上

export function generateResumeHTML(resumeData) {
  const { name, title, contact, sections, skills, score, photoUrl } = resumeData;
  
  const hasPhoto = !!photoUrl;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${name || '简历'}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #2d3748;
      background: #f7fafc;
    }
    
    .resume {
      width: 180mm;
      margin: 0 auto;
      background: #fff;
      padding: 12mm;
      min-height: 267mm;
    }
    
    /* 顶部个人信息区 */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8mm;
      padding-bottom: 5mm;
      border-bottom: 2px solid #3182ce;
    }
    
    .header-left {
      flex: 1;
    }
    
    .name {
      font-size: 22pt;
      font-weight: 700;
      color: #1a365d;
      margin-bottom: 2mm;
      letter-spacing: 2px;
    }
    
    .title {
      font-size: 12pt;
      color: #4a5568;
      margin-bottom: 3mm;
    }
    
    .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 3mm;
      font-size: 9pt;
      color: #718096;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 1mm;
    }
    
    /* 照片区 */
    .photo-area {
      width: 30mm;
      height: 38mm;
      border: 2px dashed #cbd5e0;
      border-radius: 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f7fafc;
      margin-left: 5mm;
      flex-shrink: 0;
    }
    
    .photo-area.has-photo {
      border: none;
      background: transparent;
    }
    
    .photo-area img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 2mm;
    }
    
    .photo-placeholder {
      text-align: center;
      color: #a0aec0;
      font-size: 8pt;
    }
    
    .photo-placeholder .icon {
      font-size: 20pt;
      margin-bottom: 2mm;
    }
    
    /* 蓝底白字模块标题 */
    .section {
      margin-bottom: 6mm;
    }
    
    .section-title {
      background: #2c5282;
      color: #fff;
      font-size: 11pt;
      font-weight: 600;
      padding: 2mm 4mm;
      margin-bottom: 3mm;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    
    .section-title::before {
      content: '';
      width: 3mm;
      height: 3mm;
      background: #63b3ed;
      border-radius: 50%;
    }
    
    /* 经历条目 */
    .exp-item {
      margin-bottom: 4mm;
      padding-left: 3mm;
      border-left: 2px solid #e2e8f0;
    }
    
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1mm;
    }
    
    .exp-title {
      font-weight: 600;
      font-size: 10.5pt;
      color: #2d3748;
    }
    
    .exp-date {
      font-size: 8.5pt;
      color: #718096;
      font-style: italic;
    }
    
    .exp-subtitle {
      font-size: 9.5pt;
      color: #4a5568;
      margin-bottom: 1mm;
    }
    
    .exp-desc {
      font-size: 9.5pt;
      color: #4a5568;
      line-height: 1.5;
    }
    
    .exp-desc li {
      margin-bottom: 0.5mm;
      list-style-position: inside;
    }
    
    /* 技能标签 */
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
    }
    
    .skill-tag {
      background: #ebf8ff;
      color: #2c5282;
      padding: 1mm 3mm;
      border-radius: 1mm;
      font-size: 9pt;
      border: 1px solid #bee3f8;
    }
    
    .skill-tag.highlight {
      background: #2c5282;
      color: #fff;
      border-color: #2c5282;
    }
    
    /* AI评分区 */
    .score-banner {
      background: #ebf8ff;
      border: 1px solid #90cdf4;
      border-radius: 2mm;
      padding: 3mm;
      margin-top: 5mm;
      text-align: center;
    }
    
    .score-label {
      font-size: 8pt;
      color: #4a5568;
      margin-bottom: 1mm;
    }
    
    .score-value {
      font-size: 18pt;
      font-weight: 700;
      color: #2c5282;
    }
    
    .score-note {
      font-size: 7.5pt;
      color: #718096;
      margin-top: 1mm;
    }
    
    /* 页脚 */
    .footer {
      margin-top: 8mm;
      padding-top: 3mm;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 7.5pt;
      color: #a0aec0;
    }
    
    @media print {
      body { background: #fff; }
      .resume { width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="resume">
    <!-- 顶部个人信息 -->
    <div class="header">
      <div class="header-left">
        <div class="name">${name || '姓名'}</div>
        <div class="title">${title || '求职意向：待填写'}</div>
        <div class="contact-row">
          ${contact ? contact.map(c => `
            <div class="contact-item">
              <span>${c.icon}</span>
              <span>${c.value}</span>
            </div>
          `).join('') : '<div class="contact-item">📱 电话 | ✉️ 邮箱 | 📍 地址</div>'}
        </div>
      </div>
      
      <!-- 照片区 -->
      <div class="photo-area ${hasPhoto ? 'has-photo' : ''}">
        ${hasPhoto 
          ? `<img src="${photoUrl}" alt="照片" />`
          : `<div class="photo-placeholder">
              <div class="icon">👤</div>
              <div>一寸照</div>
              <div style="font-size:7pt">(可粘贴)</div>
            </div>`
        }
      </div>
    </div>
    
    <!-- 模块内容 -->
    ${sections ? sections.map(sec => `
      <div class="section">
        <div class="section-title">${sec.title}</div>
        ${sec.items ? sec.items.map(item => `
          <div class="exp-item">
            <div class="exp-header">
              <span class="exp-title">${item.title}</span>
              <span class="exp-date">${item.date || ''}</span>
            </div>
            <div class="exp-subtitle">${item.subtitle || ''}</div>
            <div class="exp-desc">${item.description || ''}</div>
          </div>
        `).join('') : ''}
        
        ${sec.type === 'skills' && sec.skillTags ? `
          <div class="skills-container">
            ${sec.skillTags.map(tag => `
              <span class="skill-tag ${tag.highlight ? 'highlight' : ''}">${tag.name}</span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('') : ''}
    
    <!-- AI评分 -->
    ${score ? `
    <div class="score-banner">
      <div class="score-label">🤖 CareerPath AI 智能评分</div>
      <div class="score-value">${score}/10</div>
      <div class="score-note">基于 McKinsey · Deloitte · Gartner · WEF 2025 HR研究标准</div>
    </div>
    ` : ''}
    
    <div class="footer">
      本简历由 CareerPath AI 简历工坊智能优化生成
    </div>
  </div>
</body>
</html>`;
}

// 将纯文本简历解析为结构化数据
export function parseResumeToStructured(text) {
  const lines = text.split('\n').filter(l => l.trim());
  
  // 提取姓名
  let name = '';
  for (const line of lines.slice(0, 5)) {
    if (line.trim() && line.length < 15 && !line.includes('求职') && !line.includes('意向')) {
      name = line.trim();
      break;
    }
  }
  if (!name) name = '姓名';
  
  // 提取求职意向
  let title = '';
  for (const line of lines) {
    if (line.includes('求职') || line.includes('意向') || line.includes('应聘') || line.includes('目标')) {
      title = line.replace(/.*[:：]/, '').trim();
      if (title) break;
    }
  }
  if (!title) title = '求职意向：待填写';
  
  // 提取联系方式
  const contact = [];
  for (const line of lines) {
    const phoneMatch = line.match(/(\d{3}[-\s]?\d{4}[-\s]?\d{4}|\d{11})/);
    if (phoneMatch && !contact.find(c => c.type === 'phone')) {
      contact.push({ icon: '📱', value: phoneMatch[0], type: 'phone' });
    }
    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch && !contact.find(c => c.type === 'email')) {
      contact.push({ icon: '✉️', value: emailMatch[0], type: 'email' });
    }
    if ((line.includes('地址') || line.includes('居住地')) && !contact.find(c => c.type === 'address')) {
      contact.push({ icon: '📍', value: line.replace(/.*[:：]/, '').trim() || '地址', type: 'address' });
    }
  }
  
  // 提取技能
  const skillTags = [];
  let inSkillsSection = false;
  for (const line of lines) {
    if (line.includes('技能') || line.includes('技术栈') || line.includes('掌握')) {
      inSkillsSection = true;
      continue;
    }
    if (inSkillsSection && line.trim() && !line.includes('经历') && !line.includes('项目') && !line.includes('教育')) {
      const skills = line.split(/[,，、;；]/).map(s => s.trim()).filter(s => s && s.length < 20);
      skills.forEach(s => {
        skillTags.push({ name: s, highlight: false });
      });
    }
    if (inSkillsSection && (line.includes('经历') || line.includes('项目') || line.includes('教育'))) {
      inSkillsSection = false;
    }
  }
  
  // 构建sections
  const sections = [];
  let currentSection = null;
  
  const sectionMap = {
    '教育': { title: '🎓 教育背景', type: 'education' },
    '学历': { title: '🎓 教育背景', type: 'education' },
    '学校': { title: '🎓 教育背景', type: 'education' },
    '经历': { title: '💼 工作经历', type: 'work' },
    '工作': { title: '💼 工作经历', type: 'work' },
    '实习': { title: '💼 实习经历', type: 'work' },
    '项目': { title: '🚀 项目经验', type: 'project' },
    '荣誉': { title: '🏆 荣誉奖项', type: 'honor' },
    '奖项': { title: '🏆 荣誉奖项', type: 'honor' },
    '证书': { title: '📜 证书资质', type: 'cert' },
    '评价': { title: '📝 自我评价', type: 'evaluation' },
    '总结': { title: '📝 自我评价', type: 'evaluation' },
    '技能': { title: '💡 专业技能', type: 'skills' }
  };
  
  for (const line of lines) {
    let foundSection = false;
    for (const [keyword, config] of Object.entries(sectionMap)) {
      if (line.includes(keyword) && line.length < 20) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: config.title, type: config.type, items: [] };
        if (config.type === 'skills') {
          currentSection.skillTags = [];
        }
        foundSection = true;
        break;
      }
    }
    
    if (!foundSection && currentSection) {
      if (currentSection.type === 'skills') {
        const skills = line.split(/[,，、;；]/).map(s => s.trim()).filter(s => s && s.length < 20);
        skills.forEach(s => {
          currentSection.skillTags.push({ name: s, highlight: false });
        });
      } else {
        currentSection.items.push({
          title: line.trim(),
          subtitle: '',
          description: line.trim(),
          date: ''
        });
      }
    }
  }
  
  if (currentSection) sections.push(currentSection);
  
  return { name, title, contact, sections, skillTags };
}
