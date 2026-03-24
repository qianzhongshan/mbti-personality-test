import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Save, Brain, RotateCcw } from 'lucide-react';

interface Question {
  id: string;
  dimension: string;
  sub_aspect: string;
  original_text: string;
  open_ended: string;
}

interface Answer {
  questionId: string;
  score: number;
  text: string;
}

interface DimensionScores {
  EI: number[];
  SN: number[];
  TF: number[];
  JP: number[];
}

const SCORE_LABELS = [
  { value: -3, label: '强烈否' },
  { value: -2, label: '否' },
  { value: -1, label: '倾向否' },
  { value: 0, label: '中立' },
  { value: 1, label: '倾向是' },
  { value: 2, label: '是' },
  { value: 3, label: '强烈是' },
];

const DIMENSION_NAMES: Record<string, string> = {
  EI: '外向/内向',
  SN: '实感/直觉',
  TF: '思考/情感',
  JP: '判断/感知',
};

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('https://api.deepseek.com');
  const [modelName, setModelName] = useState('deepseek-chat');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // 加载题库
  useEffect(() => {
    fetch('/questions.json')
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load questions:', err);
        setLoading(false);
      });
  }, []);

  // 从 localStorage 恢复进度
  useEffect(() => {
    const saved = localStorage.getItem('mbti_answers');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAnswers(new Map(Object.entries(parsed)));
    }
    const savedApi = localStorage.getItem('mbti_api_key');
    if (savedApi) setApiKey(savedApi);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;
  const answeredCount = answers.size;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleScoreSelect = (score: number) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      questionId: currentQuestion.id,
      score,
      text: currentAnswer?.text || '',
    });
    setAnswers(newAnswers);
    localStorage.setItem('mbti_answers', JSON.stringify(Object.fromEntries(newAnswers)));
  };

  const handleTextChange = (text: string) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      questionId: currentQuestion.id,
      score: currentAnswer?.score || 0,
      text,
    });
    setAnswers(newAnswers);
    localStorage.setItem('mbti_answers', JSON.stringify(Object.fromEntries(newAnswers)));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const calculateScores = (): DimensionScores => {
    const scores: DimensionScores = {
      EI: [],
      SN: [],
      TF: [],
      JP: [],
    };

    answers.forEach((answer) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        const dim = question.dimension as keyof DimensionScores;
        scores[dim].push(answer.score);
      }
    });

    return scores;
  };

  const analyzeAnswers = async () => {
    if (!apiKey) {
      alert('请输入 API Key');
      return;
    }

    if (answers.size < questions.length) {
      alert(`请完成所有 ${questions.length} 道题目`);
      return;
    }

    setAnalyzing(true);

    try {
      const scores = calculateScores();
      
      // 计算各维度的平均分
      const dimensionAverages = {
        EI: scores.EI.length > 0 ? scores.EI.reduce((a, b) => a + b, 0) / scores.EI.length : 0,
        SN: scores.SN.length > 0 ? scores.SN.reduce((a, b) => a + b, 0) / scores.SN.length : 0,
        TF: scores.TF.length > 0 ? scores.TF.reduce((a, b) => a + b, 0) / scores.TF.length : 0,
        JP: scores.JP.length > 0 ? scores.JP.reduce((a, b) => a + b, 0) / scores.JP.length : 0,
      };

      // 构建分析摘要
      const summary = answers.size > 0 
        ? Array.from(answers.values())
            .slice(0, 10)
            .map(a => `Q: ${a.questionId}, Score: ${a.score}, Answer: ${a.text.substring(0, 50)}...`)
            .join('\n')
        : '无答案';

      // 调用 API 进行分析
      const response = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'user',
              content: `你是一位 MBTI 专业分析师。基于以下用户的测试答案分析，生成一份 MBTI 性格分析报告。

维度平均分：
- EI 维度（外向/内向）: ${dimensionAverages.EI.toFixed(2)}
- SN 维度（实感/直觉）: ${dimensionAverages.SN.toFixed(2)}
- TF 维度（思考/情感）: ${dimensionAverages.TF.toFixed(2)}
- JP 维度（判断/感知）: ${dimensionAverages.JP.toFixed(2)}

用户答案摘要：
${summary}

请生成一份详细的 MBTI 性格分析报告，包括：
1. 整体性格特征描述
2. 各维度的具体分析
3. 性格优势和可能的盲点
4. 给用户的建议

请用 JSON 格式输出，包含以下字段：
{
  "personality_type": "MBTI 类型（如 INTJ）",
  "personality_summary": "整体性格特征描述",
  "dimension_analysis": {
    "EI": "外向/内向维度分析",
    "SN": "实感/直觉维度分析",
    "TF": "思考/情感维度分析",
    "JP": "判断/感知维度分析"
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "blind_spots": ["盲点1", "盲点2"],
  "recommendations": "给用户的建议"
}`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // 尝试解析 JSON
      let analysisResult;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          analysisResult = { raw_analysis: content };
        }
      } catch (e) {
        analysisResult = { raw_analysis: content };
      }

      setResult({
        scores: dimensionAverages,
        analysis: analysisResult,
      });
      setShowResult(true);
    } catch (error) {
      alert(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有答案吗？')) {
      setAnswers(new Map());
      setCurrentQuestionIndex(0);
      setResult(null);
      setShowResult(false);
      localStorage.removeItem('mbti_answers');
    }
  };

  const handleSaveApi = () => {
    localStorage.setItem('mbti_api_key', apiKey);
    alert('API 配置已保存');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载题库中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 标题区 */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MBTI 深度测评系统</h1>
          <p className="text-gray-600">93 题开放式论述版 | 深入了解你的性格特征</p>
        </div>
      </header>

      {/* API 配置区 */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>⚙️</span> API 配置
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">API 密钥</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入你的 DeepSeek API Key"
                className="w-full px-4 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">API 地址</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.deepseek.com"
                className="w-full px-4 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">模型名称</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="deepseek-chat"
                className="w-full px-4 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSaveApi}
                className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              >
                保存配置
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 进度条 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Card className="p-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700">答题进度</span>
            <span className="text-sm font-semibold text-blue-600">
              {answeredCount}/{questions.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>
      </div>

      {/* 主体内容 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {showResult ? (
          // 结果展示
          <Card className="p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">MBTI 分析报告</h2>
              <p className="text-gray-600">基于你的 93 道题目答案的深度分析</p>
            </div>

            {result && (
              <div className="space-y-8">
                {/* 维度得分 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(result.scores).map(([dim, score]: [string, any]) => (
                    <div key={dim} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                      <p className="text-sm font-medium text-gray-600 mb-2">{DIMENSION_NAMES[dim]}</p>
                      <p className="text-3xl font-bold text-blue-600">{score.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {score > 0 ? '倾向右侧' : score < 0 ? '倾向左侧' : '中立'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI 分析结果 */}
                {result.analysis && (
                  <div className="space-y-6">
                    {result.analysis.personality_type && (
                      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
                        <h3 className="text-xl font-bold text-blue-900 mb-2">你的 MBTI 类型</h3>
                        <p className="text-4xl font-bold text-blue-600">{result.analysis.personality_type}</p>
                      </div>
                    )}

                    {result.analysis.personality_summary && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">性格特征</h3>
                        <p className="text-gray-700 leading-relaxed">{result.analysis.personality_summary}</p>
                      </div>
                    )}

                    {result.analysis.dimension_analysis && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">维度分析</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(result.analysis.dimension_analysis).map(([dim, analysis]: [string, any]) => (
                            <div key={dim} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <p className="font-semibold text-gray-900 mb-2">{DIMENSION_NAMES[dim]}</p>
                              <p className="text-gray-700 text-sm">{analysis}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.analysis.strengths && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">性格优势</h3>
                        <ul className="space-y-2">
                          {result.analysis.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="text-green-600 font-bold">✓</span>
                              <span className="text-gray-700">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.analysis.recommendations && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded">
                        <h3 className="text-lg font-bold text-yellow-900 mb-3">建议</h3>
                        <p className="text-gray-700 leading-relaxed">{result.analysis.recommendations}</p>
                      </div>
                    )}

                    {result.analysis.raw_analysis && (
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">详细分析</h3>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">{result.analysis.raw_analysis}</p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => setShowResult(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  返回答题
                </Button>
              </div>
            )}
          </Card>
        ) : (
          // 题目展示
          <>
            {currentQuestion && (
              <Card className="p-8 shadow-lg">
                {/* 题目信息 */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {DIMENSION_NAMES[currentQuestion.dimension]}
                    </span>
                    <span className="text-sm text-gray-500">
                      题目 {currentQuestionIndex + 1}/{questions.length}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentQuestion.open_ended}</h2>
                  <p className="text-sm text-gray-600 italic">原题：{currentQuestion.original_text}</p>
                </div>

                {/* 评分按钮 */}
                <div className="mb-8">
                  <p className="text-sm font-semibold text-gray-700 mb-4">你的评分</p>
                  <div className="grid grid-cols-7 gap-2">
                    {SCORE_LABELS.map((label) => (
                      <button
                        key={label.value}
                        onClick={() => handleScoreSelect(label.value)}
                        className={`p-3 rounded-lg font-semibold transition-all text-sm ${
                          currentAnswer?.score === label.value
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-lg">{label.value > 0 ? '+' : ''}{label.value}</div>
                        <div className="text-xs mt-1">{label.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 文本输入 */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    详细说明（可选）
                  </label>
                  <textarea
                    value={currentAnswer?.text || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="请详细描述你的想法、经历或理由..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {currentAnswer?.text.length || 0} 字
                  </p>
                </div>

                {/* 导航按钮 */}
                <div className="flex gap-3">
                  <Button
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    ← 上一题
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    下一题 →
                  </Button>
                </div>
              </Card>
            )}

            {/* 快速导航 */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-700 mb-4">快速导航</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))' }}>
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`w-full aspect-square rounded-lg font-semibold text-sm transition-all ${
                      idx === currentQuestionIndex
                        ? 'bg-blue-600 text-white shadow-lg'
                        : answers.has(questions[idx].id)
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={`题目 ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* 底部操作栏 */}
      <footer className="bg-white border-t border-gray-200 sticky bottom-0 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex gap-4">
          <Button
            onClick={handleSaveApi}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存进度
          </Button>
          <Button
            onClick={analyzeAnswers}
            disabled={analyzing || answers.size < questions.length}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                分析结果
              </>
            )}
          </Button>
          <Button
            onClick={handleClearAll}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </Button>
        </div>
      </footer>
    </div>
  );
}
