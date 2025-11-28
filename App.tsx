
import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, Lesson, PracticeStats, Difficulty } from './types';
import TypingGame from './components/TypingGame';
import DragonGame from './components/DragonGame';
import RaceGame from './components/RaceGame';
import FrogGame from './components/FrogGame';
import HomeScreen from './components/HomeScreen';
import PracticeScreen from './components/PracticeScreen';
import StatsScreen from './components/StatsScreen';
import { generateLesson } from './services/geminiService';
import { playClick, playError, playSuccess } from './services/soundService';

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  
  // UI State
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

  return (
    <div className={`
      ${(mode === AppMode.GAME || mode === AppMode.RPGGAME || mode === AppMode.RACEGAME || mode === AppMode.RIVERGAME) ? 'h-screen overflow-hidden' : 'min-h-screen'}
      bg-[#f0f9ff] text-slate-800 font-sans selection:bg-blue-200 flex flex-col
    `}>
      {mode === AppMode.HOME && (
        <HomeScreen 
          onStartLesson={handleStartLesson}
          onSetMode={setMode}
          history={history}
          aiTopic={aiTopic}
          setAiTopic={setAiTopic}
          handleAIGenerate={handleAIGenerate}
          isGenerating={isGenerating}
          customText={customText}
          setCustomText={setCustomText}
          handleStartCustom={handleStartCustom}
        />
      )}
      
      {mode === AppMode.PRACTICE && (
        <PracticeScreen 
          currentLesson={currentLesson}
          text={text}
          userInput={userInput}
          isFinished={!!endTime}
          errorKeys={errorKeys}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onExit={() => setMode(AppMode.HOME)}
          onRetry={() => currentLesson && handleStartLesson(currentLesson)}
          onStats={calculateStats}
        />
      )}
      
      {/* Game Mode: Word Rain */}
      {mode === AppMode.GAME && (
        <div className="h-full w-full p-4 md:p-8 flex flex-col flex-1">
          <TypingGame onExit={() => setMode(AppMode.HOME)} />
        </div>
      )}

      {/* Game Mode: Dragon Slayer */}
      {mode === AppMode.RPGGAME && (
        <div className="h-full w-full p-0 flex flex-col flex-1">
          <DragonGame onExit={() => setMode(AppMode.HOME)} />
        </div>
      )}

      {/* Game Mode: Race Game */}
      {mode === AppMode.RACEGAME && (
        <div className="h-full w-full p-0 flex flex-col flex-1">
          <RaceGame onExit={() => setMode(AppMode.HOME)} />
        </div>
      )}

      {/* Game Mode: Frog River Game */}
      {mode === AppMode.RIVERGAME && (
        <div className="h-full w-full p-0 flex flex-col flex-1">
          <FrogGame onExit={() => setMode(AppMode.HOME)} />
        </div>
      )}
      
      {mode === AppMode.STATS && (
        <StatsScreen history={history} onBack={() => setMode(AppMode.HOME)} />
      )}
    </div>
  );
}
