import { useState } from 'react';
import { useAppContext } from './context/AppContext';
import { generateResumeHTML } from './ResumePDFTemplate';

// HAIC教练轻量版 v1.0
// Human-AI Collaboration Index 人机协作指数评估

const HAIC_DIMENSIONS = [
  {
    id: 'ai_cognition',
    name: 'AI认知力',
    weight: 20,
    icon: '🧠',
    color: '#3B82F6',
    description: '理解AI的能力边界和适用场景',
    question: '能否判断AI适合/不适合做什么',
    examples: ['知道AI擅长数据分析但不擅长情感判断', '能选择正确的AI工具解决特定问题']
  },
  {
    id: 'prompt_engineering',
    name: '提示工程力',
    weight: 20,
    icon: '💬',
    color: '#8B5CF6',
    description: '有效构建prompt获取高质量输出',
    question: '能否用清晰指令让AI完成任务',
    examples: ['会写结构化prompt', '知道如何迭代优化提示词']
  },
  {
    id: 'workflow_reconstruction',
    name: '工作流重构力',
    weight: 25,
    icon: '⚙️',
    color: '#10B981',
    description: '将工作拆分为"人可做"和"AI可做"',
    question: '能否识别工作流中可AI化的环节',
    examples: ['能把复杂任务拆解给AI和人协作', '会设计人机协作流程']
  },
  {
    id: 'quality_judgment',
    name: '质量判断力',
    weight: 20,
    icon: '🔍',
    color: '#F59E0B',
    description: '识别AI输出的幻觉和偏差',
    question: '能否判断AI输出是否准确可靠',
    examples: ['能发现AI生成内容中的错误', '会验证AI提供的数据和事实']
  },
  {
    id: 'ethical_decision',
    name: '伦理决策力',
    weight: 15,
    icon: '⚖️',
    color: '#EF4444',
    description: '在AI辅助下做出负责任的决策',
    question: '能否平衡效率和伦理风险',
    examples: ['了解AI偏见和公平性问题', '会在效率和隐私间做平衡']
  }
];

const SAMPLE_QUESTIONS = {
  ai_cognition: [
    {
      question: '以下哪个任务AI目前做得最好？',
      options: ['写一封充满情感的道歉信', '分析10万条用户评论的情感倾向', '创作一首原创诗歌', '进行心理咨询'],
      correct: 1,
      explanation: 'AI擅长大规模数据分析，但不擅长真正的情感理解和创造性表达'
    },
    {
      question: '当你需要完成一份市场研究报告，你会：',
      options: ['完全依赖AI生成', '自己写不让AI参与', '用AI收集数据，自己分析结论', '让AI写，自己只改格式'],
      correct: 2,
      explanation: '最佳实践是AI辅助数据收集，人类负责分析和判断'
    },
    {
      question: 'AI生成内容出现"幻觉"是指：',
      options: ['AI产生了视觉幻觉', 'AI生成了看似合理但实际错误的信息', 'AI运行速度变慢', 'AI拒绝回答问题'],
      correct: 1,
      explanation: '"幻觉"是AI生成虚假但看似合理的信息的现象'
    },
    {
      question: '在求职场景中，AI最适合帮你：',
      options: ['决定你的职业方向', '优化简历关键词匹配', '替你参加面试', '选择人生伴侣'],
      correct: 1,
      explanation: 'AI擅长优化和匹配，但重大人生决策需要人类判断'
    }
  ],
  prompt_engineering: [
    {
      question: '一个好的prompt应该包含：',
      options: ['尽量简短，让AI自由发挥', '详细说明背景、任务、格式和约束', '只写关键词', '用代码写prompt'],
      correct: 1,
      explanation: '结构化prompt包含背景、任务、格式、约束四要素'
    },
    {
      question: '当AI输出不符合预期时，你应该：',
      options: ['换一个大模型', '放弃使用AI', '优化prompt并迭代', '抱怨AI不够智能'],
      correct: 2,
      explanation: '提示工程的核心是迭代优化，而非更换工具'
    },
    {
      question: '"Few-shot prompting"是指：',
      options: ['用少量示例引导AI输出格式', '快速连续提问', '只用5个单词提问', '让AI少说话'],
      correct: 0,
      explanation: 'Few-shot是通过提供示例让AI理解期望的输出格式'
    },
    {
      question: '在简历优化场景中，最有效的prompt策略是：',
      options: ['"帮我优化简历"', '"你是一位HR专家，请针对[岗位JD]优化这份简历，突出匹配的关键词，量化成果"', '"写一份更好的简历"', '"让简历看起来厉害"'],
      correct: 1,
      explanation: '具体角色+明确任务+相关上下文=高质量输出'
    }
  ],
  workflow_reconstruction: [
    {
      question: '你接到一个"分析竞品并制作PPT"的任务，最佳分工是：',
      options: ['全部自己做', '全部交给AI', 'AI收集数据→自己分析→AI制作PPT→自己审核', '让AI做，自己打游戏'],
      correct: 2,
      explanation: '人机协作：AI处理信息收集和格式化，人类负责分析和决策'
    },
    {
      question: '以下哪个环节最不适合AI自动化？',
      options: ['数据清洗', '创意头脑风暴', '邮件分类', '代码格式化'],
      correct: 1,
      explanation: '创意头脑风暴需要人类独特的联想和创新能力'
    },
    {
      question: '设计人机协作流程时，原则是：',
      options: ['让AI做所有事', '人做决策，AI做执行', '根据任务特性分配', '谁快谁做'],
      correct: 2,
      explanation: '最佳实践是根据任务特性（创造性/重复性/决策性）分配'
    },
    {
      question: '在求职准备中，AI可以帮你：',
      options: ['决定你的职业价值观', '模拟面试练习', '替你选择offer', '规划你的人生'],
      correct: 1,
      explanation: 'AI适合模拟练习和准备，价值观和人生决策属于人类'
    }
  ],
  quality_judgment: [
    {
      question: 'AI告诉你"Python是1991年由Guido van Rossum创建的"，你应该：',
      options: ['直接相信，写进简历', '查证权威来源再使用', '让AI再确认一遍', '不相信任何AI说的'],
      correct: 1,
      explanation: '关键信息需要查证，这是质量判断力的核心'
    },
    {
      question: 'AI生成的简历优化建议中，你发现它：',
      options: ['全部接受', '全部拒绝', '评估每条建议的合理性和真实性', '只接受看起来高级的'],
      correct: 2,
      explanation: '批判性评估AI建议，不盲从也不全盘否定'
    },
    {
      question: 'AI说"根据最新研究，90%的HR使用AI筛选简历"，你：',
      options: ['直接引用这个数据', '搜索原始研究出处', '改成"很多HR"', '不care'],
      correct: 1,
      explanation: '对AI提供的统计数据要溯源验证'
    },
    {
      question: 'AI生成的代码有bug，但看起来能运行：',
      options: ['直接部署到生产环境', '测试所有边界情况', '让AI自己检查', '祈祷不出问题'],
      correct: 1,
      explanation: 'AI代码需要人类测试和验证，尤其是边界情况'
    }
  ],
  ethical_decision: [
    {
      question: '使用AI优化简历时，伦理边界是：',
      options: ['AI写什么就用什么', '不虚构经历和技能', '让AI编造项目经验', '夸大成果数字'],
      correct: 1,
      explanation: '真实性是底线，AI优化不等于虚构'
    },
    {
      question: '你发现AI在筛选简历时对某些学校有偏见：',
      options: ['不管，反正对我有利', '向平台反馈并要求修正', '利用这个偏见', '换一家平台'],
      correct: 1,
      explanation: '发现和纠正AI偏见是伦理决策力的体现'
    },
    {
      question: 'AI建议你在简历中隐藏年龄信息以避免歧视：',
      options: ['照做，这是聪明的做法', '拒绝，坚持真实透明', '评估具体情况后决定', '让AI替你决定'],
      correct: 2,
      explanation: '需要权衡真实性和现实考量，做出负责任的决定'
    },
    {
      question: '在使用AI求职工具时，你的数据隐私策略应该是：',
      options: ['毫无保留地分享所有数据', '了解平台如何使用数据并控制分享范围', '完全不使用AI工具', '用假身份使用'],
      correct: 1,
      explanation: '知情同意和数据最小化是负责任的AI使用原则'
    }
  ]
};

export default function HAICCoach() {
  const [step, setStep] = useState('intro'); // intro | assessment | result
  const [currentDim, setCurrentDim] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  
  const { updateUserProfile } = useAppContext();

  const startAssessment = () => {
    setStep('assessment');
    setCurrentDim(0);
    setCurrentQ(0);
    setAnswers({});
    setScores({});
  };

  const handleAnswer = (optionIndex) => {
    const dim = HAIC_DIMENSIONS[currentDim].id;
    const q = SAMPLE_QUESTIONS[dim][currentQ];
    const isCorrect = optionIndex === q.correct;
    
    setSelectedOption(optionIndex);
    setShowExplanation(true);
    
    setAnswers(prev => ({
      ...prev,
      [`${dim}_${currentQ}`]: { selected: optionIndex, correct: isCorrect }
    }));
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    setSelectedOption(null);
    
    const dim = HAIC_DIMENSIONS[currentDim].id;
    const questions = SAMPLE_QUESTIONS[dim];
    
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else if (currentDim < HAIC_DIMENSIONS.length - 1) {
      // Calculate dimension score
      const dimAnswers = Object.entries(answers)
        .filter(([k]) => k.startsWith(dim))
        .map(([, v]) => v.correct ? 1 : 0);
      const dimScore = Math.round((dimAnswers.reduce((a, b) => a + b, 0) / questions.length) * 100);
      
      setScores(prev => ({ ...prev, [dim]: dimScore }));
      setCurrentDim(currentDim + 1);
      setCurrentQ(0);
    } else {
      // Calculate final dimension score
      const dimAnswers = Object.entries(answers)
        .filter(([k]) => k.startsWith(dim))
        .map(([, v]) => v.correct ? 1 : 0);
      const dimScore = Math.round((dimAnswers.reduce((a, b) => a + b, 0) / questions.length) * 100);
      setScores(prev => ({ ...prev, [dim]: dimScore }));
      
      // Calculate total score
      const totalScore = Math.round(
        HAIC_DIMENSIONS.reduce((sum, d) => {
          const s = scores[d.id] || dimScore;
          return sum + (s * d.weight / 100);
        }, 0)
      );
      
      setScores(prev => ({ ...prev, total: totalScore }));
      setStep('result');
      
      // Save to global state
      updateUserProfile({ haicScore: { ...scores, total: totalScore } });
    }
  };

  const getLevel = (score) => {
    if (score >= 81) return { level: 'L5 大师', desc: '能指导他人进行人机协作', color: '#8B5CF6' };
    if (score >= 61) return { level: 'L4 精通', desc: '能设计人机协作流程', color: '#3B82F6' };
    if (score >= 41) return { level: 'L3 熟练', desc: '能有效整合AI到工作流中', color: '#10B981' };
    if (score >= 21) return { level: 'L2 熟悉', desc: '能使用常见AI工具完成简单任务', color: '#F59E0B' };
    return { level: 'L1 基础', desc: '能用AI聊天，但不会系统使用', color: '#EF4444' };
  };

  const generateCertificate = () => {
    const totalScore = scores.total || 0;
    const level = getLevel(totalScore);
    
    const certData = {
      name: '用户',
      score: totalScore,
      level: level.level,
      date: new Date().toLocaleDateString('zh-CN'),
      dimensions: HAIC_DIMENSIONS.map(d => ({
        name: d.name,
        score: scores[d.id] || 0,
        weight: d.weight
      }))
    };
    
    // Generate certificate HTML
    const certHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HAIC能力证书</title>
  <style>
    body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    .cert { width: 800px; margin: 0 auto; padding: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 20px; }
    .title { font-size: 36px; text-align: center; margin-bottom: 30px; }
    .score { font-size: 72px; text-align: center; margin: 20px 0; }
    .level { font-size: 24px; text-align: center; margin-bottom: 40px; }
    .dimensions { display: flex; justify-content: space-around; margin: 30px 0; }
    .dim { text-align: center; }
    .dim-score { font-size: 36px; }
    .footer { text-align: center; margin-top: 40px; font-size: 14px; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="title">🏆 HAIC 人机协作指数证书</div>
    <div class="score">${totalScore}</div>
    <div class="level">${level.level} · ${level.desc}</div>
    <div class="dimensions">
      ${certData.dimensions.map(d => `
        <div class="dim">
          <div class="dim-score">${d.score}</div>
          <div>${d.name}</div>
        </div>
      `).join('')}
    </div>
    <div class="footer">CareerPath AI · ${certData.date}</div>
  </div>
</body>
</html>`;
    
    // Open in new window for print
    const win = window.open('', '_blank');
    win.document.write(certHTML);
    win.document.close();
  };

  // ========== 介绍页面 ==========
  if (step === 'intro') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧠🤖</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HAIC 人机协作指数</h1>
          <p className="text-lg text-gray-600">Human-AI Collaboration Index</p>
          <p className="text-sm text-gray-500 mt-2">基于 McKinsey/Deloitte/Gartner/WEF 2025 研究</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">什么是 HAIC？</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            在AI-Native时代，企业招聘正从"技能匹配"转向"学习潜力+AI协作能力"评估。
            HAIC（人机协作指数）是衡量你与AI协作能力的5维评估体系。
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {HAIC_DIMENSIONS.map(dim => (
              <div key={dim.id} className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl mb-2">{dim.icon}</div>
                <div className="font-medium text-sm" style={{ color: dim.color }}>{dim.name}</div>
                <div className="text-xs text-gray-500 mt-1">{dim.weight}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {HAIC_DIMENSIONS.map(dim => (
            <div key={dim.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{dim.icon}</span>
                <div>
                  <div className="font-bold text-gray-800">{dim.name}</div>
                  <div className="text-xs text-gray-500">权重 {dim.weight}%</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{dim.description}</p>
              <p className="text-xs text-gray-500">💡 {dim.question}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={startAssessment}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
          >
            🚀 开始HAIC评估（约5分钟）
          </button>
          <p className="text-sm text-gray-500 mt-3">20道选择题 · 即时生成能力证书</p>
        </div>
      </div>
    );
  }

  // ========== 评估页面 ==========
  if (step === 'assessment') {
    const dim = HAIC_DIMENSIONS[currentDim];
    const questions = SAMPLE_QUESTIONS[dim.id];
    const q = questions[currentQ];
    const progress = ((currentDim * 4 + currentQ) / 20) * 100;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">进度 {Math.round(progress)}%</span>
            <span className="text-sm font-medium" style={{ color: dim.color }}>
              {dim.icon} {dim.name} ({currentQ + 1}/{questions.length})
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: dim.color }} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="text-lg font-medium text-gray-800 mb-6">
            {currentQ + 1}. {q.question}
          </div>

          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => !showExplanation && handleAnswer(i)}
                disabled={showExplanation}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  showExplanation
                    ? i === q.correct
                      ? 'bg-green-100 border-2 border-green-500'
                      : i === selectedOption
                        ? 'bg-red-100 border-2 border-red-500'
                        : 'bg-gray-50'
                    : 'bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-300'
                }`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800 mb-1">
                {selectedOption === q.correct ? '✅ 正确！' : '❌ 不正确'}
              </div>
              <p className="text-sm text-blue-700">{q.explanation}</p>
              <button
                onClick={nextQuestion}
                className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentDim === HAIC_DIMENSIONS.length - 1 && currentQ === questions.length - 1 ? '查看结果 →' : '下一题 →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== 结果页面 ==========
  if (step === 'result') {
    const totalScore = scores.total || 0;
    const level = getLevel(totalScore);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">HAIC 评估完成！</h2>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8 text-center">
          <div className="text-6xl font-bold mb-2" style={{ color: level.color }}>{totalScore}</div>
          <div className="text-xl font-medium text-gray-800 mb-1">{level.level}</div>
          <div className="text-sm text-gray-600">{level.desc}</div>
          <div className="mt-4 text-xs text-gray-500">
            竞争力：超过 {Math.round(totalScore)}% 的求职者
          </div>
        </div>

        {/* 雷达图 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">五维能力雷达</h3>
          <div className="grid grid-cols-5 gap-4">
            {HAIC_DIMENSIONS.map(dim => {
              const score = scores[dim.id] || 0;
              return (
                <div key={dim.id} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke={dim.color}
                        strokeWidth="8"
                        strokeDasharray={`${score * 2.83} 283`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold" style={{ color: dim.color }}>{score}</span>
                    </div>
                  </div>
                  <div className="text-xs font-medium">{dim.name}</div>
                  <div className="text-xs text-gray-500">{dim.weight}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 维度详情 */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {HAIC_DIMENSIONS.map(dim => {
            const score = scores[dim.id] || 0;
            return (
              <div key={dim.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{dim.icon}</span>
                    <span className="font-medium">{dim.name}</span>
                  </div>
                  <span className="font-bold" style={{ color: dim.color }}>{score}分</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${score}%`, backgroundColor: dim.color }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">{dim.description}</p>
              </div>
            );
          })}
        </div>

        {/* 行动建议 */}
        <div className="bg-yellow-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3">💡 提升建议</h3>
          <ul className="space-y-2">
            {HAIC_DIMENSIONS.map(dim => {
              const score = scores[dim.id] || 0;
              if (score < 60) {
                return (
                  <li key={dim.id} className="text-sm text-gray-700">
                    <span className="font-medium">{dim.icon} {dim.name} ({score}分)</span>：
                    建议重点提升，尝试{dim.examples[0]}
                  </li>
                );
              }
              return null;
            }).filter(Boolean)}
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={generateCertificate}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            🏆 生成HAIC证书
          </button>
          <button
            onClick={startAssessment}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
          >
            🔄 重新评估
          </button>
        </div>
      </div>
    );
  }

  return null;
}
