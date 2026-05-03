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
      explanation: 'AI擅长大规模数据分析，但不擅长真正的情感理解和创造性表达',
      difficulty: 'easy',
      skill: 'AI能力边界判断'
    },
    {
      question: '当你需要完成一份市场研究报告，你会：',
      options: ['完全依赖AI生成', '自己写不让AI参与', '用AI收集数据，自己分析结论', '让AI写，自己只改格式'],
      correct: 2,
      explanation: '最佳实践是AI辅助数据收集，人类负责分析和判断',
      difficulty: 'easy',
      skill: '人机协作分工'
    },
    {
      question: 'AI生成内容出现"幻觉"是指：',
      options: ['AI产生了视觉幻觉', 'AI生成了看似合理但实际错误的信息', 'AI运行速度变慢', 'AI拒绝回答问题'],
      correct: 1,
      explanation: '"幻觉"是AI生成虚假但看似合理的信息的现象',
      difficulty: 'easy',
      skill: 'AI术语理解'
    },
    {
      question: '在求职场景中，AI最适合帮你：',
      options: ['决定你的职业方向', '优化简历关键词匹配', '替你参加面试', '选择人生伴侣'],
      correct: 1,
      explanation: 'AI擅长优化和匹配，但重大人生决策需要人类判断',
      difficulty: 'easy',
      skill: 'AI适用场景判断'
    },
    {
      question: 'GPT-4和GPT-3.5的主要区别是：',
      options: ['GPT-4速度更快', 'GPT-4理解更复杂指令，推理能力更强', 'GPT-4免费使用', 'GPT-4只能写代码'],
      correct: 1,
      explanation: 'GPT-4的核心优势是复杂推理和指令理解能力',
      difficulty: 'medium',
      skill: 'AI模型认知'
    },
    {
      question: '以下哪种情况AI最容易出错？',
      options: ['数学计算', '翻译常见短语', '需要最新信息的事实查询', '格式化文本'],
      correct: 2,
      explanation: 'AI知识有截止日期，对最新事件和动态信息容易出错',
      difficulty: 'medium',
      skill: 'AI局限性认知'
    },
    {
      question: '多模态AI是指：',
      options: ['多个AI一起工作', '能同时处理文本、图像、音频等多种输入', '运行速度很快的AI', '专门用于游戏的AI'],
      correct: 1,
      explanation: '多模态AI能理解和生成多种类型的数据（文本、图像、音频等）',
      difficulty: 'medium',
      skill: 'AI技术趋势'
    },
    {
      question: '在团队协作中，AI最适合扮演的角色是：',
      options: ['团队领导', '信息整合者和初稿撰写者', '冲突调解员', '创意总监'],
      correct: 1,
      explanation: 'AI擅长信息整合和初稿生成，但领导和创意决策需要人类',
      difficulty: 'hard',
      skill: 'AI角色定位'
    }
  ],
  prompt_engineering: [
    {
      question: '一个好的prompt应该包含：',
      options: ['尽量简短，让AI自由发挥', '详细说明背景、任务、格式和约束', '只写关键词', '用代码写prompt'],
      correct: 1,
      explanation: '结构化prompt包含背景、任务、格式、约束四要素',
      difficulty: 'easy',
      skill: 'Prompt结构'
    },
    {
      question: '当AI输出不符合预期时，你应该：',
      options: ['换一个大模型', '放弃使用AI', '优化prompt并迭代', '抱怨AI不够智能'],
      correct: 2,
      explanation: '提示工程的核心是迭代优化，而非更换工具',
      difficulty: 'easy',
      skill: 'Prompt迭代'
    },
    {
      question: '"Few-shot prompting"是指：',
      options: ['用少量示例引导AI输出格式', '快速连续提问', '只用5个单词提问', '让AI少说话'],
      correct: 0,
      explanation: 'Few-shot是通过提供示例让AI理解期望的输出格式',
      difficulty: 'easy',
      skill: 'Few-shot技巧'
    },
    {
      question: '在简历优化场景中，最有效的prompt策略是：',
      options: ['"帮我优化简历"', '"你是一位HR专家，请针对[岗位JD]优化这份简历，突出匹配的关键词，量化成果"', '"写一份更好的简历"', '"让简历看起来厉害"'],
      correct: 1,
      explanation: '具体角色+明确任务+相关上下文=高质量输出',
      difficulty: 'easy',
      skill: '角色设定'
    },
    {
      question: 'Chain-of-Thought prompting的作用是：',
      options: ['让AI运行更快', '引导AI展示推理过程，提高复杂问题准确率', '减少token使用', '让AI更简短回答'],
      correct: 1,
      explanation: 'CoT通过让AI展示思考步骤来提高复杂推理任务的准确性',
      difficulty: 'medium',
      skill: 'CoT思维链'
    },
    {
      question: 'Temperature参数在AI生成中的作用是：',
      options: ['控制生成速度', '控制输出随机性：低=保守确定，高=创意随机', '控制输出长度', '控制使用哪个模型'],
      correct: 1,
      explanation: 'Temperature控制AI输出的随机性，低值更确定，高值更有创意',
      difficulty: 'medium',
      skill: '参数调优'
    },
    {
      question: '以下哪个prompt最可能获得结构化的JSON输出？',
      options: ['给我数据', '列出要点', '请以JSON格式输出，包含以下字段：name, age, skills。示例：{"name": "张三"...}', '随便写写'],
      correct: 2,
      explanation: '提供明确的格式要求和示例是获得结构化输出的关键',
      difficulty: 'medium',
      skill: '结构化输出'
    },
    {
      question: '当你需要AI分析一份复杂合同，最佳策略是：',
      options: ['一次性发送整个合同', '分段发送，每段提出具体问题', '让AI自己决定怎么读', '只发送合同标题'],
      correct: 1,
      explanation: '复杂文档分段处理，每段配合具体问题，能获得更精准的分析',
      difficulty: 'hard',
      skill: '复杂任务分解'
    }
  ],
  workflow_reconstruction: [
    {
      question: '你接到一个"分析竞品并制作PPT"的任务，最佳分工是：',
      options: ['全部自己做', '全部交给AI', 'AI收集数据→自己分析→AI制作PPT→自己审核', '让AI做，自己打游戏'],
      correct: 2,
      explanation: '人机协作：AI处理信息收集和格式化，人类负责分析和决策',
      difficulty: 'easy',
      skill: '任务分解'
    },
    {
      question: '以下哪个环节最不适合AI自动化？',
      options: ['数据清洗', '创意头脑风暴', '邮件分类', '代码格式化'],
      correct: 1,
      explanation: '创意头脑风暴需要人类独特的联想和创新能力',
      difficulty: 'easy',
      skill: 'AI适用边界'
    },
    {
      question: '设计人机协作流程时，原则是：',
      options: ['让AI做所有事', '人做决策，AI做执行', '根据任务特性分配', '谁快谁做'],
      correct: 2,
      explanation: '最佳实践是根据任务特性（创造性/重复性/决策性）分配',
      difficulty: 'easy',
      skill: '协作设计'
    },
    {
      question: '在求职准备中，AI可以帮你：',
      options: ['决定你的职业价值观', '模拟面试练习', '替你选择offer', '规划你的人生'],
      correct: 1,
      explanation: 'AI适合模拟练习和准备，价值观和人生决策属于人类',
      difficulty: 'easy',
      skill: 'AI辅助边界'
    },
    {
      question: 'RPA（机器人流程自动化）最适合的场景是：',
      options: ['战略决策', '重复性高、规则明确的流程', '客户关系维护', '产品创新'],
      correct: 1,
      explanation: 'RPA擅长处理重复性高、规则明确的流程任务',
      difficulty: 'medium',
      skill: '自动化工具认知'
    },
    {
      question: '当你用AI辅助写代码，最佳实践是：',
      options: ['让AI写全部代码', 'AI生成初稿→人工审查→迭代优化', '完全不用AI', '复制粘贴AI代码直接部署'],
      correct: 1,
      explanation: 'AI生成初稿+人工审查+迭代优化是最佳人机协作模式',
      difficulty: 'medium',
      skill: '代码协作'
    },
    {
      question: '在数据分析项目中，AI和人类的最佳分工是：',
      options: ['AI做全部', '人类做全部', 'AI处理数据清洗和初步分析，人类做洞察提炼和决策建议', '随机分配'],
      correct: 2,
      explanation: 'AI擅长数据处理，人类擅长洞察提炼和业务决策',
      difficulty: 'medium',
      skill: '数据分析协作'
    },
    {
      question: '设计一个"AI+人类"的客户服务流程，最佳方案是：',
      options: ['AI处理所有客户', '人类处理所有客户', 'AI处理常见问题→复杂问题转人工→AI总结记录', '让客户自己选择'],
      correct: 2,
      explanation: '分层处理：AI处理标准化问题，人类处理复杂和情感问题',
      difficulty: 'hard',
      skill: '服务流程设计'
    }
  ],
  quality_judgment: [
    {
      question: 'AI告诉你"Python是1991年由Guido van Rossum创建的"，你应该：',
      options: ['直接相信，写进简历', '查证权威来源再使用', '让AI再确认一遍', '不相信任何AI说的'],
      correct: 1,
      explanation: '关键信息需要查证，这是质量判断力的核心',
      difficulty: 'easy',
      skill: '事实核查'
    },
    {
      question: 'AI生成的简历优化建议中，你发现它：',
      options: ['全部接受', '全部拒绝', '评估每条建议的合理性和真实性', '只接受看起来高级的'],
      correct: 2,
      explanation: '批判性评估AI建议，不盲从也不全盘否定',
      difficulty: 'easy',
      skill: '批判性评估'
    },
    {
      question: 'AI说"根据最新研究，90%的HR使用AI筛选简历"，你：',
      options: ['直接引用这个数据', '搜索原始研究出处', '改成"很多HR"', '不care'],
      correct: 1,
      explanation: '对AI提供的统计数据要溯源验证',
      difficulty: 'easy',
      skill: '数据溯源'
    },
    {
      question: 'AI生成的代码有bug，但看起来能运行：',
      options: ['直接部署到生产环境', '测试所有边界情况', '让AI自己检查', '祈祷不出问题'],
      correct: 1,
      explanation: 'AI代码需要人类测试和验证，尤其是边界情况',
      difficulty: 'easy',
      skill: '代码验证'
    },
    {
      question: 'AI生成的内容中，哪种"幻觉"最难发现？',
      options: ['明显的事实错误', '引用不存在的论文或数据', '语法错误', '格式问题'],
      correct: 1,
      explanation: '虚构的引用和数据看起来专业，最难识别',
      difficulty: 'medium',
      skill: '深度验证'
    },
    {
      question: '当AI和Google搜索结果不一致时，你应该：',
      options: ['相信AI', '相信Google', '对比多个来源，综合判断', '抛硬币决定'],
      correct: 2,
      explanation: '信息验证需要多源对比，不依赖单一渠道',
      difficulty: 'medium',
      skill: '多源验证'
    },
    {
      question: 'AI生成的市场分析报告中，你首先应该检查：',
      options: ['排版美观度', '数据来源和时效性', '字数是否足够', '用词是否高级'],
      correct: 1,
      explanation: '数据的真实性和时效性是分析报告的核心',
      difficulty: 'medium',
      skill: '报告审查'
    },
    {
      question: '在求职中使用AI生成的自我介绍，最关键的是：',
      options: ['用词华丽', '内容真实且能经得起追问', '长度适中', '格式规范'],
      correct: 1,
      explanation: '真实性是基础，面试官会深入追问细节',
      difficulty: 'hard',
      skill: '真实性判断'
    }
  ],
  ethical_decision: [
    {
      question: '使用AI优化简历时，伦理边界是：',
      options: ['AI写什么就用什么', '不虚构经历和技能', '让AI编造项目经验', '夸大成果数字'],
      correct: 1,
      explanation: '真实性是底线，AI优化不等于虚构',
      difficulty: 'easy',
      skill: '真实性原则'
    },
    {
      question: '你发现AI在筛选简历时对某些学校有偏见：',
      options: ['不管，反正对我有利', '向平台反馈并要求修正', '利用这个偏见', '换一家平台'],
      correct: 1,
      explanation: '发现和纠正AI偏见是伦理决策力的体现',
      difficulty: 'easy',
      skill: '偏见识别'
    },
    {
      question: 'AI建议你在简历中隐藏年龄信息以避免歧视：',
      options: ['照做，这是聪明的做法', '拒绝，坚持真实透明', '评估具体情况后决定', '让AI替你决定'],
      correct: 2,
      explanation: '需要权衡真实性和现实考量，做出负责任的决定',
      difficulty: 'easy',
      skill: '伦理权衡'
    },
    {
      question: '在使用AI求职工具时，你的数据隐私策略应该是：',
      options: ['毫无保留地分享所有数据', '了解平台如何使用数据并控制分享范围', '完全不使用AI工具', '用假身份使用'],
      correct: 1,
      explanation: '知情同意和数据最小化是负责任的AI使用原则',
      difficulty: 'easy',
      skill: '隐私保护'
    },
    {
      question: 'AI生成的内容涉嫌抄袭，你应该：',
      options: ['直接使用，没人知道', '查重并修改，确保原创性', '标注AI生成', '删除不用'],
      correct: 1,
      explanation: '确保内容原创性是学术和职业诚信的基础',
      difficulty: 'medium',
      skill: '原创性保障'
    },
    {
      question: '当你发现公司使用AI监控员工工作效率，你应该：',
      options: ['支持，提高效率', '反对，侵犯隐私', '了解监控范围和目的后评估', '辞职'],
      correct: 2,
      explanation: '需要了解具体情况，在效率和隐私间找平衡',
      difficulty: 'medium',
      skill: '监控伦理'
    },
    {
      question: 'AI面试系统对你有偏见，最佳应对是：',
      options: ['接受结果', '要求人工复核并反馈系统问题', '投诉公司', '放弃求职'],
      correct: 1,
      explanation: '建设性反馈和寻求人工复核是负责任的应对',
      difficulty: 'medium',
      skill: '申诉机制'
    },
    {
      question: '在团队项目中，使用AI生成部分工作成果，你应该：',
      options: ['隐瞒使用AI', '主动说明并标注AI辅助部分', '完全不用AI', '让AI做全部'],
      correct: 1,
      explanation: '透明度和诚实是团队协作的基础',
      difficulty: 'hard',
      skill: '透明度原则'
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

  // ========== AI对话教练状态 ==========
  const [showCoach, setShowCoach] = useState(false);
  const [coachMessages, setCoachMessages] = useState([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachContext, setCoachContext] = useState('');

  // ========== 学习训练模式状态 ==========
  const [trainingMode, setTrainingMode] = useState(false);
  const [currentTraining, setCurrentTraining] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState({});
  const [showLearningMaterial, setShowLearningMaterial] = useState(false);
  const [learningContent, setLearningContent] = useState('');

  // ========== 个性化建议状态 ==========
  const [personalizedPlan, setPersonalizedPlan] = useState(null);
  const [showPlan, setShowPlan] = useState(false);

  // ========== AI对话教练 ==========
  const startCoach = (dimensionId = null) => {
    const dim = dimensionId ? HAIC_DIMENSIONS.find(d => d.id === dimensionId) : null;
    const context = dim 
      ? `用户正在学习"${dim.name}"，需要针对这个维度的辅导。`
      : '用户想了解HAIC人机协作指数，需要职业指导。';
    
    setCoachContext(context);
    setShowCoach(true);
    setCoachMessages([
      {
        role: 'assistant',
        content: dim 
          ? `你好！我是你的HAIC教练。我看到你想提升"${dim.name}"能力。这个维度主要考察${dim.description}。你想从哪里开始？`
          : '你好！我是你的HAIC教练。我可以帮你理解人机协作指数，提升AI时代竞争力。你想了解什么？',
        suggestions: dim
          ? ['什么是' + dim.name, '如何提升' + dim.name, '给我一道练习题', '推荐学习资源']
          : ['什么是HAIC', '如何评估我的HAIC', 'HAIC对求职有什么用', '推荐学习路径']
      }
    ]);
  };

  const sendCoachMessage = async (message) => {
    if (!message.trim()) return;
    
    setCoachLoading(true);
    setCoachMessages(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      const res = await fetch(`${API_BASE}/api/haic/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          context: coachContext,
          history: coachMessages.slice(-6),
          scores: scores
        }),
      });
      
      const data = await res.json();
      
      setCoachMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        suggestions: data.suggestions || []
      }]);
    } catch (err) {
      setCoachMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我暂时无法回答。让我想想...（你可以问：什么是' + HAIC_DIMENSIONS[0].name + '，或者如何提升HAIC）',
        suggestions: ['什么是HAIC', '如何提升HAIC', '推荐学习资源']
      }]);
    } finally {
      setCoachLoading(false);
      setCoachInput('');
    }
  };

  // ========== 学习训练模式 ==========
  const startTraining = (dimensionId) => {
    const dim = HAIC_DIMENSIONS.find(d => d.id === dimensionId);
    const training = {
      dimension: dim,
      scenarios: generateScenarios(dimensionId),
      currentScenario: 0,
      completed: false
    };
    
    setCurrentTraining(training);
    setTrainingMode(true);
    setShowLearningMaterial(true);
    setLearningContent(generateLearningMaterial(dimensionId));
  };

  const generateScenarios = (dimId) => {
    const scenarios = {
      ai_cognition: [
        {
          title: '场景1：选择AI工具',
          description: '你需要分析1000份用户反馈，以下哪个工具组合最合适？',
          options: ['只用Excel', 'Python + NLP库', '手动阅读', '随机抽样'],
          correct: 1,
          explanation: 'Python + NLP是处理大规模文本分析的标准方案'
        },
        {
          title: '场景2：AI局限性判断',
          description: '你要为产品写情感化的品牌故事，应该：',
          options: ['完全让AI写', 'AI生成初稿+人工润色情感', '完全自己写', '抄袭竞品'],
          correct: 1,
          explanation: 'AI可以生成框架，但情感化表达需要人类润色'
        }
      ],
      prompt_engineering: [
        {
          title: '场景1：优化Prompt',
          description: '当前prompt："写一份简历"。如何改进？',
          options: ['加长到500字', '添加角色设定+目标岗位+关键要求', '用英文写', '加更多形容词'],
          correct: 1,
          explanation: '角色设定+具体目标+明确要求=高质量输出'
        },
        {
          title: '场景2：迭代优化',
          description: 'AI第一次输出不符合要求，下一步：',
          options: ['换模型', '指出具体问题并要求修改', '放弃', '降低要求'],
          correct: 1,
          explanation: '迭代优化是提示工程的核心技能'
        }
      ],
      workflow_reconstruction: [
        {
          title: '场景1：任务分解',
          description: '你要在1天内完成市场调研报告，如何分工？',
          options: ['全部自己做', 'AI收集数据+AI分析+自己审核', 'AI做全部', '拖延到明天'],
          correct: 1,
          explanation: 'AI处理数据收集和初步分析，人类审核和决策'
        }
      ],
      quality_judgment: [
        {
          title: '场景1：验证信息',
          description: 'AI说"Python是最流行的语言"，你：',
          options: ['直接相信', '查看TIOBE或GitHub统计验证', '转发给朋友', '写进论文'],
          correct: 1,
          explanation: '关键数据需要权威来源验证'
        }
      ],
      ethical_decision: [
        {
          title: '场景1：数据隐私',
          description: 'AI工具要求访问你的全部求职数据，你：',
          options: ['全部授权', '只授权必要数据，了解使用目的', '拒绝使用', '用假数据'],
          correct: 1,
          explanation: '数据最小化原则：只分享必要信息'
        }
      ]
    };
    
    return scenarios[dimId] || [];
  };

  const generateLearningMaterial = (dimId) => {
    const materials = {
      ai_cognition: `## AI认知力学习指南

### 核心概念
AI认知力是理解AI能力边界和适用场景的能力。

### 学习要点
1. **了解AI的优势**：数据处理、模式识别、快速生成
2. **认识AI的局限**：情感理解、创造性思维、价值判断
3. **掌握适用场景**：重复性工作、数据分析、初稿生成
4. **避免过度依赖**：关键决策需人类判断

### 实践练习
- 列出你工作中5个适合AI辅助的环节
- 列出3个不适合AI介入的决策点

### 推荐资源
- 课程：《AI for Everyone》（吴恩达）
- 书籍：《AI超级powers》
- 实践：尝试用AI完成一项工作任务并评估效果`,

      prompt_engineering: `## 提示工程力学习指南

### 核心概念
提示工程力是有效构建prompt获取高质量输出的能力。

### 学习要点
1. **结构化Prompt**：角色+任务+格式+约束
2. **迭代优化**：分析输出→调整prompt→再次尝试
3. **Few-shot技巧**：用示例引导输出格式
4. **Chain-of-Thought**：引导AI展示推理过程

### 实践练习
- 为同一个任务写3个不同版本的prompt并对比结果
- 尝试用Few-shot方法让AI生成特定格式

### 推荐资源
- 指南：OpenAI Prompt Engineering Guide
- 工具：PromptPerfect、PromptLayer
- 社区：Learn Prompting`,

      workflow_reconstruction: `## 工作流重构力学习指南

### 核心概念
工作流重构力是将工作拆分为"人可做"和"AI可做"的能力。

### 学习要点
1. **任务分析**：识别重复性、创造性、决策性任务
2. **人机分工**：AI处理数据，人类做决策
3. **流程设计**：设计高效的人机协作流程
4. **持续优化**：根据效果调整分工

### 实践练习
- 绘制你当前工作的流程图
- 标注每个环节适合人类还是AI
- 设计一个优化后的人机协作流程

### 推荐资源
- 框架：RPA（机器人流程自动化）
- 工具：Zapier、Make（自动化工具）
- 案例：McKinsey AI Adoption Report`,

      quality_judgment: `## 质量判断力学习指南

### 核心概念
质量判断力是识别AI输出幻觉和偏差的能力。

### 学习要点
1. **识别幻觉**：虚构事实、错误引用、过时信息
2. **多源验证**：交叉验证关键信息
3. **批判思维**：不盲从AI输出
4. **持续学习**：了解AI最新能力和局限

### 实践练习
- 让AI生成一段内容，找出其中可能的错误
- 验证AI提供的3个数据点

### 推荐资源
- 工具：Google Fact Check Explorer
- 方法：SIFT（Stop, Investigate, Find, Trace）
- 案例：AI Hallucination Research`,

      ethical_decision: `## 伦理决策力学习指南

### 核心概念
伦理决策力是在AI辅助下做出负责任决策的能力。

### 学习要点
1. **真实性原则**：不虚构、不夸大
2. **隐私保护**：数据最小化、知情同意
3. **偏见识别**：发现并纠正AI偏见
4. **透明使用**：明确标注AI辅助内容

### 实践练习
- 审查一份AI生成的简历，检查伦理边界
- 设计一个AI使用的伦理检查清单

### 推荐资源
- 框架：AI Ethics Guidelines（欧盟）
- 工具：AI Fairness 360
- 案例：Algorithmic Justice League`
    };
    
    return materials[dimId] || '';
  };

  // ========== 生成个性化学习计划 ==========
  const generatePersonalizedPlan = () => {
    const weakDimensions = HAIC_DIMENSIONS.filter(d => (scores[d.id] || 0) < 60);
    const strongDimensions = HAIC_DIMENSIONS.filter(d => (scores[d.id] || 0) >= 80);
    
    const plan = {
      summary: `你的HAIC总分为${scores.total || 0}分，处于${getLevel(scores.total || 0).level}水平。`,
      strengths: strongDimensions.map(d => ({
        name: d.name,
        score: scores[d.id] || 0,
        suggestion: `保持优势，可以尝试指导他人或参与相关项目`
      })),
      improvements: weakDimensions.map(d => ({
        name: d.name,
        score: scores[d.id] || 0,
        priority: d.weight >= 20 ? '高' : '中',
        actions: [
          `完成${d.name}的专项训练模块`,
          `阅读推荐学习资源`,
          `与AI教练对话深入理解`,
          `在实际工作中刻意练习`
        ],
        resources: [
          `📚 ${d.name}学习指南`,
          `🎯 专项练习题（20道）`,
          `💬 AI教练一对一辅导`,
          `📊 进度追踪工具`
        ]
      })),
      timeline: [
        { phase: '第1周', focus: '薄弱维度基础学习', hours: 5 },
        { phase: '第2-3周', focus: '专项训练+实践', hours: 10 },
        { phase: '第4周', focus: '综合测试+调整', hours: 3 }
      ],
      weeklyGoal: '每周至少完成2次专项训练，与AI教练对话1次'
    };
    
    setPersonalizedPlan(plan);
    setShowPlan(true);
  };

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
          {/* 新增功能按钮 */}
          <button
            onClick={() => generatePersonalizedPlan()}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            📋 生成个性化学习计划
          </button>
          <button
            onClick={() => startCoach()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            💬 与AI教练对话
          </button>

          </button>
          <button
            onClick={startAssessment}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
          >
            🔄 重新评估
          </button>
        </div>
{/* AI教练对话弹窗 */}
      {showCoach && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col">
            <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-bold">HAIC AI教练</div>
                  <div className="text-xs opacity-80">随时解答你的问题</div>
                </div>
              </div>
              <button 
                onClick={() => setShowCoach(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {coachMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    <div className="text-sm">{msg.content}</div>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.suggestions.map((s, j) => (
                          <button
                            key={j}
                            onClick={() => sendCoachMessage(s)}
                            className="px-3 py-1 bg-white/20 rounded-full text-xs hover:bg-white/30 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {coachLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendCoachMessage(coachInput)}
                  placeholder="问AI教练任何问题..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => sendCoachMessage(coachInput)}
                  disabled={coachLoading || !coachInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-700 transition-colors"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 个性化学习计划弹窗 */}
      {showPlan && personalizedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📋 你的HAIC提升计划</h2>
                <button 
                  onClick={() => setShowPlan(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium">{personalizedPlan.summary}</p>
              </div>
              
              {personalizedPlan.strengths.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">💪 你的优势</h3>
                  <div className="grid gap-3">
                    {personalizedPlan.strengths.map((s, i) => (
                      <div key={i} className="bg-green-50 rounded-lg p-3">
                        <div className="font-medium text-green-800">{s.name} ({s.score}分)</div>
                        <div className="text-sm text-green-700">{s.suggestion}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {personalizedPlan.improvements.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">🎯 提升重点</h3>
                  <div className="space-y-4">
                    {personalizedPlan.improvements.map((imp, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{imp.name} ({imp.score}分)</div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            imp.priority === '高' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {imp.priority}优先级
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-600 mb-1">行动计划</div>
                            <ul className="space-y-1">
                              {imp.actions.map((a, j) => (
                                <li key={j} className="text-sm text-gray-600 flex items-start gap-1">
                                  <span>•</span> {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-600 mb-1">学习资源</div>
                            <ul className="space-y-1">
                              {imp.resources.map((r, j) => (
                                <li key={j} className="text-sm text-gray-600">{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <button
                          onClick={() => startTraining(HAIC_DIMENSIONS.find(d => d.name === imp.name)?.id)}
                          className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                        >
                          🚀 开始专项训练
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">📅 学习时间表</h3>
                <div className="space-y-3">
                  {personalizedPlan.timeline.map((t, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                      <div className="w-20 font-medium text-gray-700">{t.phase}</div>
                      <div className="flex-1 text-gray-600">{t.focus}</div>
                      <div className="text-sm text-gray-500">{t.hours}小时</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="font-medium text-yellow-800 mb-1">📝 每周目标</div>
                <div className="text-sm text-yellow-700">{personalizedPlan.weeklyGoal}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学习训练模式 */}
      {trainingMode && currentTraining && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    🎯 {currentTraining.dimension.name} 专项训练
                  </h2>
                  <p className="text-sm text-gray-500">场景 {currentTraining.currentScenario + 1}/{currentTraining.scenarios.length}</p>
                </div>
                <button 
                  onClick={() => setTrainingMode(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              {/* 学习材料 */}
              {showLearningMaterial && (
                <div className="mb-6 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">📚 学习材料</h3>
                  <pre className="text-sm text-blue-700 whitespace-pre-wrap">{learningContent}</pre>
                  <button
                    onClick={() => setShowLearningMaterial(false)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    开始练习 →
                  </button>
                </div>
              )}
              
              {/* 场景练习 */}
              {!showLearningMaterial && currentTraining.scenarios[currentTraining.currentScenario] && (
                <div className="space-y-4">
                  {(() => {
                    const scenario = currentTraining.scenarios[currentTraining.currentScenario];
                    return (
                      <>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="font-medium text-gray-800 mb-2">{scenario.title}</div>
                          <div className="text-gray-600 mb-4">{scenario.description}</div>
                          <div className="space-y-2">
                            {scenario.options.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  const isCorrect = i === scenario.correct;
                                  alert(isCorrect ? '✅ 正确！' + scenario.explanation : '❌ 再想想。' + scenario.explanation);
                                  if (currentTraining.currentScenario < currentTraining.scenarios.length - 1) {
                                    setCurrentTraining(prev => ({
                                      ...prev,
                                      currentScenario: prev.currentScenario + 1
                                    }));
                                  } else {
                                    alert('🎉 训练完成！');
                                    setTrainingMode(false);
                                  }
                                }}
                                className="w-full p-3 text-left bg-white border rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                {String.fromCharCode(65 + i)}. {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      </div>
    );
  }

  
      
}
