import React, { useState, useEffect, useRef } from 'react';
import { STATIC_LESSONS } from '../constants';
import { playClick, playError, playSuccess } from '../services/soundService';

interface RaceGameProps {
  onExit: () => void;
}

type RaceState = 'SETUP' | 'RACING' | 'FINISHED';

const RaceGame: React.FC<RaceGameProps> = ({ onExit }) => {
  // Config
  const TRACK_LENGTH = 100; // 100%
  
  // State
  const [gameState, setGameState] = useState<RaceState>('SETUP');
  const [playerProgress, setPlayerProgress] = useState(0);
  const [botProgress, setBotProgress] = useState(0);
  const [botSpeed, setBotSpeed] = useState(25); // WPM equivalent
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [winner, setWinner] = useState<'player' | 'bot' | null>(null);

  // Refs
  const requestRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---
  const startRace = (speed: number) => {
    setBotSpeed(speed);
    
    // Select a long text from lessons for the track
    const sentences = STATIC_LESSONS.find(l => l.id === 'sent-1')?.content || 
                      "The quick brown fox jumps over the lazy dog. Practice makes perfect.";
    // Duplicate it to ensure it's long enough for a race
    const longText = (sentences + " ").repeat(5).trim();
    
    setText(longText);
    setInput('');
    setPlayerProgress(0);
    setBotProgress(0);
    setWpm(0);
    setStartTime(null);
    setWinner(null);
    setGameState('RACING');
    
    setTimeout(() => {
        inputRef.current?.focus();
        setStartTime(Date.now());
        prevTimeRef.current = Date.now();
        requestRef.current = requestAnimationFrame(animate);
    }, 100);
  };

  // --- Game Loop (Bot Movement) ---
  const animate = (time: number) => {
    if (gameState !== 'RACING') return;

    // Initialize prevTime on first frame
    if (!prevTimeRef.current) prevTimeRef.current = time;
    
    const now = Date.now();
    const deltaTime = now - prevTimeRef.current; // ms
    prevTimeRef.current = now;

    // Bot Logic: Move based on WPM
    // 1 WPM = 5 chars/min = 5/60 chars/sec = 1/12 chars/sec
    // Progress % = (Chars Typed / Total Chars) * 100
    
    // Calculate Bot % increment per ms
    // Chars per ms = (BotWPM * 5) / 60000
    const charsPerMs = (botSpeed * 5) / 60000;
    const progressPerMs = (charsPerMs / text.length) * 100;

    setBotProgress(prev => {
        const next = prev + (progressPerMs * deltaTime);
        if (next >= 100) {
            handleFinish('bot');
            return 100;
        }
        return next;
    });

    requestRef.current = requestAnimationFrame(() => animate(Date.now())); // Pass time for consistency
  };

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Player Logic ---
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'RACING') return;
    
    const val = e.target.value;
    
    // Validation
    if (!text.startsWith(val)) {
        playError();
        return; // Block input
    }
    
    playClick();
    setInput(val);
    
    // Calculate Progress
    const progress = (val.length / text.length) * 100;
    setPlayerProgress(progress);
    
    // Calculate Real-time WPM
    if (startTime) {
        const minutes = (Date.now() - startTime) / 60000;
        if (minutes > 0) {
            const currentWpm = Math.round((val.length / 5) / minutes);
            setWpm(currentWpm);
        }
    }

    // Auto-scroll text
    if (scrollRef.current) {
        // Simple scroll logic: keep cursor roughly centered or visible
        // We can approximate by char index width
        scrollRef.current.scrollLeft = val.length * 14; 
    }

    // Check Win
    if (val.length === text.length) {
        handleFinish('player');
    }
  };

  const handleFinish = (who: 'player' | 'bot') => {
    setWinner(who);
    setGameState('FINISHED');
    cancelAnimationFrame(requestRef.current);
    if (who === 'player') playSuccess();
    else playError();
  };

  // --- Render ---

  const renderSetup = () => (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
       <h2 className="text-6xl font-cartoon text-indigo-600 mb-2">🏁 打字赛跑</h2>
       <p className="text-xl text-slate-500 mb-8">选择你的对手难度</p>
       
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl px-4">
          <button onClick={() => startRace(20)} className="group relative bg-white p-6 rounded-2xl shadow-lg border-2 border-green-400 hover:border-green-500 hover:-translate-y-2 transition-all">
             <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🐢</div>
             <h3 className="text-2xl font-bold text-green-600">乌龟 (慢速)</h3>
             <p className="text-slate-400">20 WPM</p>
          </button>
          
          <button onClick={() => startRace(40)} className="group relative bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-400 hover:border-blue-500 hover:-translate-y-2 transition-all">
             <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🐕</div>
             <h3 className="text-2xl font-bold text-blue-600">猎狗 (中速)</h3>
             <p className="text-slate-400">40 WPM</p>
          </button>
          
          <button onClick={() => startRace(70)} className="group relative bg-white p-6 rounded-2xl shadow-lg border-2 border-red-400 hover:border-red-500 hover:-translate-y-2 transition-all">
             <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🐆</div>
             <h3 className="text-2xl font-bold text-red-600">猎豹 (极速)</h3>
             <p className="text-slate-400">70 WPM</p>
          </button>
       </div>
    </div>
  );

  const renderRace = () => {
     // Helper to render text with colors
     const renderText = () => {
        return text.split('').map((char, i) => {
           let color = 'text-slate-400';
           let bg = '';
           if (i < input.length) {
               color = 'text-green-600';
           } else if (i === input.length) {
               bg = 'bg-blue-100 border-b-2 border-blue-500';
               color = 'text-blue-600';
           }
           return <span key={i} className={`font-mono text-2xl ${color} ${bg}`}>{char}</span>;
        });
     };

     return (
        <div className="flex flex-col h-full max-w-5xl mx-auto w-full py-8 px-4">
           {/* Header */}
           <div className="flex justify-between items-center mb-8">
              <div className="bg-white px-4 py-2 rounded-xl shadow border border-slate-200">
                  <span className="text-slate-500 text-sm font-bold uppercase">你的速度</span>
                  <div className="text-2xl font-bold text-indigo-600">{wpm} WPM</div>
              </div>
              <h2 className="text-4xl font-cartoon text-slate-700">🏁 比赛进行中!</h2>
              <div className="bg-white px-4 py-2 rounded-xl shadow border border-slate-200">
                  <span className="text-slate-500 text-sm font-bold uppercase">对手速度</span>
                  <div className="text-2xl font-bold text-red-500">{botSpeed} WPM</div>
              </div>
           </div>

           {/* Track Area */}
           <div className="bg-slate-200 rounded-3xl p-6 shadow-inner border border-slate-300 mb-8 relative overflow-hidden">
              {/* Finish Line */}
              <div className="absolute right-8 top-0 bottom-0 w-4 bg-[url('https://www.transparenttextures.com/patterns/checkerboard-cross.png')] opacity-30 z-0"></div>

              {/* Lane 1: Player */}
              <div className="mb-8 relative z-10">
                 <div className="flex justify-between text-sm font-bold text-slate-500 mb-1">
                    <span>You (Player)</span>
                    <span>{Math.round(playerProgress)}%</span>
                 </div>
                 <div className="h-14 bg-white rounded-full relative flex items-center shadow-sm border border-slate-300">
                    <div 
                        className="absolute h-10 w-10 text-3xl transition-all duration-300 ease-linear flex items-center justify-center -ml-5"
                        style={{ left: `${Math.min(playerProgress, 95)}%` }}
                    >
                        🏎️
                    </div>
                    {/* Trail */}
                    <div className="h-full bg-blue-100/50 rounded-l-full" style={{ width: `${playerProgress}%` }}></div>
                 </div>
              </div>

              {/* Lane 2: Bot */}
              <div className="relative z-10">
                 <div className="flex justify-between text-sm font-bold text-slate-500 mb-1">
                    <span>Bot (Opponent)</span>
                    <span>{Math.round(botProgress)}%</span>
                 </div>
                 <div className="h-14 bg-white rounded-full relative flex items-center shadow-sm border border-slate-300">
                    <div 
                        className="absolute h-10 w-10 text-3xl transition-all duration-100 ease-linear flex items-center justify-center -ml-5"
                        style={{ left: `${Math.min(botProgress, 95)}%` }}
                    >
                        🤖
                    </div>
                    {/* Trail */}
                    <div className="h-full bg-red-100/50 rounded-l-full" style={{ width: `${botProgress}%` }}></div>
                 </div>
              </div>
           </div>

           {/* Typing Input Area */}
           <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex-1 flex flex-col overflow-hidden relative">
              <div 
                ref={scrollRef}
                className="flex-1 p-6 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center"
              >
                  {renderText()}
              </div>
              
              {/* Invisible Input to capture keystrokes */}
              <input 
                 ref={inputRef}
                 type="text" 
                 value={input} 
                 onChange={handleInput} 
                 className="absolute opacity-0 inset-0 cursor-default" 
                 autoFocus
                 onBlur={() => inputRef.current?.focus()} 
              />
              
              <div className="bg-slate-50 p-3 text-center text-slate-400 text-sm border-t border-slate-100">
                  保持专注，不要按错！
              </div>
           </div>
        </div>
     );
  };

  const renderFinished = () => (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center animate-fade-in backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl transform scale-100 animate-bounce-slow">
            <div className="text-8xl mb-4">
                {winner === 'player' ? '🏆' : '😢'}
            </div>
            <h2 className={`text-5xl font-cartoon mb-4 ${winner === 'player' ? 'text-yellow-500' : 'text-slate-500'}`}>
                {winner === 'player' ? '你赢了！' : '惜败对手'}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-xl">
               <div>
                  <p className="text-slate-400 text-sm font-bold uppercase">你的速度</p>
                  <p className="text-3xl font-bold text-blue-600">{wpm}</p>
               </div>
               <div>
                  <p className="text-slate-400 text-sm font-bold uppercase">对手速度</p>
                  <p className="text-3xl font-bold text-red-500">{botSpeed}</p>
               </div>
            </div>

            <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setGameState('SETUP')} 
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-105"
                >
                    再来一局
                </button>
                <button 
                  onClick={onExit} 
                  className="px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                >
                    退出
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden">
       {/* Exit Button */}
       <button 
        onClick={onExit}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-white/80 hover:bg-white text-slate-600 rounded-lg shadow-sm border border-slate-200 font-bold backdrop-blur"
       >
        退出
       </button>

       {gameState === 'SETUP' && renderSetup()}
       {(gameState === 'RACING' || gameState === 'FINISHED') && renderRace()}
       {gameState === 'FINISHED' && renderFinished()}
    </div>
  );
};

export default RaceGame;