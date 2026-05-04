// JD翻译官 - 最简测试版
import { useState } from 'react';

export default function JDTranslator() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const analyze = () => {
    setResult({
      company: '测试公司',
      position: '前端工程师',
      salary: '15-25K'
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📄 JD 翻译官</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴职位描述..."
        style={{ width: '100%', height: '100px', padding: '10px' }}
      />
      <button onClick={analyze} style={{ marginTop: '10px', padding: '10px 20px' }}>
        分析
      </button>
      {result && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0' }}>
          <p>公司: {result.company}</p>
          <p>职位: {result.position}</p>
          <p>薪资: {result.salary}</p>
        </div>
      )}
    </div>
  );
}
