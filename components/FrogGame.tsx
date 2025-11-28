
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_WORDS, STATIC_LESSONS } from '../constants';
import { playClick, playError, playSuccess } from '../services/soundService';

interface FrogGameProps {
  onExit: () => void;
}

// 游戏模式定义
type GameMode = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

interface GameConfig {
  mode: GameMode;
  laneCount: number;
  baseSpeed: number;
  wordType: 'CHAR' | 'SHORT_WORD' | 'LONG_WORD';
  isStatic: boolean; // 是否静止
  hasLives: boolean; // 是否有生命值
  lives: number;
  description: string;
  title: string;
}

// 每一行荷叶的数据结构
interface LaneObject {
  id: string;
  word: string;
  x: number; // 0 to 100%
  width: number; // %
  speed: number; // % per ms
  direction: 1 | -1;
  type: 'LILYPAD' | 'LOG' | 'STONE';
}

const CONFIGS: Record<GameMode, GameConfig> = {
  BEGINNER: {
    mode: 'BEGINNER',
    title: '入门级 (指法练习)',
    description: '3层荷叶 · 静止不动 · 单字母练习 · 无需担心失败',
    laneCount: 3,
    baseSpeed: 0,
    wordType: 'CHAR',
    isStatic: true,
    hasLives: false,
    lives: 999
  },
  INTERMEDIATE: {
    mode: 'INTERMEDIATE',
    title: '进阶级 (单词拼写)',
    description: '5层荷叶 · 缓慢移动 · 短单词 · 3条生命',
    laneCount: 5,
    baseSpeed: 0.002,
    wordType: 'SHORT_WORD',
    isStatic: false,
    hasLives: true,
    lives: 3
  },
  EXPERT: {
    mode: 'EXPERT',
    title: '高手级 (极速挑战)',
    description: '8层荷叶 · 快速交错 · 长单词 · 挑战手速极限',
    laneCount: 8,
    baseSpeed: 0.005,
    wordType: 'LONG_WORD',
    isStatic: false,
    hasLives: true,
    lives: 3
  }
};

const FrogGame: React.FC<FrogGameProps> = ({ onExit }) => {
  // --- State ---
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER' | 'VICTORY'>('MENU');
  
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  // Lanes: Index 0 is unused (Start Bank). Index 1..N are lanes. N+1 is Goal.
  const [laneObjects, setLaneObjects] = useState<LaneObject[]>([]);
  
  const [frogRow, setFrogRow] = useState(0);
  const [frogX, setFrogX] = useState(50);
  const [frogState, setFrogState] = useState<'IDLE' | 'JUMP' | 'SINK' | 'VICTORY' | 'SHAKE'>('IDLE');
  
  const [input, setInput] = useState('');

  // Refs
  const requestRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const speedMultiplier = useRef(1.0);

  // --- Content Generators ---

  const getRandomChar = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const getRandomWord = (type: 'SHORT_WORD' | 'LONG_WORD') => {
    // Filter words based on length
    const shortWords = GAME_WORDS.filter(w => w.length <= 4);
    const longWords = GAME_WORDS.filter(w => w.length > 4);
    
    // Add some extra long words for expert mode
    const extraLong = ["typing", "master", "student", "keyboard", "practice", "school", "friend", "animal"];
    
    const source = type === 'SHORT_WORD' ? shortWords : [...longWords, ...extraLong];
    return source[Math.floor(Math.random() * source.length)] || "bug";
  };

  const generateLevelData = (mode: GameMode, lvl: number) => {
    const config = CONFIGS[mode];
    const newLanes: LaneObject[] = [];
    
    for (let i = 1; i <= config.laneCount; i++) {
      let word = "";
      if (config.wordType === 'CHAR') word = getRandomChar();
      else word = getRandomWord(config.wordType);

      // Speed calculation
      let speed = config.baseSpeed;
      if (!config.isStatic) {
        speed += (lvl * 0.0002); // Increment slightly per level
        // Random variance per lane
        speed *= (0.8 + Math.random() * 0.4); 
      }

      // Direction: Alternate or Random
      const direction = i % 2 !== 0 ? 1 : -1;

      // Position:
      // If static: Center or spread out slightly
      // If dynamic: Random 10-90
      let startX = 50;
      if (!config.isStatic) {
        startX = 15 + Math.random() * 70;
      } else {
        // Stagger static pads slightly for visual interest
        startX = 50 + (i % 2 === 0 ? 10 : -10); 
      }

      newLanes.push({
        id: `row-${i}-${Date.now()}-${Math.random()}`,
        word,
        x: startX,
        width: config.mode === 'EXPERT' ? 18 : 22, // Smaller pads for expert
        speed,
        direction,
        type: config.mode === 'BEGINNER' ? 'LILYPAD' : (i % 2 === 0 ? 'LOG' : 'LILYPAD')
      });
    }
    return newLanes;
  };

  // --- Game Flow ---

  const selectMode = (mode: GameMode) => {
    setCurrentMode(mode);
    startGame(mode);
  };

  const startGame = (mode: GameMode) => {
    const config = CONFIGS[mode];
    setGameState('PLAYING');
    setLevel(1);
    setScore(0);
    setLives(config.lives);
    setInput('');
    resetFrog();
    
    setLaneObjects(generateLevelData(mode, 1));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const resetFrog = () => {
    setFrogRow(0);
    setFrogX(50);
    setFrogState('IDLE');
  };

  const nextLevel = () => {
    if (!currentMode) return;
    const nextLvl = level + 1;
    setLevel(nextLvl);
    setScore(s => s + (currentMode === 'EXPERT' ? 100 : 50));
    setLaneObjects(generateLevelData(currentMode, nextLvl));
    resetFrog();
    setInput('');
    setGameState('PLAYING'); // Resume
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // --- Animation Loop ---

  const animate = useCallback((time: number) => {
    if (gameState !== 'PLAYING' || !currentMode) return;
    const config = CONFIGS[currentMode];

    const deltaTime = time - prevTimeRef.current;
    prevTimeRef.current = time;

    // Skip large jumps
    if (deltaTime > 100) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    let isDead = false;

    // Only move if not static
    if (!config.isStatic) {
      setLaneObjects(prevLanes => {
        return prevLanes.map((lane, index) => {
          const rowNumber = index + 1;
          
          const moveAmount = lane.speed * lane.direction * deltaTime * 10;
          let nextX = lane.x + moveAmount;
          let nextDir = lane.direction;

          // Bounce logic
          if (nextX > 90) { nextDir = -1; nextX = 90; }
          if (nextX < 10) { nextDir = 1; nextX = 10; }

          // Sync Frog
          if (frogRow === rowNumber && frogState !== 'JUMP' && frogState !== 'VICTORY') {
             setFrogX(nextX);
             // Basic boundary check (though bounce prevents falling usually)
             if (nextX < 0 || nextX > 100) isDead = true;
          }

          return { ...lane, x: nextX, direction: nextDir };
        });
      });
    }

    if (isDead) {
      handleLifeLoss();
      return;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, currentMode, frogRow, frogState]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      prevTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate, gameState]);

  // --- Logic ---

  const handleLifeLoss = () => {
    if (!currentMode) return;
    const config = CONFIGS[currentMode];

    playError();
    
    // Static mode: no life loss, just visual shake (handled in input)
    if (config.isStatic) return;

    setFrogState('SINK');
    setLives(l => {
      const newLives = l - 1;
      if (newLives <= 0) {
        setGameState('GAME_OVER');
      } else {
        // Reset frog after delay
        setTimeout(() => {
          resetFrog();
          setInput('');
        }, 800);
      }
      return newLives;
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'PLAYING' || frogState === 'JUMP' || frogState === 'VICTORY' || !currentMode) return;

    const val = e.target.value.toLowerCase().trim();
    const config = CONFIGS[currentMode];
    
    // Target is always next row
    const targetRowIndex = frogRow; 
    if (targetRowIndex >= laneObjects.length) return;
    const targetObject = laneObjects[targetRowIndex];

    // Check matching
    if (!targetObject.word.startsWith(val)) {
      playError();
      setInput(''); // Clear input
      
      if (config.mode === 'BEGINNER') {
        // Beginner: Shake indicator, no penalty
        setFrogState('SHAKE');
        setTimeout(() => setFrogState('IDLE'), 300);
      } else {
        // Others: Penalty
        handleLifeLoss();
      }
      return;
    }

    // Input correct so far
    playClick();
    setInput(val);

    // Full word match?
    if (val === targetObject.word) {
      playSuccess();
      setInput('');
      triggerJump(targetRowIndex + 1, targetObject.x);
    }
  };

  const triggerJump = (nextRow: number, landingX: number) => {
    setFrogState('JUMP');
    setFrogX(landingX);
    
    setTimeout(() => {
      setFrogRow(nextRow);
      setScore(s => s + 10);

      // Check if reached Goal
      if (currentMode && nextRow === CONFIGS[currentMode].laneCount + 1) {
         // Reached goal
         setFrogState('VICTORY');
         setGameState('VICTORY'); // Show level complete overlay
      } else {
         setFrogState('IDLE');
      }
    }, 300);
  };

  // --- Rendering ---

  // Helper to calculate positions based on lane count
  const getLayout = (laneCount: number) => {
    // Top bank 15%, Bottom bank 15%, River 70%
    const riverH = 70;
    const rowH = riverH / laneCount;
    return { rowH };
  };

  const renderMenu = () => (
    <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-cartoon text-green-400 mb-8 animate-bounce-slow">🐸 青蛙过河</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
         {(['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as GameMode[]).map(m => (
           <button 
             key={m}
             onClick={() => selectMode(m)}
             className={`
               relative group p-6 rounded-2xl border-4 transition-all hover:-translate-y-2
               ${m === 'BEGINNER' ? 'bg-green-100 border-green-500 hover:shadow-green-500/50' : ''}
               ${m === 'INTERMEDIATE' ? 'bg-blue-100 border-blue-500 hover:shadow-blue-500/50' : ''}
               ${m === 'EXPERT' ? 'bg-purple-100 border-purple-500 hover:shadow-purple-500/50' : ''}
             `}
           >
             <div className="text-4xl mb-4 text-center">
               {m === 'BEGINNER' ? '👶' : m === 'INTERMEDIATE' ? '👦' : '🧑‍🎓'}
             </div>
             <h3 className={`text-2xl font-bold mb-2 text-center
                ${m === 'BEGINNER' ? 'text-green-700' : ''}
                ${m === 'INTERMEDIATE' ? 'text-blue-700' : ''}
                ${m === 'EXPERT' ? 'text-purple-700' : ''}
             `}>{CONFIGS[m].title}</h3>
             <p className="text-slate-600 text-sm text-center font-bold opacity-80 mb-4">{CONFIGS[m].description}</p>
             
             {m === 'EXPERT' && (
               <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">挑战！</div>
             )}
           </button>
         ))}
      </div>
      <button onClick={onExit} className="mt-12 text-slate-500 hover:text-white underline">返回主菜单</button>
    </div>
  );

  const renderGame = () => {
    if (!currentMode) return null;
    const config = CONFIGS[currentMode];
    const { rowH } = getLayout(config.laneCount);

    return (
      <div className="w-full h-full relative bg-cyan-800 overflow-hidden flex flex-col font-sans select-none">
        
        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center p-4 bg-black/30 text-white backdrop-blur-sm">
           <div className="flex gap-6 items-center">
              <span className="px-2 py-1 bg-white/20 rounded font-bold text-sm">{config.title}</span>
              <span className="font-cartoon text-xl text-yellow-300">Level {level}</span>
              <span className="font-mono font-bold">Score: {score}</span>
           </div>
           
           {config.hasLives && (
             <div className="flex gap-1">
                {Array.from({length: config.lives}).map((_, i) => (
                  <span key={i} className={`text-xl ${i < lives ? 'opacity-100' : 'opacity-20 grayscale'}`}>❤️</span>
                ))}
             </div>
           )}
           
           <button onClick={() => setGameState('MENU')} className="px-3 py-1 bg-red-500/80 hover:bg-red-500 rounded text-sm font-bold">
             结束
           </button>
        </div>

        {/* --- GAME SCENE --- */}
        <div className="flex-1 relative w-full bg-[#4fc3f7]">
           {/* Water Texture */}
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

           {/* TOP BANK (GOAL) */}
           <div className="absolute top-0 w-full h-[15%] bg-emerald-600 border-b-8 border-emerald-800 z-10 flex items-center justify-center shadow-lg">
              <div className="text-4xl opacity-50 tracking-[1rem]">🏁🏁🏁</div>
           </div>

           {/* LANES */}
           {laneObjects.map((lane, index) => {
             // Calculate Top Position
             // Goal is top 15%. Start is bottom 15%. River is middle 70%.
             // Lane 1 is bottom-most river lane. Lane N is top-most.
             // We map index 0 (Lane 1) to the bottom of the river section.
             const laneIndex = index; // 0 to N-1
             const topPos = 15 + ((config.laneCount - 1 - laneIndex) * rowH);
             
             const isNextTarget = (frogRow === laneIndex);
             const showError = isNextTarget && frogState === 'SHAKE';

             return (
               <div 
                 key={lane.id}
                 className="absolute w-full border-t border-b border-white/10"
                 style={{ top: `${topPos}%`, height: `${rowH}%` }}
               >
                 <div className="absolute w-full h-full flex items-center" 
                      style={{ 
                        left: `${lane.x}%`, 
                        width: `${lane.width}%`,
                        transform: 'translateX(-50%)',
                        transition: config.isStatic ? 'none' : 'left 0.1s linear' // Smooth out visual jitters
                      }}>
                    
                    {/* The Pad/Log */}
                    <div className={`
                       relative w-full h-[80%] flex items-center justify-center shadow-lg transition-transform
                       ${lane.type === 'LOG' ? 'bg-amber-700 rounded-sm border-y-4 border-amber-900' : 'bg-green-500 rounded-full border-4 border-green-700'}
                       ${isNextTarget ? 'ring-4 ring-yellow-400 scale-105 z-20' : 'opacity-90'}
                       ${showError ? 'animate-shake ring-red-500 ring-4' : ''}
                    `}>
                       {/* Word Label */}
                       <span className={`
                          font-mono font-bold text-white drop-shadow-md bg-black/40 px-2 py-0.5 rounded
                          ${config.mode === 'EXPERT' ? 'text-sm md:text-base' : 'text-xl md:text-2xl'}
                          ${isNextTarget ? 'text-yellow-200' : ''}
                       `}>
                          {isNextTarget ? (
                            <>
                              <span className="text-green-400">{lane.word.slice(0, input.length)}</span>
                              <span>{lane.word.slice(input.length)}</span>
                            </>
                          ) : lane.word}
                       </span>
                    </div>

                 </div>
               </div>
             )
           })}

           {/* BOTTOM BANK (START) */}
           <div className="absolute bottom-0 w-full h-[15%] bg-emerald-600 border-t-8 border-emerald-800 z-10 flex items-center justify-center shadow-lg">
              {frogRow === 0 && <div className="text-white/60 font-bold animate-pulse">START</div>}
           </div>

           {/* FROG */}
           {(() => {
              // Calculate Frog Y
              let frogTop = 92.5; // Center of bottom bank (15% height -> center is 7.5% from bottom -> 92.5% top)
              
              if (frogRow === 0) {
                 frogTop = 92.5;
              } else if (frogRow === config.laneCount + 1) {
                 frogTop = 7.5; // Center of top bank
              } else {
                 // On a lane
                 const laneIndex = frogRow - 1;
                 const laneTop = 15 + ((config.laneCount - 1 - laneIndex) * rowH);
                 frogTop = laneTop + (rowH / 2);
              }

              return (
                <div 
                  className={`
                    absolute flex items-center justify-center transition-all duration-300 z-30
                    ${frogState === 'JUMP' ? 'scale-150 z-50' : 'scale-100'}
                    ${frogState === 'SINK' ? 'scale-0 rotate-180 opacity-0' : ''}
                  `}
                  style={{
                    top: `${frogTop}%`,
                    left: `${frogX}%`,
                    width: '4rem',
                    height: '4rem',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                   <div className="text-5xl drop-shadow-2xl">
                     {frogState === 'VICTORY' ? '🥳' : '🐸'}
                   </div>
                   {/* Input Bubble */}
                   {input && frogState !== 'VICTORY' && (
                     <div className="absolute -top-8 bg-white text-slate-900 px-2 py-1 rounded text-xs font-bold whitespace-nowrap border-2 border-slate-300">
                       {input}
                     </div>
                   )}
                </div>
              );
           })()}

        </div>

        {/* Input Capture */}
        <input 
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInput}
          className="absolute opacity-0 top-0 left-0 w-full h-full cursor-default"
          autoFocus
          onBlur={() => !['MENU', 'GAME_OVER', 'VICTORY'].includes(gameState) && inputRef.current?.focus()}
        />

        {/* --- OVERLAYS --- */}

        {/* Level Complete Overlay */}
        {gameState === 'VICTORY' && (
           <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
              <div className="text-6xl mb-4 animate-bounce">🌟</div>
              <h2 className="text-5xl font-cartoon text-yellow-300 mb-2">过关成功!</h2>
              <p className="text-white text-xl mb-8">青蛙成功抵达对岸</p>
              <button 
                onClick={nextLevel}
                className="px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold rounded-full text-2xl shadow-xl hover:scale-105 transition-transform"
              >
                下一关 ➡️
              </button>
           </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAME_OVER' && (
           <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
              <div className="text-6xl mb-4">💦</div>
              <h2 className="text-5xl font-cartoon text-red-500 mb-4">挑战失败</h2>
              <p className="text-slate-300 text-xl mb-8">最终得分: {score}</p>
              <div className="flex gap-4">
                 <button onClick={() => currentMode && startGame(currentMode)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-lg">重试本关</button>
                 <button onClick={() => setGameState('MENU')} className="px-8 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-full text-lg">返回菜单</button>
              </div>
           </div>
        )}

      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {gameState === 'MENU' ? renderMenu() : renderGame()}
    </div>
  );
};

export default FrogGame;
