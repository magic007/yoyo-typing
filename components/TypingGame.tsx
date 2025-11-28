import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameWord } from '../types';
import { GAME_WORDS } from '../constants';

interface TypingGameProps {
  onExit: () => void;
}

const TypingGame: React.FC<TypingGameProps> = ({ onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [words, setWords] = useState<GameWord[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  
  const requestRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const speedMultiplier = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start Game Handler
  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setWords([]);
    setInput('');
    
    // Reset timers
    const now = performance.now();
    lastSpawnRef.current = 0; // Force immediate spawn on first loop
    previousTimeRef.current = now;
    speedMultiplier.current = 1;
    
    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Game Loop
  const animate = useCallback((time: number) => {
    if (gameOver || !isPlaying) return;

    // Calculate Delta Time (ms)
    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;

    // Safety: If delta time is huge (e.g. tab switch, initial lag), skip this frame's movement
    // or clamp it to a reasonable max (e.g., 50ms) to prevent teleporting words.
    // 100ms is about 6 frames at 60fps.
    if (deltaTime > 100) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Spawn new word logic
    // Spawn rate: base 2000ms, gets faster with speedMultiplier
    const spawnInterval = 2000 / Math.pow(speedMultiplier.current, 0.5);
    
    if (time - lastSpawnRef.current > spawnInterval) {
      const text = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
      
      // Speed: percent height per millisecond
      // Base: 0.005% per ms (approx 20s to fall) to 0.015% per ms (approx 7s)
      // Multiplier increases this.
      const baseSpeed = 0.005 + (Math.random() * 0.008); 
      
      const newWord: GameWord = {
        id: Date.now().toString() + Math.random(),
        text,
        x: Math.random() * 80 + 5, // 5% to 85% width
        y: -15, // Start above screen
        speed: baseSpeed * speedMultiplier.current
      };
      setWords(prev => [...prev, newWord]);
      lastSpawnRef.current = time;
    }

    // Move words
    setWords(prev => {
      const nextWords: GameWord[] = [];
      let livesLost = 0;

      prev.forEach(w => {
        // Move by speed * time elapsed
        const moveAmount = w.speed * deltaTime;
        const nextY = w.y + moveAmount;
        
        if (nextY > 105) { // Allow to go slightly below 100 before counting as miss
          livesLost++;
        } else {
          nextWords.push({ ...w, y: nextY });
        }
      });

      if (livesLost > 0) {
        setLives(l => {
          const newLives = l - livesLost;
          if (newLives <= 0) {
             setGameOver(true);
             setIsPlaying(false); // Stop loop immediately
             return 0;
          }
          return newLives;
        });
      }
      
      return nextWords;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [gameOver, isPlaying]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      // Initialize previousTimeRef to avoid a large jump on the first frame
      previousTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate, isPlaying, gameOver]);

  // Difficulty scaling
  useEffect(() => {
    // Increase speed more gradually: score / 2500 instead of / 500
    // This allows students to play longer before it gets too fast
    speedMultiplier.current = 1 + (score / 2500);
  }, [score]);

  // Input handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toLowerCase();
    setInput(val);

    const matchIndex = words.findIndex(w => w.text === val);
    if (matchIndex !== -1) {
      // Word cleared
      const word = words[matchIndex];
      setWords(prev => prev.filter((_, i) => i !== matchIndex));
      setScore(s => s + word.text.length * 10);
      setInput(''); // Clear input
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700 min-h-[400px]">
      
      {/* HUD - Top Status Bar */}
      <div className="flex justify-between items-center p-4 bg-slate-800 text-white z-10 shrink-0 shadow-md border-b border-slate-700">
        <div className="flex gap-4 sm:gap-6 items-center flex-wrap">
          {/* Score */}
          <span className="font-cartoon text-xl sm:text-2xl text-yellow-400 drop-shadow-md whitespace-nowrap">
            得分: {score}
          </span>
          
          {/* Lives Display - Explicit Text + Icons */}
          <div className="flex items-center gap-3 bg-slate-700/50 px-3 py-1 rounded-lg border border-slate-600">
            <span className="text-sm text-slate-300 font-bold whitespace-nowrap">
              剩余生命: <span className="text-white text-lg">{lives}</span>
            </span>
            <div className="flex gap-0.5">
               {Array.from({length: 3}).map((_, i) => (
                  <span key={i} className={`text-xl ${i < lives ? "grayscale-0 opacity-100 scale-110" : "grayscale opacity-20 scale-90"} transition-all duration-300`}>❤️</span>
               ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Difficulty Badge */}
          <div className="hidden sm:block px-3 py-1 rounded-full bg-slate-700 text-xs text-slate-300 font-mono border border-slate-600 whitespace-nowrap">
             SPEED: {speedMultiplier.current.toFixed(1)}x
          </div>

          <button onClick={onExit} className="px-4 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm font-bold transition-colors border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 whitespace-nowrap">
            退出游戏
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative flex-1 w-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
        
        {/* Words */}
        {isPlaying && !gameOver && words.map(w => {
          const isMatch = input.length > 0 && w.text.startsWith(input);
          return (
            <div
              key={w.id}
              className={`absolute px-3 py-1.5 backdrop-blur-md rounded-xl font-mono text-lg font-bold border-2 transition-transform duration-75 will-change-transform
                ${isMatch 
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-100 z-20 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.5)]' 
                  : 'bg-white/10 border-white/20 text-white z-10 shadow-lg'}`}
              style={{
                left: `${w.x}%`,
                top: `${w.y}%`,
              }}
            >
              {isMatch ? (
                <>
                  <span className="text-yellow-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">{w.text.slice(0, input.length)}</span>
                  <span className="opacity-70">{w.text.slice(input.length)}</span>
                </>
              ) : (
                <span className="drop-shadow-md">{w.text}</span>
              )}
            </div>
          );
        })}

        {/* Start Screen Overlay */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
             <div className="text-center animate-bounce-slow">
               <h2 className="text-6xl font-cartoon text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 drop-shadow-sm">单词雨</h2>
               <p className="text-slate-400 mb-8 text-xl font-medium">Type Fast or Die Trying!</p>
             </div>
             
             <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-8 max-w-md text-center">
                <p className="text-slate-300 mb-2">🎮 游戏规则</p>
                <ul className="text-sm text-slate-400 space-y-1 text-left inline-block">
                   <li>• 单词落地前输入完整拼写</li>
                   <li>• 漏掉一个单词扣除 1 点生命</li>
                   <li>• 3 点生命全部扣完则游戏结束</li>
                   <li>• 随着分数增加，速度会变快！</li>
                </ul>
             </div>

             <button 
               onClick={startGame}
               className="group relative px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-2xl shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all hover:scale-105 active:scale-95"
             >
               <span className="mr-2">🚀</span> 开始挑战
               <div className="absolute inset-0 rounded-full ring-2 ring-white/30 group-hover:ring-4 transition-all"></div>
             </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in">
            <h2 className="text-7xl font-cartoon text-red-500 mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">GAME OVER</h2>
            <div className="text-3xl text-white mb-10 font-bold">
               最终得分: <span className="text-yellow-400 text-4xl ml-2">{score}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center px-8">
               <button 
                 onClick={startGame}
                 className="flex-1 sm:flex-none px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold rounded-full text-xl shadow-lg transition-transform hover:scale-105 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1"
               >
                 🔄 再玩一次
               </button>
               <button 
                 onClick={onExit}
                 className="flex-1 sm:flex-none px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full text-xl shadow-lg transition-transform hover:scale-105 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
               >
                 🚪 退出
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Zone */}
      <div className="p-6 bg-slate-800 flex justify-center z-10 shrink-0 border-t border-slate-700">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={!isPlaying ? "准备好了吗？" : "在此输入掉落的单词..."}
          disabled={!isPlaying || gameOver}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className="w-full max-w-lg px-6 py-4 text-2xl font-mono text-center rounded-xl bg-slate-900 text-white border-2 border-slate-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 focus:outline-none placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
      </div>
    </div>
  );
};

export default TypingGame;