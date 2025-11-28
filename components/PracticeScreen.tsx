
import React from 'react';
import { Lesson, PracticeStats } from '../types';
import VirtualKeyboard from './VirtualKeyboard';

interface PracticeScreenProps {
  currentLesson: Lesson | null;
  text: string;
  userInput: string;
  isFinished: boolean;
  errorKeys: Record<string, number>;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  onExit: () => void;
  onRetry: () => void;
  onStats: () => void; // Calculate and return stats
}

const PracticeScreen: React.FC<PracticeScreenProps> = ({
  currentLesson,
  text,
  userInput,
  isFinished,
  errorKeys,
  isMuted,
  setIsMuted,
  onExit,
  onRetry,
  onStats
}) => {
  // We need to calculate stats for the overlay. 
  // Since we passed a function `onStats` that presumably returns PracticeStats from the parent's current state,
  // we'll use that. However, the parent's `calculateStats` accesses state directly. 
  // Let's assume onStats() returns the object we need.
  const stats = isFinished ? (onStats() as unknown as PracticeStats) : null;

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

  const nextCharIndex = userInput.length;
  const nextChar = text[nextCharIndex];

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onExit} className="text-slate-500 hover:text-blue-600 font-bold flex items-center gap-2">
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
             onClick={() => { /* Focus handler handled globally */ }}>
          
          {/* Overlay for Finish */}
          {isFinished && stats && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-20 animate-fade-in">
              <h3 className="text-4xl font-cartoon text-blue-600 mb-2">太棒了！🎉</h3>
              <div className="grid grid-cols-2 gap-8 mb-8 text-center">
                <div>
                  <p className="text-slate-400 text-sm uppercase font-bold">速度 (WPM)</p>
                  <p className="text-4xl font-bold text-slate-800">{stats.wpm}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm uppercase font-bold">正确率</p>
                  <p className="text-4xl font-bold text-slate-800">{stats.accuracy}%</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={onRetry} className="px-6 py-2 bg-slate-200 rounded-full font-bold hover:bg-slate-300 text-slate-700">重试</button>
                <button onClick={onExit} className="px-6 py-2 bg-blue-500 rounded-full font-bold hover:bg-blue-600 text-white shadow-lg">完成</button>
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

export default PracticeScreen;
