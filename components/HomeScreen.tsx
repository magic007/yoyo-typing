import React, { useState } from 'react';
import { STATIC_LESSONS } from '../constants';
import { AppMode, Lesson, Difficulty, PracticeStats } from '../types';

interface HomeScreenProps {
  onStartLesson: (lesson: Lesson) => void;
  onSetMode: (mode: AppMode) => void;
  history: PracticeStats[];
  
  // AI Props
  aiTopic: string;
  setAiTopic: (val: string) => void;
  handleAIGenerate: () => void;
  isGenerating: boolean;

  // Custom Props
  customText: string;
  setCustomText: (val: string) => void;
  handleStartCustom: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartLesson,
  onSetMode,
  history,
  aiTopic,
  setAiTopic,
  handleAIGenerate,
  isGenerating,
  customText,
  setCustomText,
  handleStartCustom
}) => {
  // Local UI State for dropdowns
  const [showFingerOptions, setShowFingerOptions] = useState(false);
  const [showPrimaryOptions, setShowPrimaryOptions] = useState(false);
  const [showCustomOptions, setShowCustomOptions] = useState(false);

  // Filter lessons
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
              onClick={() => onStartLesson(l)}
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
                        onClick={() => onStartLesson(l)}
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
                        onClick={() => onStartLesson(l)}
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
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none min-h-[80px] resize-none mb-2 bg-white text-slate-800"
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
              onClick={() => onStartLesson(l)}
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

        {/* Right Column: Games & AI */}
        <div className="space-y-8">
          
          {/* Game Mode: Word Rain */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group cursor-pointer transform hover:scale-[1.02] transition-transform"
               onClick={() => onSetMode(AppMode.GAME)}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl transition-all group-hover:bg-white/20"></div>
            <div className="relative z-10">
               <h2 className="text-3xl font-cartoon mb-2">🎮 单词雨游戏</h2>
               <p className="text-indigo-100 mb-4 text-sm font-bold opacity-90">Type fast or die trying!</p>
               <button className="bg-white/20 hover:bg-white text-white hover:text-indigo-600 px-6 py-2 rounded-full font-bold border border-white/40 transition-all text-sm">
                 开始挑战
               </button>
            </div>
          </div>

          {/* Game Mode: Frog River */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group cursor-pointer transform hover:scale-[1.02] transition-transform"
               onClick={() => onSetMode(AppMode.RIVERGAME)}>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/10 rounded-full -ml-24 -mt-24 blur-3xl transition-all group-hover:bg-white/20"></div>
            <div className="relative z-10">
               <h2 className="text-3xl font-cartoon mb-2">🐸 青蛙过河</h2>
               <p className="text-cyan-100 mb-4 text-sm font-bold opacity-90">跟着节奏打字，帮青蛙过河！</p>
               <button className="bg-white/20 hover:bg-white text-white hover:text-cyan-600 px-6 py-2 rounded-full font-bold border border-white/40 transition-all text-sm">
                 开始跳跃
               </button>
            </div>
          </div>

          {/* Game Mode: Dragon Slayer */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group cursor-pointer transform hover:scale-[1.02] transition-transform border-4 border-slate-600"
               onClick={() => onSetMode(AppMode.RPGGAME)}>
            <div className="absolute -bottom-10 -right-10 text-9xl opacity-10 group-hover:opacity-20 transition-opacity">🐲</div>
            <div className="relative z-10">
               <h2 className="text-3xl font-cartoon mb-2 text-yellow-400">⚔️ 勇者斗恶龙</h2>
               <p className="text-slate-300 mb-4 text-sm font-bold opacity-90">打字攻击！在恶龙行动前击败它！</p>
               <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-6 py-2 rounded-full font-bold shadow-lg transition-colors text-sm">
                 开始冒险
               </button>
            </div>
          </div>

          {/* Game Mode: Typing Race (Moved to last as requested) */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group cursor-pointer transform hover:scale-[1.02] transition-transform"
               onClick={() => onSetMode(AppMode.RACEGAME)}>
            <div className="absolute bottom-0 right-0 w-40 h-24 bg-white/10 rounded-t-full -mr-10 blur-xl transition-all group-hover:bg-white/20"></div>
            <div className="relative z-10">
               <h2 className="text-3xl font-cartoon mb-2">🏁 打字赛跑</h2>
               <p className="text-green-100 mb-4 text-sm font-bold opacity-90">与电脑比赛，谁跑得更快？</p>
               <button className="bg-white/20 hover:bg-white text-white hover:text-green-600 px-6 py-2 rounded-full font-bold border border-white/40 transition-all text-sm">
                 开始比赛
               </button>
            </div>
          </div>

          {/* AI Generator */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span>✨</span> AI 智能出题 (生成英文)
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入话题 (中文/英文)... 例如: 恐龙, Space"
                className="flex-1 border-2 border-slate-300 bg-white text-slate-800 rounded-xl px-4 py-2 focus:border-blue-400 focus:outline-none"
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
             <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => onSetMode(AppMode.STATS)}>
                <h2 className="text-xl font-bold text-slate-700">📊 查看进步</h2>
                <p className="text-slate-500">你已经练习了 {history.length} 次。</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;