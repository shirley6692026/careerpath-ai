// 专业简历PDF模板 v6 — 修复日期重复和位置错误BUG

export function generateResumeHTML(resumeData) {
  const { name, title, contact, sections, targetJob } = resumeData;
  
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
      flex: 1;
    }
    .exp-date {
      font-size: 8.5pt;
      color: #86868b;
      font-weight: 400;
      white-space: nowrap;
      margin-left: 3mm;
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
    
    ${sections ? sections.map(sec => `
      <div class="section">
        <div class="section-title">${sec.title}</div>
        ${sec.items ? sec.items.map(item => `
          <div class="exp-item">
            ${item.title || item.date ? `
            <div class="exp-header">
              ${item.title ? `<span class="exp-title">${item.title}</span>` : ''}
              ${item.date ? `<span class="exp-date">${item.date}</span>` : ''}
            </div>` : ''}
            ${item.subtitle ? `<div class="exp-subtitle">${item.subtitle}</div>` : ''}
            ${item.description ? `<div class="exp-desc">${item.description}</div>` : ''}
          </div>
        `).join('') : ''}
        ${sec.type === 'skills' && sec.skillTags ? `
          <div class="skills-row">
            ${sec.skillTags.map(tag => `<span class="skill-tag">${tag.name}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('') : ''}
    
    <div class="footer-quote">
      "Stay hungry, stay foolish." — 以梦为马，不负韶华，在职业道路上持续精进！
    </div>
  </div>
</body>
</html>`;
}

// 解析简历文本为结构化数据 — v6 修复日期重复BUG
export function parseResumeToStructured(text, targetJobName = '') {
  if (!text || !text.trim()) {
    return { name: '姓名', title: targetJobName || '求职意向', contact: [], sections: [] };
  }
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // ====== 提取姓名 ======
  let name = '';
  for (const line of lines.slice(0, 10)) {
    if (line.length >= 2 && line.length <= 12 && 
        !line.includes('求职') && !line.includes('意向') && 
        !line.includes('电话') && !line.includes('邮箱') &&
        !line.includes('：') && !line.includes(':') &&
        !line.startsWith('【') && !line.startsWith('[') &&
        !line.match(/\d{4}/)) {  // 排除包含年份的行
      name = line;
      break;
    }
  }
  if (!name) name = lines[0] || '姓名';
  
  // ====== 提取联系方式（只在前15行查找，避免提取到经历中的日期）======
  const contact = [];
  const seenTypes = new Set();
  
  for (const line of lines.slice(0, 15)) {
    // 电话
    const phoneMatch = line.match(/(\d{3}[-\s]?\d{4}[-\s]?\d{4}|\d{11})/);
    if (phoneMatch && !seenTypes.has('phone') && line.length < 50) {
      contact.push({ value: phoneMatch[0], type: 'phone' });
      seenTypes.add('phone');
    }
    // 邮箱
    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch && !seenTypes.has('email')) {
      contact.push({ value: emailMatch[0], type: 'email' });
      seenTypes.add('email');
    }
    // 地址/籍贯
    if ((line.includes('地址') || line.includes('籍贯')) && !seenTypes.has('address') && line.length < 50) {
      const addr = line.replace(/.*[:：]/, '').trim();
      if (addr && addr.length > 2) {
        contact.push({ value: addr, type: 'address' });
        seenTypes.add('address');
      }
    }
    // 政治面貌
    if ((line.includes('党员') || line.includes('团员')) && line.length < 20 && !seenTypes.has('political')) {
      const political = line.match(/(中共党员|中共预备党员|共青团员|群众)/)?.[0];
      if (political) {
        contact.push({ value: political, type: 'political' });
        seenTypes.add('political');
      }
    }
    // 出生年月
    const birthMatch = line.match(/(\d{4}[年.\-/]\d{1,2})/);
    if (birthMatch && !seenTypes.has('birth') && line.length < 30 && line.includes('出生')) {
      contact.push({ value: birthMatch[0], type: 'birth' });
      seenTypes.add('birth');
    }
  }
  
  // 按类型排序
  const order = ['phone', 'email', 'birth', 'political', 'address'];
  contact.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  
  // ====== 模块解析 ======
  const sections = [];
  
  const sectionMap = {
    '教育背景': { title: '🎓 教育背景', type: 'education' },
    '教育经历': { title: '🎓 教育背景', type: 'education' },
    '学历': { title: '🎓 教育背景', type: 'education' },
    '毕业学校': { title: '🎓 教育背景', type: 'education' },
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
    '毕业设计': { title: '🎓 毕业设计', type: 'graduation' },
    '校园履历': { title: '🎓 校园履历', type: 'campus' },
    '校园经历': { title: '🎓 校园履历', type: 'campus' },
    '自我评价': { title: '📝 自我评价', type: 'evaluation' },
    '个人评价': { title: '📝 自我评价', type: 'evaluation' },
    '个人总结': { title: '📝 自我评价', type: 'evaluation' }
  };
  
  function detectSection(line) {
    for (const [keyword, config] of Object.entries(sectionMap)) {
      if (line.includes(keyword) && line.length < 25) {
        return config;
      }
    }
    return null;
  }
  
  // 第一阶段：收集所有模块及其原始行
  const rawSections = [];
  let currentRaw = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const secConfig = detectSection(line);
    
    if (secConfig) {
      if (currentRaw) {
        rawSections.push(currentRaw);
      }
      currentRaw = {
        title: secConfig.title,
        type: secConfig.type,
        lines: []
      };
      continue;
    }
    
    if (line.length < 2) continue;
    // 跳过联系方式行（避免混入）
    if (line.includes('@') || (/\d{11}/.test(line) && line.length < 30)) continue;
    
    if (currentRaw) {
      currentRaw.lines.push(line);
    }
  }
  
  if (currentRaw) {
    rawSections.push(currentRaw);
  }
  
  // 第二阶段：解析每个模块
  for (const raw of rawSections) {
    const section = {
      title: raw.title,
      type: raw.type,
      items: []
    };
    
    if (raw.type === 'skills') {
      // 技能模块：整段保留
      section.skillTags = [];
      const allText = raw.lines.join(' ');
      const skills = allText.split(/[,，、;；]/).map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 25);
      skills.forEach(s => {
        section.skillTags.push({ name: s });
      });
      if (section.skillTags.length === 0 && raw.lines.length > 0) {
        section.items.push({
          title: '',
          subtitle: '',
          description: raw.lines.join('\n')
        });
      }
    } else if (raw.type === 'evaluation') {
      // 自我评价：合并为一段
      if (raw.lines.length > 0) {
        section.items.push({
          title: '',
          subtitle: '',
          description: raw.lines.join(' ')
        });
      }
    } else {
      // 其他模块：按条目解析
      let currentItem = null;
      
      for (const line of raw.lines) {
        // 检测是否是新条目标题（有编号或明确分隔）
        const isNewItem = /^\d+[.．、\s]/.test(line) || 
                         (line.includes('：') && line.length < 50) ||
                         (line.includes(':') && line.length < 50);
        
        // 检测是否包含日期（如 "2021.9 - 2025.6"）
        const hasDate = /\d{4}[.\-/]\d{1,2}/.test(line);
        
        if (isNewItem || (hasDate && line.length < 60)) {
          // 保存上一个条目
          if (currentItem) {
            section.items.push(currentItem);
          }
          
          // 解析新条目
          const parts = line.split(/[:：]/, 2);
          const titlePart = parts[0].trim();
          const descPart = parts[1] ? parts[1].trim() : '';
          
          // 从标题中提取日期
          const dateMatch = titlePart.match(/(\d{4}[.\-/]\d{1,2}[\s~\-–—]+\d{4}[.\-/]\d{1,2}|\d{4}[.\-/]\d{1,2})/);
          const extractedDate = dateMatch ? dateMatch[0] : '';
          
          // 清理标题中的日期
          let cleanTitle = titlePart.replace(/\d{4}[.\-/]\d{1,2}[\s~\-–—]+\d{4}[.\-/]\d{1,2}/, '')
                                    .replace(/\d{4}[.\-/]\d{1,2}/, '')
                                    .replace(/^\d+[.．、\s]+/, '')
                                    .trim();
          
          currentItem = {
            title: cleanTitle || titlePart,
            subtitle: descPart,
            description: '',
            date: extractedDate
          };
        } else if (currentItem) {
          // 追加到当前条目的描述
          if (currentItem.description) {
            currentItem.description += ' ' + line;
          } else {
            currentItem.description = line;
          }
        } else {
          // 没有当前条目，创建一个新条目
          currentItem = {
            title: line,
            subtitle: '',
            description: '',
            date: ''
          };
        }
      }
      
      if (currentItem) {
        section.items.push(currentItem);
      }
    }
    
    sections.push(section);
  }
  
  // 第三阶段：清理数据
  sections.forEach(sec => {
    sec.items.forEach(item => {
      // 如果title和description完全相同，清空description
      if (item.description === item.title) {
        item.description = '';
      }
      // 清理机械STAR标记
      if (item.description) {
        item.description = item.description
          .replace(/S[（(]情境[）)][:：]?\s*/g, '')
          .replace(/T[（(]任务[）)][:：]?\s*/g, '')
          .replace(/A[（(]行动[）)][:：]?\s*/g, '')
          .replace(/R[（(]结果[）)][:：]?\s*/g, '');
      }
      // 如果title为空但subtitle有内容，把subtitle移到title
      if (!item.title && item.subtitle) {
        item.title = item.subtitle;
        item.subtitle = '';
      }
    });
  });
  
  return { name, title: targetJobName || '求职意向', contact, sections };
}
