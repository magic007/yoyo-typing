import React, { useState, useEffect, useCallback, useRef } from 'react';
import { STATIC_LESSONS } from './constants';
import { AppMode, Lesson, PracticeStats, Difficulty } from './types';
import VirtualKeyboard from './components/VirtualKeyboard';
import TypingGame from './components/TypingGame';
import { generateLesson } from './services/geminiService';
import { playClick, playError, playSuccess } from './services/soundService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  
  // UI State
  const [showFingerOptions, setShowFingerOptions] = useState(false);
  const [showPrimaryOptions, setShowPrimaryOptions] = useState(false);
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Typing State
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errorKeys, setErrorKeys] = useState<Record<string, number>>({});
  
  // History
  const [history, setHistory] = useState<PracticeStats[]>([]);

  // AI Input State
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Input State
  const [customText, setCustomText] = useState('');

  // --- Logic ---

  const calculateStats = (): PracticeStats => {
    const timeElapsed = ((endTime || Date.now()) - (startTime || Date.now())) / 1000 / 60; // minutes
    const validTime = Math.max(timeElapsed, 0.01);
    
    // WPM: (Total characters / 5) / time in minutes
    const wpm = Math.round((userInput.length / 5) / validTime);
    
    // Accuracy
    let errors = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] !== text[i]) errors++;
    }
    const accuracy = Math.round(((userInput.length - errors) / (userInput.length || 1)) * 100);

    return {
      wpm,
      accuracy,
      totalChars: userInput.length,
      errors,
      timeElapsed: validTime * 60,
      errorKeys
    };
  };

  const handleStartLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setText(lesson.content);
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setErrorKeys({});
    setMode(AppMode.PRACTICE);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (mode !== AppMode.PRACTICE || endTime) return;

    // Ignore modifiers
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
    
    if (!startTime) setStartTime(Date.now());

    if (e.key === 'Backspace') {
      setUserInput(prev => prev.slice(0, -1));
      return;
    }

    const nextIndex = userInput.length;
    if (nextIndex >= text.length) return;

    const expectedChar = text[nextIndex];
    
    // Basic mapping for "Enter" if text has newlines
    let typedChar = e.key;
    if (typedChar === 'Enter') typedChar = '\n';
    
    // Prevent typing if length exceeded
    if (userInput.length >= text.length) return;

    // Error Tracking & Sound
    if (typedChar !== expectedChar) {
      if (!isMuted) playError();
      setErrorKeys(prev => ({
        ...prev,
        [expectedChar]: (prev[expectedChar] || 0) + 1
      }));
    } else {
      if (!isMuted) playClick();
    }

    setUserInput(prev => prev + typedChar);

    // Check Completion
    if (userInput.length + 1 === text.length) {
      setEndTime(Date.now());
      if (!isMuted) setTimeout(() => playSuccess(), 100);
    }
  }, [mode, userInput, text, startTime, endTime, isMuted]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (endTime && currentLesson) {
      const stats = calculateStats();
      setHistory(prev => [...prev, stats]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]); // Run once when completed

  // --- AI Gen ---
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    const lesson = await generateLesson(aiTopic, Difficulty.MEDIUM);
    setIsGenerating(false);
    if (lesson) {
      handleStartLesson(lesson);
    } else {
      alert("生成失败，请检查 API Key 或重试。");
    }
  };

  // --- Custom Gen ---
  const handleStartCustom = () => {
    if (!customText.trim()) return;
    
    // Normalize input: replace commas (Eng/CN) and newlines with spaces, remove extra spaces
    const cleanContent = customText
      .replace(/[,，\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    if (cleanContent.length === 0) return;

    const lesson: Lesson = {
      id: `custom-${Date.now()}`,
      title: '📝 自定义内容',
      category: 'custom',
      difficulty: Difficulty.MEDIUM,
      content: cleanContent
    };
    
    handleStartLesson(lesson);
  };

  // --- Components ---

  const renderHome = () => {
    const fingerLessons = STATIC_LESSONS.filter(l => l.category === 'finger');
    const basicLessons = STATIC_LESSONS.filter(l => l.category === 'basics');
    const primaryLessons = STATIC_LESSONS.filter(l => l.category === 'primary');
    const otherLessons = STATIC_LESSONS.filter(l => !['finger', 'basics', 'primary'].includes(l.category));

    return (
    <div className="max-w-6xl mx-auto p-8 animate-fade-in">
      <header className="mb-12 text-center">
        <h1 className="text-6xl font-cartoon text-blue-600 mb-4 drop-shadow-sm">悠悠打字通</h1>
        <p className="text-xl text-slate-500 font-medium">专为学生设计的趣味打字练习工具</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Practice Lessons */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-slate-700 mb-2 flex items-center gap-2">
            <span>📚</span> 基础练习
          </h2>
          
          {/* Basics */}
          {basicLessons.map(l => (
            <button
              key={l.id}
              onClick={() => handleStartLesson(l)}
              className="w-full text-left p-4 rounded-xl hover:bg-blue-50 transition-colors border border-slate-100 group"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 group-hover:text-blue-600">{l.title}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">{l.difficulty}</span>
              </div>
            </button>
          ))}

          {/* Finger Practice Dropdown */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
             <button 
                onClick={() => setShowFingerOptions(!showFingerOptions)}
                className="w-full text-left p-4 bg-slate-50 hover:bg-blue-50 transition-colors flex justify-between items-center group"
             >
                <span className="font-bold text-slate-700 group-hover:text-blue-600">✋ 手指专项练习</span>
                <span className={`text-slate-400 transform transition-transform ${showFingerOptions ? 'rotate-180' : ''}`}>▼</span>
             </button>
             
             {showFingerOptions && (
                <div className="bg-slate-50/50 p-2 space-y-2 animate-fade-in">
                   {fingerLessons.map(l => (
                      <button
                        key={l.id}
                        onClick={() => handleStartLesson(l)}
                        className="w-full text-left p-3 pl-6 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 flex justify-between items-center"
                      >
                         <span className="text-slate-600 font-medium text-sm">{l.title}</span>
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase">指法</span>
                      </button>
                   ))}
                </div>
             )}
          </div>

          {/* Primary School Words Dropdown */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
             <button 
                onClick={() => setShowPrimaryOptions(!showPrimaryOptions)}
                className="w-full text-left p-4 bg-slate-50 hover:bg-blue-50 transition-colors flex justify-between items-center group"
             >
                <span className="font-bold text-slate-700 group-hover:text-blue-600">📖 小学英语单词 (1-6年级)</span>
                <span className={`text-slate-400 transform transition-transform ${showPrimaryOptions ? 'rotate-180' : ''}`}>▼</span>
             </button>
             
             {showPrimaryOptions && (
                <div className="bg-slate-50/50 p-2 animate-fade-in grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                   {primaryLessons.map(l => (
                      <button
                        key={l.id}
                        onClick={() => handleStartLesson(l)}
                        className="w-full text-left p-3 pl-6 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 flex justify-between items-center"
                      >
                         <span className="text-slate-600 font-medium text-sm">{l.title}</span>
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 uppercase">词汇</span>
                      </button>
                   ))}
                </div>
             )}
          </div>

          {/* Custom Words Dropdown */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
             <button 
                onClick={() => setShowCustomOptions(!showCustomOptions)}
                className="w-full text-left p-4 bg-slate-50 hover:bg-blue-50 transition-colors flex justify-between items-center group"
             >
                <span className="font-bold text-slate-700 group-hover:text-emerald-600">✍️ 自定义内容练习</span>
                <span className={`text-slate-400 transform transition-transform ${showCustomOptions ? 'rotate-180' : ''}`}>▼</span>
             </button>
             
             {showCustomOptions && (
                <div className="bg-slate-50/50 p-4 animate-fade-in">
                   <textarea
                      placeholder="在此粘贴文章，或输入逗号分隔的单词列表..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none min-h-[80px] resize-none mb-2 bg-white"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                   />
                   <button 
                      onClick={handleStartCustom}
                      disabled={!customText.trim()}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
                   >
                      开始练习
                   </button>
                </div>
             )}
          </div>

          {/* Other Lessons */}
          {otherLessons.map(l => (
            <button
              key={l.id}
              onClick={() => handleStartLesson(l)}
              className="w-full text-left p-4 rounded-xl hover:bg-blue-50 transition-colors border border-slate-100 group"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 group-hover:text-blue-600">{l.title}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  l.difficulty === Difficulty.EASY ? 'bg-green-100 text-green-700' :
                  l.difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{l.difficulty}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Game Mode */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group cursor-pointer"
               onClick={() => setMode(AppMode.GAME)}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl transition-all group-hover:bg-white/20"></div>
            <h2 className="text-3xl font-cartoon mb-2">🎮 单词雨游戏</h2>
            <p className="text-indigo-100 mb-4">趣味打字游戏，提升反应速度！</p>
            <button className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
              开始挑战
            </button>
          </div>

          {/* AI Generator */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span>✨</span> AI 智能出题
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="话题？例如：恐龙、太空..."
                className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 focus:border-blue-400 focus:outline-none"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <button 
                onClick={handleAIGenerate}
                disabled={isGenerating || !process.env.API_KEY}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isGenerating ? '...' : '生成课程'}
              </button>
            </div>
            {!process.env.API_KEY && (
               <p className="text-xs text-red-400 mt-2">缺少 API Key。请在 metadata.json 或 env 中配置。</p>
            )}
          </div>
          
          {/* Stats Teaser */}
          {history.length > 0 && (
             <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => setMode(AppMode.STATS)}>
                <h2 className="text-xl font-bold text-slate-700">📊 查看进步</h2>
                <p className="text-slate-500">你已经练习了 {history.length} 次。</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
  };

  const renderPractice = () => {
    const nextCharIndex = userInput.length;
    const nextChar = text[nextCharIndex]; // Can be undefined if done
    const isFinished = !!endTime;

    // Render text with highlighting
    const renderText = () => {
      return text.split('').map((char, index) => {
        let className = "text-slate-400"; // pending
        if (index < userInput.length) {
          // typed
          className = userInput[index] === char ? "text-green-600" : "text-red-500 bg-red-100";
        } else if (index === userInput.length) {
          // current cursor
          className = "text-blue-600 bg-blue-100 border-b-4 border-blue-400";
        }
        
        // Handle spaces visually
        const displayChar = char === ' ' ? '\u00A0' : char;

        return (
          <span key={index} className={`font-mono text-3xl px-0.5 rounded-sm transition-colors ${className}`}>
            {displayChar}
          </span>
        );
      });
    };

    return (
      <div className="flex flex-col h-screen max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setMode(AppMode.HOME)} className="text-slate-500 hover:text-blue-600 font-bold flex items-center gap-2">
            ← 退出
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-700">{currentLesson?.title}</h2>
          </div>
          <div className="w-24 flex justify-end">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className={`p-2 rounded-full ${isMuted ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'} hover:opacity-80 transition-colors`}
              title={isMuted ? "取消静音" : "静音"}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Typing Area */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* Text Box */}
          <div className="bg-white rounded-2xl shadow-inner border-2 border-slate-100 p-8 min-h-[200px] flex flex-wrap content-start leading-relaxed select-none relative" 
               onClick={() => { /* Focus handler if we used input, but using window listener */ }}>
            
            {/* Overlay for Finish */}
            {isFinished && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-20 animate-fade-in">
                <h3 className="text-4xl font-cartoon text-blue-600 mb-2">太棒了！🎉</h3>
                <div className="grid grid-cols-2 gap-8 mb-8 text-center">
                  <div>
                    <p className="text-slate-400 text-sm uppercase font-bold">速度 (WPM)</p>
                    <p className="text-4xl font-bold text-slate-800">{calculateStats().wpm}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm uppercase font-bold">正确率</p>
                    <p className="text-4xl font-bold text-slate-800">{calculateStats().accuracy}%</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleStartLesson(currentLesson!)} className="px-6 py-2 bg-slate-200 rounded-full font-bold hover:bg-slate-300 text-slate-700">重试</button>
                  <button onClick={() => setMode(AppMode.HOME)} className="px-6 py-2 bg-blue-500 rounded-full font-bold hover:bg-blue-600 text-white shadow-lg">完成</button>
                </div>
              </div>
            )}

            {renderText()}
          </div>

          {/* Keyboard & Hands */}
          <div className="mt-auto">
             <VirtualKeyboard activeKey={isFinished ? null : nextChar || ' '} errorKeys={errorKeys} />
          </div>

        </div>
      </div>
    );
  };

  const renderStats = () => (
    <div className="max-w-4xl mx-auto p-8 h-screen flex flex-col">
       <div className="flex justify-between items-center mb-8">
          <button onClick={() => setMode(AppMode.HOME)} className="text-slate-500 hover:text-blue-600 font-bold">← 返回首页</button>
          <h2 className="text-3xl font-cartoon text-slate-700">你的练习记录</h2>
       </div>
       
       <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex-1 min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="index" hide />
              <YAxis />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="wpm" stroke="#3b82f6" strokeWidth={3} dot={{r: 6}} name="速度 (WPM)" />
              <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={{r: 6}} name="正确率 %" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-center text-slate-400 mt-4">历史练习曲线</p>
       </div>
    </div>
  );

  return (
    <div className={`
      ${mode === AppMode.GAME ? 'h-screen overflow-hidden' : 'min-h-screen'}
      bg-[#f0f9ff] text-slate-800 font-sans selection:bg-blue-200 flex flex-col
    `}>
      {mode === AppMode.HOME && renderHome()}
      {mode === AppMode.PRACTICE && renderPractice()}
      
      {/* Game Mode Container: Needs full height/width to support falling animation */}
      {mode === AppMode.GAME && (
        <div className="h-full w-full p-4 md:p-8 flex flex-col flex-1">
          <TypingGame onExit={() => setMode(AppMode.HOME)} />
        </div>
      )}
      
      {mode === AppMode.STATS && renderStats()}
    </div>
  );
}