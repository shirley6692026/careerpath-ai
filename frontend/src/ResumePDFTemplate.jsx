// 专业简历PDF模板 v4 — Apple级极简高级感设计
// 设计原则: 留白、克制、精准、高级感

export function generateResumeHTML(resumeData) {
  const { name, title, contact, sections, score, targetJob } = resumeData;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${name || '简历'}</title>
  <style>
    @page { size: A4; margin: 18mm 15mm; }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 10pt;
      line-height: 1.7;
      color: #1d1d1f;
      background: #fff;
      -webkit-font-smoothing: antialiased;
    }
    
    .resume {
      max-width: 180mm;
      margin: 0 auto;
    }
    
    /* 顶部个人信息 — 极简设计 */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10mm;
      padding-bottom: 6mm;
      border-bottom: 0.5pt solid #d2d2d7;
    }
    
    .header-info {
      flex: 1;
    }
    
    .name {
      font-size: 20pt;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: 1pt;
      margin-bottom: 2mm;
    }
    
    .job-target {
      font-size: 11pt;
      color: #0071e3;
      font-weight: 500;
      margin-bottom: 3mm;
      letter-spacing: 0.5pt;
    }
    
    .contact-line {
      font-size: 9pt;
      color: #86868b;
      line-height: 1.8;
    }
    
    .contact-line span {
      margin-right: 4mm;
    }
    
    /* 照片占位 */
    .photo-box {
      width: 26mm;
      height: 32mm;
      border: 0.5pt dashed #c7c7cc;
      border-radius: 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #c7c7cc;
      font-size: 8pt;
      margin-left: 5mm;
      flex-shrink: 0;
    }
    
    .photo-box .icon {
      font-size: 16pt;
      margin-bottom: 1mm;
    }
    
    /* 模块标题 — 蓝底白字 */
    .section {
      margin-bottom: 6mm;
    }
    
    .section-title {
      background: #0071e3;
      color: #fff;
      font-size: 10pt;
      font-weight: 600;
      padding: 1.5mm 4mm;
      margin-bottom: 3mm;
      letter-spacing: 0.5pt;
    }
    
    /* 经历条目 */
    .exp-item {
      margin-bottom: 3mm;
      padding-left: 2mm;
    }
    
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.5mm;
    }
    
    .exp-title {
      font-weight: 600;
      font-size: 10pt;
      color: #1d1d1f;
    }
    
    .exp-date {
      font-size: 8.5pt;
      color: #86868b;
      font-weight: 400;
    }
    
    .exp-subtitle {
      font-size: 9pt;
      color: #515154;
      margin-bottom: 1mm;
    }
    
    .exp-desc {
      font-size: 9.5pt;
      color: #515154;
      line-height: 1.6;
      text-align: justify;
    }
    
    /* 技能标签 */
    .skills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
    }
    
    .skill-tag {
      background: #f5f5f7;
      color: #1d1d1f;
      padding: 1mm 3mm;
      border-radius: 1mm;
      font-size: 9pt;
      border: 0.5pt solid #e8e8ed;
    }
    
    /* 页脚名言 */
    .footer-quote {
      margin-top: 8mm;
      padding-top: 4mm;
      border-top: 0.5pt solid #e8e8ed;
      text-align: center;
      font-size: 9pt;
      color: #86868b;
      font-style: italic;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="resume">
    <!-- 顶部个人信息 -->
    <div class="header">
      <div class="header-info">
        <div class="name">${name || '姓名'}</div>
        <div class="job-target">${targetJob || title || '求职意向'}</div>
        <div class="contact-line">
          ${contact ? contact.map(c => `<span>${c.value}</span>`).join('') : ''}
        </div>
      </div>
      <div class="photo-box">
        <div class="icon">👤</div>
        <div>一寸照</div>
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
            ${item.subtitle ? `<div class="exp-subtitle">${item.subtitle}</div>` : ''}
            ${item.description ? `<div class="exp-desc">${item.description}</div>` : ''}
          </div>
        `).join('') : ''}
        ${sec.type === 'skills' && sec.skillTags ? `
          <div class="skills-row">
            ${sec.skillTags.map(tag => `
              <span class="skill-tag">${tag.name}</span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('') : ''}
    
    <!-- 页脚名言 -->
    <div class="footer-quote">
      "Stay hungry, stay foolish." — 愿你以梦为马，不负韶华，在职业道路上持续精进。
    </div>
  </div>
</body>
</html>`;
}

// 解析简历文本为结构化数据 — 修复重复和切分BUG
export function parseResumeToStructured(text, targetJobName = '') {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // 提取姓名（第一行或包含姓名的行）
  let name = '';
  for (const line of lines.slice(0, 10)) {
    if (line && line.length < 15 && !line.includes('求职') && !line.includes('意向') 
        && !line.includes('电话') && !line.includes('邮箱') && !line.includes('地址')) {
      name = line;
      break;
    }
  }
  if (!name) name = '姓名';
  
  // 提取联系方式
  const contact = [];
  const seenTypes = new Set();
  for (const line of lines) {
    // 电话
    const phoneMatch = line.match(/(\d{3}[-\s]?\d{4}[-\s]?\d{4}|\d{11})/);
    if (phoneMatch && !seenTypes.has('phone')) {
      contact.push({ icon: '📱', value: phoneMatch[0], type: 'phone' });
      seenTypes.add('phone');
    }
    // 邮箱
    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch && !seenTypes.has('email')) {
      contact.push({ icon: '✉️', value: emailMatch[0], type: 'email' });
      seenTypes.add('email');
    }
    // 地址/籍贯
    if ((line.includes('地址') || line.includes('籍贯') || line.includes('居住地')) 
        && !seenTypes.has('address') && line.length < 50) {
      const addr = line.replace(/.*[:：]/, '').trim();
      if (addr && addr.length > 2) {
        contact.push({ icon: '📍', value: addr, type: 'address' });
        seenTypes.add('address');
      }
    }
    // 政治面貌
    if ((line.includes('党员') || line.includes('团员') || line.includes('群众')) 
        && line.length < 20 && !seenTypes.has('political')) {
      const political = line.match(/(中共党员|中共预备党员|共青团员|群众)/)?.[0];
      if (political) {
        contact.push({ icon: '⭐', value: political, type: 'political' });
        seenTypes.add('political');
      }
    }
    // 出生年月
    const birthMatch = line.match(/(\d{4}[年.\-/]\d{1,2})/);
    if (birthMatch && !seenTypes.has('birth') && line.length < 30) {
      contact.push({ icon: '🎂', value: birthMatch[0], type: 'birth' });
      seenTypes.add('birth');
    }
  }
  
  // 按类型排序联系方式
  const order = ['phone', 'email', 'birth', 'political', 'address'];
  contact.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  
  // 解析模块 — 修复重复BUG
  const sections = [];
  let currentSection = null;
  let currentItem = null;
  
  const sectionKeywords = {
    '教育背景': { title: '🎓 教育背景', type: 'education' },
    '教育经历': { title: '🎓 教育背景', type: 'education' },
    '学历': { title: '🎓 教育背景', type: 'education' },
    '学校': { title: '🎓 教育背景', type: 'education' },
    '荣誉奖项': { title: '🏆 荣誉奖项', type: 'honor' },
    '所获荣誉': { title: '🏆 荣誉奖项', type: 'honor' },
    '奖项': { title: '🏆 荣誉奖项', type: 'honor' },
    '证书': { title: '📜 证书资质', type: 'cert' },
    '专业技能': { title: '💡 专业技能', type: 'skills' },
    '技能': { title: '💡 专业技能', type: 'skills' },
    '技术栈': { title: '💡 专业技能', type: 'skills' },
    '工作经历': { title: '💼 工作经历', type: 'work' },
    '工作履历': { title: '💼 工作经历', type: 'work' },
    '实习经历': { title: '💼 实习经历', type: 'work' },
    '项目经验': { title: '🚀 项目经验', type: 'project' },
    '项目经历': { title: '🚀 项目经验', type: 'project' },
    '自我评价': { title: '📝 自我评价', type: 'evaluation' },
    '个人评价': { title: '📝 自我评价', type: 'evaluation' },
    '校园履历': { title: '🎓 校园履历', type: 'campus' }
  };
  
  function isSectionHeader(line) {
    for (const [kw, config] of Object.entries(sectionKeywords)) {
      if (line.includes(kw) && line.length < 20) return config;
    }
    return null;
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const secConfig = isSectionHeader(line);
    
    if (secConfig) {
      // 保存上一个模块
      if (currentSection) {
        if (currentItem) currentSection.items.push(currentItem);
        sections.push(currentSection);
      }
      currentSection = { title: secConfig.title, type: secConfig.type, items: [] };
      if (secConfig.type === 'skills') currentSection.skillTags = [];
      currentItem = null;
      continue;
    }
    
    if (!currentSection) continue;
    
    // 跳过空行和过短行
    if (line.length < 3) continue;
    
    // 检测是否是新条目标题（包含时间或序号）
    const isNewItem = /^\d+[.．、]/.test(line) || 
                      /\d{4}[.\-/]\d{1,2}/.test(line) ||
                      line.includes('：') || line.includes(':');
    
    if (isNewItem && currentSection.type !== 'skills' && currentSection.type !== 'evaluation') {
      if (currentItem) currentSection.items.push(currentItem);
      
      const parts = line.split(/[:：]/, 2);
      currentItem = {
        title: parts[0].trim(),
        subtitle: parts[1] ? parts[1].trim() : '',
        description: '',
        date: ''
      };
    } else if (currentItem && currentSection.type !== 'skills') {
      // 追加到当前条目的描述
      if (currentItem.description) {
        currentItem.description += ' ' + line;
      } else {
        currentItem.description = line;
      }
    } else if (currentSection.type === 'skills') {
      // 技能标签解析 — 修复切分BUG
      const skills = line.split(/[,，、;；]/).map(s => s.trim()).filter(s => s && s.length > 1 && s.length < 30);
      skills.forEach(s => {
        if (!currentSection.skillTags.find(tag => tag.name === s)) {
          currentSection.skillTags.push({ name: s });
        }
      });
    } else if (currentSection.type === 'evaluation') {
      // 自我评价 — 合并为一段
      if (!currentSection.items.length) {
        currentSection.items.push({ title: '', subtitle: '', description: line });
      } else {
        currentSection.items[0].description += ' ' + line;
      }
    }
  }
  
  // 保存最后一个
  if (currentSection) {
    if (currentItem) currentSection.items.push(currentItem);
    sections.push(currentSection);
  }
  
  // 清理重复描述（如果title和description相同）
  sections.forEach(sec => {
    sec.items.forEach(item => {
      if (item.description === item.title) {
        item.description = '';
      }
      // 清理机械STAR格式标记
      item.description = item.description
        .replace(/S（情境）：/g, '')
        .replace(/T（任务）：/g, '')
        .replace(/A（行动）：/g, '')
        .replace(/R（结果）：/g, '')
        .replace(/S\(情境\)：/g, '')
        .replace(/T\(任务\)：/g, '')
        .replace(/A\(行动\)：/g, '')
        .replace(/R\(结果\)：/g, '');
    });
  });
  
  return { name, title: targetJobName || '求职意向', contact, sections };
}
