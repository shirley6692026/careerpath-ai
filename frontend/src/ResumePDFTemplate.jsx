// 专业简历PDF模板 v9 — 修复实习经历日期位置

export function generateResumeHTML(resumeData, templateStyle = "blue") {
  const styleConfig = {
    blue: { primary: "#2B5C9E", secondary: "#7EB8F0", bg: "linear-gradient(135deg, #2B5C9E 0%, #1A3F6E 50%, #0F2B4F 100%)" },
    green: { primary: "#2E7D32", secondary: "#A5D6A7", bg: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 50%, #0D3B10 100%)" },
    purple: { primary: "#6A1B9A", secondary: "#CE93D8", bg: "linear-gradient(135deg, #6A1B9A 0%, #4A148C 50%, #2E0B5E 100%)" },
    dark: { primary: "#263238", secondary: "#90A4AE", bg: "linear-gradient(135deg, #263238 0%, #1C252A 50%, #12191C 100%)" },
  };
  const style = styleConfig[templateStyle] || styleConfig.blue;
  const { name, title, contact, sections, targetJob, skillScores } = resumeData;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${name || '简历'}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 10pt;
      line-height: 1.7;
      color: #2A2A3C;
      background: #fff;
      -webkit-font-smoothing: antialiased;
    }
    .resume {
      max-width: 180mm;
      margin: 0 auto;
    }
    .section {
      margin-bottom: 5mm;
      padding: 0 1mm;
    }
    .exp-item {
      margin-bottom: 3mm;
      padding-left: 2mm;
      
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8mm;
      padding: 6mm 4mm;
      background: ${style.bg};
      border-radius: 2mm;
      color: #fff;
    }
    .header-info {
      flex: 1;
    }
    .name {
      font-size: 22pt;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 2pt;
      margin-bottom: 2mm;
    }
    .job-target {
      font-size: 11pt;
      color: ${style.secondary};
      font-weight: 500;
      margin-bottom: 2mm;
      letter-spacing: 0.8pt;
    }
    .contact-line {
      font-size: 9pt;
      color: #B0C8E8;
      line-height: 1.8;
    }
    .contact-line span {
      margin-right: 4mm;
    }
    .photo-box {
      width: 26mm;
      height: 32mm;
      border: 1.5pt solid rgba(255,255,255,0.3);
      border-radius: 3mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.5);
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
      page-break-inside: avoid;
    }
    .section-title {
      background: ${style.secondary};
      color: #1A3F6E;
      font-size: 10pt;
      font-weight: 700;
      padding: 2mm 4mm;
      margin-bottom: 4mm;
      letter-spacing: 0.5pt;
      border-radius: 2mm;
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
      color: #2A2A3C;
      flex: 1;
    }
    .exp-title-normal {
      font-weight: normal;
      font-size: 10pt;
      color: #2A2A3C;
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
      color: #3A3A4A;
      margin-bottom: 1mm;
    }
    .exp-desc {
      font-size: 9.5pt;
      color: #3A3A4A;
      line-height: 1.7;
      text-align: justify;
      text-justify: inter-ideograph;
    }
    .skills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
    }
    .skill-tag {
      background: #f5f5f7;
      color: #2A2A3C;
      padding: 1mm 3mm;
      border-radius: 1mm;
      font-size: 9pt;
      border: 0.5pt solid #D0D8E8;
    }
    .skill-bar-row {
      display: flex;
      align-items: center;
      margin-bottom: 1.5mm;
    }
    .skill-bar-label {
      font-size: 9pt;
      color: #2A2A3C;
      width: 30mm;
      flex-shrink: 0;
    }
    .skill-bar-track {
      flex: 1;
      height: 3mm;
      background: #E8F0FE;
      border-radius: 1.5mm;
      overflow: hidden;
      margin: 0 3mm;
    }
    .skill-bar-fill {
      height: 100%;
      background: ${style.primary};
      border-radius: 1.5mm;
      transition: width 0.3s;
    }
    .skill-bar-score {
      font-size: 8.5pt;
      color: #86868b;
      width: 8mm;
      text-align: right;
      flex-shrink: 0;
    }
    .footer-quote {
      margin-top: 8mm;
      padding-top: 4mm;
      border-top: 1pt solid #2B5C9E;
      text-align: center;
      font-size: 9pt;
      color: #8A8AAA;
      font-style: italic;
      letter-spacing: 0.3pt;
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
              ${item.date ? `<span class="exp-date">${item.date}</span>` : ''}
              ${item.title ? `<span class="${item.titleBold === false ? 'exp-title-normal' : 'exp-title'}">${item.title}</span>` : ''}
            </div>` : ''}
            ${item.subtitle ? `<div class="exp-subtitle">${item.subtitle}</div>` : ''}
            ${item.description ? `<div class="exp-desc">${item.description}</div>` : ''}
          </div>
        `).join('') : ''}
        ${sec.type === 'skills' && sec.skillTags ? `
          ${skillScores && Object.keys(skillScores).length > 0 ? `
            <div class="skills-row" style="flex-direction:column;gap:0">
              ${sec.skillTags.map(tag => {
                const score = skillScores[tag.name];
                if (score !== undefined) {
                  return `<div class="skill-bar-row">
                    <span class="skill-bar-label">${tag.name}</span>
                    <div class="skill-bar-track">
                      <div class="skill-bar-fill" style="width:${score * 10}%"></div>
                    </div>
                    <span class="skill-bar-score">${score}/10</span>
                  </div>`;
                }
                return `<span class="skill-tag">${tag.name}</span>`;
              }).join('')}
            </div>
          ` : `
            <div class="skills-row">
              ${sec.skillTags.map(tag => `<span class="skill-tag">${tag.name}</span>`).join('')}
            </div>
          `}
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

// 解析简历文本为结构化数据 — v9 修复实习经历日期位置
export function parseResumeToStructured(text, targetJobName = '') {
  if (!text || !text.trim()) {
    return { name: '姓名', title: targetJobName || '求职意向', contact: [], sections: [] };
  }
  
  // 清理markdown语法和特殊字符
  text = text
    .replace(/\*\*(.+?)\*\*/g, '$1')      // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')              // *italic* → italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '')          // 移除代码块
    .replace(/^>\s*/gm, '')                     // >引用 移除
    .replace(/^#{1,6}\s*/gm, '')               // #标题 移除
    .replace(/\|.+?\|/g, '')                   // 表格行 移除
    .replace(/[┌─┐└┘│├┬┴┼]/g, '')              // 框线字符 移除
    .replace(/^[-]{3,}$/gm, '')                  // ---分割线 移除
    .replace(/^[\*]{3,}$/gm, '')                // ***分割线 移除
    .replace(/Page\s*\d+/gi, '')               // Page 1, Page 2 移除
    .replace(/\n{3,}/g, '\n\n')               // 合并多余空行
    .trim();
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // ====== 提取姓名 ======
  let name = '';
  for (const line of lines.slice(0, 10)) {
    if (line.length >= 2 && line.length <= 12 && 
        !line.includes('求职') && !line.includes('意向') && 
        !line.includes('电话') && !line.includes('邮箱') &&
        !line.includes('：') && !line.includes(':') &&
        !line.startsWith('【') && !line.startsWith('[') &&
        !line.match(/^\d{4}/)) {
      name = line;
      break;
    }
  }
  if (!name) name = lines[0] || '姓名';
  
  // ====== 提取联系方式（只在前15行查找）======
  const contact = [];
  const seenTypes = new Set();
  
  for (const line of lines.slice(0, 15)) {
    const phoneMatch = line.match(/(\d{3}[-\s]?\d{4}[-\s]?\d{4}|\d{11})/);
    if (phoneMatch && !seenTypes.has('phone') && line.length < 50) {
      contact.push({ value: phoneMatch[0], type: 'phone' });
      seenTypes.add('phone');
    }
    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch && !seenTypes.has('email')) {
      contact.push({ value: emailMatch[0], type: 'email' });
      seenTypes.add('email');
    }
    if ((line.includes('地址') || line.includes('籍贯')) && !seenTypes.has('address') && line.length < 50) {
      const addr = line.replace(/.*[:：]/, '').trim();
      if (addr && addr.length > 2) {
        contact.push({ value: addr, type: 'address' });
        seenTypes.add('address');
      }
    }
    if ((line.includes('党员') || line.includes('团员')) && line.length < 20 && !seenTypes.has('political')) {
      const political = line.match(/(中共党员|中共预备党员|共青团员|群众)/)?.[0];
      if (political) {
        contact.push({ value: political, type: 'political' });
        seenTypes.add('political');
      }
    }
    const birthMatch = line.match(/(\d{4}[年.\-/]\d{1,2})/);
    if (birthMatch && !seenTypes.has('birth') && line.length < 30 && line.includes('出生')) {
      contact.push({ value: birthMatch[0], type: 'birth' });
      seenTypes.add('birth');
    }
  }
  
  const order = ['phone', 'email', 'birth', 'political', 'address'];
  contact.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  
  // ====== 模块解析 ======
  const sections = [];
  
  const sectionMap = {
    '个人信息': { title: '👤 个人信息', type: 'personal' },
    '个人简介': { title: '👤 个人信息', type: 'personal' },
    '基本资料': { title: '👤 个人信息', type: 'personal' },
    '求职意向': { title: '👤 个人信息', type: 'personal' },
    '求职目标': { title: '👤 个人信息', type: 'personal' },
    '职业定位': { title: '👤 个人信息', type: 'personal' },
    '教育背景': { title: '🎓 教育背景', type: 'education' },
    '教育经历': { title: '🎓 教育背景', type: 'education' },
    '毕业学校': { title: '🎓 教育背景', type: 'education' },
    '荣誉奖项': { title: '🏆 荣誉奖项', type: 'honor' },
    '所获荣誉': { title: '🏆 荣誉奖项', type: 'honor' },
    '专业认证': { title: '🏆 荣誉奖项', type: 'honor' },
    '奖项': { title: '🏆 荣誉奖项', type: 'honor' },
    '获得荣誉': { title: '🏆 荣誉奖项', type: 'honor' },
    
    '专业技能': { title: '💡 专业技能', type: 'skills' },
    '技能特长': { title: '💡 专业技能', type: 'skills' },
    '职业技能': { title: '💡 专业技能', type: 'skills' },
    '核心技能': { title: '💡 专业技能', type: 'skills' },
    '技术栈': { title: '💡 专业技能', type: 'skills' },
    '技能特长': { title: '💡 专业技能', type: 'skills' },
    '工作经历': { title: '💼 工作经历', type: 'work' },
    '工作履历': { title: '💼 工作经历', type: 'work' },
    '工作背景': { title: '💼 工作经历', type: 'work' },
    '主要经历': { title: '💼 工作经历', type: 'work' },
    '从业经历': { title: '💼 工作经历', type: 'work' },
    '实习经历': { title: '💼 实习经历', type: 'work' },
    '工作经验': { title: '💼 工作经历', type: 'work' },
    '项目经验': { title: '🚀 项目经验', type: 'project' },
    '项目经历': { title: '🚀 项目经验', type: 'project' },
    '自我评价': { title: '📝 自我评价', type: 'evaluation' },
    '个人评价': { title: '📝 自我评价', type: 'evaluation' },
    '个人优势': { title: '📝 自我评价', type: 'evaluation' },
    '个人特点': { title: '📝 自我评价', type: 'evaluation' },
    '综合描述': { title: '📝 自我评价', type: 'evaluation' },
    '个人总结': { title: '📝 自我评价', type: 'evaluation' },
    '自我总结': { title: '📝 自我评价', type: 'evaluation' }
  };
  
  function cleanSectionLine(line) {
    // 去掉markdown标题标记、emoji、冒号
    return line.replace(/^##?\s*/, '').replace(/[:：]/g, '').replace(/[\ud800-\udfff]/g, '').trim();
  }
  
  function detectSection(line) {
    const cleaned = cleanSectionLine(line);
    for (const [keyword, config] of Object.entries(sectionMap)) {
      // 关键词在行首20字内，排除"最近/最高/目前"前缀
      const exclPrefixes = ['最近', '最高', '目前'];
      if (exclPrefixes.some(p => cleaned.startsWith(p))) return null;
      if (cleaned.startsWith(keyword) && cleaned.length < 80) {
        return config;
      }
    }
    return null;
  }
  
  // 收集所有模块及其原始行
  const rawSections = [];
  let currentRaw = null;
  let headerLines = [];  // 第一个section之前的行，作为个人信息
  let firstSectionFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const secConfig = detectSection(line);
    
    if (secConfig) {
      if (!firstSectionFound) {
        firstSectionFound = true;
        // 如果之前收集了headerLines，合并到当前检测到的第一个section
        // 这样个人信息和第一个section（如自我评价）的数据不会丢失
        // 但如果第一个section本身就是'个人信息'，则合并到同一个section，避免重复
        if (headerLines.length > 0) {
          if (secConfig.title === '👤 个人信息') {
            // 第一个section就是个人信息，把headerLines放到当前section的lines前面
            currentRaw = {
              title: secConfig.title,
              type: secConfig.type,
              lines: [...headerLines, line]
            };
            continue;  // Skip the normal currentRaw creation below
          } else {
            // 创建一个个人信息section来承载headerLines
            rawSections.push({
              title: '👤 个人信息',
              type: 'personal',
              lines: [...headerLines]
            });
          }
        }
      }
      if (currentRaw) {
        rawSections.push(currentRaw);
      }
      // Only create new currentRaw if we didn't already create it in the firstSectionFound block above
      // (which happens when first section is '个人信息' and headerLines exist)
      if (!(firstSectionFound && headerLines.length > 0 && secConfig.title === '👤 个人信息')) {
        currentRaw = {
          title: secConfig.title,
          type: secConfig.type,
          lines: [line]
        };
      }
      continue;
    }
    
    if (line.length < 2) continue;
    if (line.includes('@') || (/\d{11}/.test(line) && line.length < 30)) continue;
    
    if (!firstSectionFound) {
      // 收集第一个section前的行（个人信息）
      if (line.length < 80 && !line.match(/^[\d\s\-—.]+$/)) {
        headerLines.push(line);
      }
    } else if (currentRaw) {
      currentRaw.lines.push(line);
    }
  }
  
  if (currentRaw) {
    rawSections.push(currentRaw);
  }
  
  // 解析每个模块
  for (const raw of rawSections) {
    const section = {
      title: raw.title,
      type: raw.type,
      items: []
    };
    
    if (raw.type === 'skills') {
      section.skillTags = [];
      const allText = raw.lines.join(' ');
      // 同时支持逗号/顿号/分号/换行分割
      const skills = allText.split(/[,，、;；\n]/).map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 30);
      skills.forEach(s => {
        if (!section.skillTags.find(tag => tag.name === s)) {
          section.skillTags.push({ name: s });
        }
      });
      if (section.skillTags.length === 0 && raw.lines.length > 0) {
        section.items.push({
          title: '',
          subtitle: '',
          description: raw.lines.join('\n')
        });
      }
    } else if (raw.type === 'evaluation') {
      if (raw.lines.length > 0) {
        section.items.push({
          title: '',
          subtitle: '',
          description: raw.lines.join(' ')
        });
      }
    } else if (raw.type === 'graduation' || raw.type === 'campus') {
      if (raw.lines.length > 0) {
        section.items.push({
          title: '',
          subtitle: '',
          description: raw.lines.join(' '),
          titleBold: false
        });
      }
    } else if (raw.type === 'work') {
      // 实习经历：每行独立处理，提取日期到头部
      let pendingDate = '';  // 缓存上一行提取到的日期，用于日期和标题分两行的场景
      for (const line of raw.lines) {
        // 尝试提取日期（多种格式）
        // 格式1: "2023.07.10 - 2023.08.23，在相关车企..."
        // 格式2: "1. 2023.07.10 - 2023.08.23，在相关车企..."
        // 格式3: "2023.07-2023.08 在相关车企..."
        
        let date = '';
        let rest = line;
        
        // 先移除开头的编号
        const numberPrefix = line.match(/^(\d+[.．、\s]+)/);
        if (numberPrefix) {
          rest = line.substring(numberPrefix[0].length);
        }
        
        // 提取日期（支持 2023.07.10 - 2023.08.23 或 2023.07-2023.08）
        const dateMatch = rest.match(/^(\d{4}[.\-/]\d{1,2}(?:[.\-/]\d{1,2})?[\s~\-–—]+\d{4}[.\-/]\d{1,2}(?:[.\-/]\d{1,2})?)/);
        if (dateMatch) {
          date = dateMatch[1];
          rest = rest.substring(date.length).replace(/^[,，\s]+/, '');
        }
        
        // 分割标题和描述（以第一个句号、逗号、分号或感叹号）
        let title = '';
        let description = '';
        
        // 找第一个句子结束标记
        const sentenceEnd = rest.search(/[。！；;]/);
        if (sentenceEnd > 0) {
          title = rest.substring(0, sentenceEnd).trim();
          description = rest.substring(sentenceEnd + 1).replace(/^[。！；;\s]+/, '').trim();
        } else {
          // 没有句子结束标记，整句作为标题
          title = rest.trim();
        }
        
        // 如果这一行只有日期没有内容，缓存日期给下一行
        if (date && !rest.trim()) {
          pendingDate = date;
          continue;
        }
        // 如果有缓存的日期且当前行没有日期，使用缓存的日期
        if (pendingDate && !date) {
          date = pendingDate;
          pendingDate = '';
        }
        
        section.items.push({
          title: title,
          subtitle: '',
          description: description,
          date: date,
          titleBold: false
        });
      }
    } else {
      // 其他模块（教育背景、荣誉等）
      let currentItem = null;
      
      for (const line of raw.lines) {
        const datePrefixMatch = line.match(/^(\d{4}[.\-/]\d{1,2}(?:[.\-/]\d{1,2})?[\s~\-–—]+\d{4}[.\-/]\d{1,2}(?:[.\-/]\d{1,2})?)[,，\s]+(.+)/);
        const numberPrefixMatch = line.match(/^(\d+[.．、\s]+)(.+)/);
        const colonParts = line.split(/[:：]/, 2);
        
        let isNewItem = false;
        let extractedDate = '';
        let itemTitle = '';
        let itemDesc = '';
        
        if (datePrefixMatch) {
          isNewItem = true;
          extractedDate = datePrefixMatch[1];
          const rest = datePrefixMatch[2];
          const restParts = rest.split(/[。！]/, 2);
          itemTitle = restParts[0].trim();
          itemDesc = restParts[1] ? restParts[1].trim() : '';
        } else if (numberPrefixMatch && line.length < 80) {
          isNewItem = true;
          itemTitle = numberPrefixMatch[2].trim();
        } else if (colonParts.length === 2 && colonParts[0].length < 40) {
          isNewItem = true;
          itemTitle = colonParts[0].trim();
          itemDesc = colonParts[1].trim();
        }
        
        if (isNewItem) {
          if (currentItem) {
            section.items.push(currentItem);
          }
          
          currentItem = {
            title: itemTitle,
            subtitle: '',
            description: itemDesc,
            date: extractedDate,
            titleBold: true
          };
        } else if (currentItem) {
          if (currentItem.description) {
            currentItem.description += ' ' + line;
          } else {
            currentItem.description = line;
          }
        } else {
          currentItem = {
            title: line,
            subtitle: '',
            description: '',
            date: '',
            titleBold: true
          };
        }
      }
      
      if (currentItem) {
        section.items.push(currentItem);
      }
    }
    
    sections.push(section);
  }
  
  // 清理数据
  sections.forEach(sec => {
    sec.items.forEach(item => {
      if (item.description === item.title) {
        item.description = '';
      }
      if (item.description) {
        item.description = item.description
          .replace(/S[（(]情境[）)][:：]?\s*/g, '')
          .replace(/T[（(]任务[）)][:：]?\s*/g, '')
          .replace(/A[（(]行动[）)][:：]?\s*/g, '')
          .replace(/R[（(]结果[）)][:：]?\s*/g, '');
      }
      if (!item.title && item.subtitle) {
        item.title = item.subtitle;
        item.subtitle = '';
      }
      item.title = item.title.replace(/^[，,、；;\s]+/, '').trim();
    });
  });
  
  return { name, title: targetJobName || '求职意向', contact, sections };
}
