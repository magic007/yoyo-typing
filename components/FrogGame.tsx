import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_WORDS } from '../constants';
import { playClick, playError, playSuccess } from '../services/soundService';

interface FrogGameProps {
  onExit: () => void;
}

// Lane definition
interface Lane {
  id: string;
  word: string;
  speed: number; // % screen width per frame (scaled by delta)
  direction: 1 | -1; // 1 = Left to Right, -1 = Right to Left
  x: number; // 0 to 100%
  width: number; // visual width in %
  type: 'LILYPAD' | 'LOG';
}

const FrogGame: React.FC<FrogGameProps> = ({ onExit }) => {
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [input, setInput] = useState('');
  
  // Animation State
  const [frogState, setFrogState] = useState<'IDLE' | 'JUMP' | 'SINK'>('IDLE');
  const [frogX, setFrogX] = useState(50); // Visual X position of frog (percent)
  const [isJumping, setIsJumping] = useState(false); // Pause game loop during jump
  
  // Refs
  const requestRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const speedMultiplier = useRef(1.0);

  // Constants
  const LANE_COUNT = 5; // Number of visible lanes ahead

  // --- Logic ---

  const generateLane = (idPrefix: string, index: number): Lane => {
    const word = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    // Base speed increases with score
    const baseSpeed = 0.005 + (Math.random() * 0.008); 
    // Speed is units per ms. 0.01 is fast. 0.005 is roughly 20s to cross.
    const speed = baseSpeed * speedMultiplier.current;

    // Start position depends on direction
    const startX = direction === 1 ? -20 : 120;

    return {
      id: `${idPrefix}-${index}`,
      word,
      speed,
      direction,
      x: startX,
      width: 20, 
      type: Math.random() > 0.7 ? 'LOG' : 'LILYPAD'
    };
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setInput('');
    setFrogState('IDLE');
    setFrogX(50);
    setIsJumping(false);
    speedMultiplier.current = 1.0;

    // Generate initial lanes
    const initialLanes = Array.from({ length: LANE_COUNT }).map((_, i) => {
        const lane = generateLane('init', i);
        // Pre-position them in the middle for the start
        lane.x = 20 + Math.random() * 60;
        return lane;
    });
    setLanes(initialLanes);

    prevTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(animate);
    
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const animate = useCallback((time: number) => {
    if (gameOver || !isPlaying) return;

    const deltaTime = time - prevTimeRef.current;
    prevTimeRef.current = time;

    // Skip updates if huge lag or strictly paused for jump
    if (deltaTime > 100 || isJumping) {
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    // 1. Move Lanes
    setLanes(prevLanes => {
        const nextLanes = prevLanes.map((lane) => {
            const moveAmount = lane.speed * deltaTime * lane.direction * 10; // *10 scaling factor for visible speed
            const newX = lane.x + moveAmount;
            return { ...lane, x: newX };
        });

        // 2. Check Collision (Did the target lane move off screen?)
        if (nextLanes.length > 0) {
            const target = nextLanes[0];
            const isOffScreen = target.direction === 1 ? target.x > 115 : target.x < -15;
            
            if (isOffScreen) {
                // If we miss the lane, it's game over
                handleGameOver();
                return nextLanes;
            }
        }

        return nextLanes;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [gameOver, isPlaying, isJumping]); // Added isJumping dependency

  const handleGameOver = () => {
      setFrogState('SINK');
      playError();
      setGameOver(true);
      setIsPlaying(false);
      cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => {
      return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // --- Input ---
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isPlaying || gameOver || isJumping) return;
      
      const val = e.target.value.toLowerCase().trim();
      
      // Target is always lane 0
      const targetLane = lanes[0];
      if (!targetLane) return;

      if (!targetLane.word.startsWith(val)) {
          playError();
          return; 
      }
      
      playClick();
      setInput(val);

      if (val === targetLane.word) {
          playSuccess();
          triggerJump(targetLane);
      }
  };

  const triggerJump = (target: Lane) => {
      setIsJumping(true); // Pause lane movement
      setFrogState('JUMP');
      setFrogX(target.x); // Visual jump to the pad's X position
      
      const newScore = score + 1;
      setScore(newScore);
      
      if (newScore % 5 === 0) {
          speedMultiplier.current += 0.1;
      }

      setInput('');

      // Sequence: Jump up (300ms) -> Shift World (reset) -> Land
      setTimeout(() => {
        setLanes(prev => {
            const remaining = prev.slice(1);
            const newLane = generateLane(`lane-${Date.now()}`, remaining.length);
            return [...remaining, newLane];
        });
        
        // Reset frog to center for the new layout (optional, but keeps game centered)
        setFrogX(50); 
        setFrogState('IDLE');
        setIsJumping(false); // Resume movement
        
        // Note: We need to reset time ref to avoid jumpy delta after pause
        prevTimeRef.current = performance.now();

      }, 400); // Matches transition duration
  };

  // --- Render ---

  return (
    <div className="w-full h-full bg-cyan-900 relative overflow-hidden flex flex-col font-sans select-none">
       {/* Water Background Texture */}
       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
       
       {/* UI HUD */}
       <div className="relative z-20 flex justify-between items-center p-4 bg-cyan-950/50 backdrop-blur-md border-b border-cyan-700 text-white shadow-lg">
          <div className="flex items-center gap-4">
              <span className="text-3xl">🐸</span>
              <div>
                  <div className="text-xs text-cyan-300 font-bold uppercase tracking-wider">Score</div>
                  <div className="text-2xl font-bold font-mono text-yellow-400">{score}</div>
              </div>
          </div>
          
          {isPlaying && !gameOver && (
              <div className="bg-cyan-800 px-4 py-1 rounded-full text-cyan-200 text-sm font-bold border border-cyan-600">
                  速度: {speedMultiplier.current.toFixed(1)}x
              </div>
          )}

          <button onClick={onExit} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold border border-slate-500">
              退出
          </button>
       </div>

       {/* Game Area */}
       <div className="flex-1 relative flex flex-col justify-end pb-24 overflow-hidden perspective-1000">
          
          {/* Lanes */}
          {lanes.map((lane, index) => {
              // Lane 0 is closest (bottom)
              const bottomOffset = 180 + (index * 100); 
              const scale = 1 - (index * 0.05); 
              const opacity = 1 - (index * 0.15); 
              
              const isTarget = index === 0;

              return (
                  <div 
                    key={lane.id}
                    className="absolute w-full h-20 flex items-center transition-all duration-300"
                    style={{ 
                        bottom: `${bottomOffset}px`,
                        zIndex: 10 - index,
                        opacity: opacity,
                        transform: `scale(${scale})`
                    }}
                  >
                      {/* River Lane Visual */}
                      <div className="absolute inset-0 bg-blue-500/10 border-t border-b border-blue-400/20 w-full"></div>

                      {/* Moving Object (Pad/Log) */}
                      <div 
                        className="absolute flex flex-col items-center justify-center will-change-transform"
                        style={{ 
                            left: `${lane.x}%`, 
                            width: '180px', 
                            transform: 'translateX(-50%)',
                            transition: isJumping ? 'none' : 'left 0.1s linear' // Allow smooth CSS interpolation if JS lags slightly, but manual updates override
                        }}
                      >
                          {/* Sprite */}
                          <div className={`
                             w-32 h-12 rounded-full shadow-lg flex items-center justify-center mb-2 relative transition-transform
                             ${lane.type === 'LILYPAD' ? 'bg-green-600 border-4 border-green-800' : 'bg-amber-800 border-4 border-amber-950 rounded-sm'}
                             ${isTarget ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] scale-110' : ''}
                          `}>
                              {/* Decor */}
                              {lane.type === 'LILYPAD' && <div className="absolute top-1 right-2 w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-cyan-900/40 -rotate-45"></div>}
                          </div>

                          {/* Text Label */}
                          <div className={`
                             px-3 py-1 rounded-lg font-mono font-bold text-xl backdrop-blur-sm shadow-md whitespace-nowrap transition-colors
                             ${isTarget ? 'bg-black/70 text-white border border-yellow-400/50' : 'bg-black/30 text-white/70'}
                          `}>
                              {isTarget ? (
                                  <>
                                    <span className="text-green-400">{lane.word.slice(0, input.length)}</span>
                                    <span>{lane.word.slice(input.length)}</span>
                                  </>
                              ) : (
                                  lane.word
                              )}
                          </div>
                      </div>
                  </div>
              );
          })}

          {/* Frog Character */}
          <div 
            className={`
             absolute bottom-[40px] z-20 transition-all duration-300 ease-out
             ${frogState === 'SINK' ? 'translate-y-[50px] opacity-0 rotate-12' : ''}
            `}
            style={{
                left: `${frogX}%`,
                transform: `translateX(-50%) ${frogState === 'JUMP' ? 'translateY(-140px) scale(1.5)' : 'translateY(0) scale(1)'}`
            }}
          >
             <div className="text-7xl filter drop-shadow-xl">🐸</div>
             {/* Ripple if idle */}
             {frogState === 'IDLE' && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black/20 rounded-full blur-sm animate-pulse"></div>}
          </div>

          {/* Input Focus Helper Text */}
          <div className="absolute bottom-6 w-full text-center text-cyan-200/50 text-sm font-bold tracking-widest uppercase">
              {isPlaying ? (gameOver ? "GAME OVER" : "输入单词以跳跃!") : "准备开始"}
          </div>

       </div>

       {/* Start Screen */}
       {!isPlaying && !gameOver && (
           <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
               <h1 className="text-6xl font-cartoon text-green-400 mb-2 drop-shadow-[0_4px_0_rgba(0,0,0,1)]">青蛙过河</h1>
               <p className="text-xl text-cyan-100 mb-8 font-medium">跟着节奏打字，帮助青蛙跳到荷叶上！</p>
               <button 
                  onClick={startGame}
                  className="px-10 py-4 bg-green-500 hover:bg-green-400 text-green-900 rounded-full font-bold text-2xl shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-transform hover:scale-105"
               >
                   开始跳跃 🚀
               </button>
           </div>
       )}

       {/* Game Over Screen */}
       {gameOver && (
           <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-fade-in">
               <div className="text-8xl mb-4">💦</div>
               <h2 className="text-5xl font-cartoon text-cyan-300 mb-4">落水啦!</h2>
               <div className="text-2xl text-white mb-8 font-bold">
                   最终得分: <span className="text-yellow-400 text-3xl ml-2">{score}</span>
               </div>
               <div className="flex gap-4">
                   <button 
                      onClick={startGame}
                      className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 rounded-full font-bold text-xl shadow-lg transition-transform hover:scale-105"
                   >
                       再试一次
                   </button>
                   <button 
                      onClick={onExit}
                      className="px-8 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-full font-bold text-xl transition-transform hover:scale-105"
                   >
                       退出
                   </button>
               </div>
           </div>
       )}

       {/* Hidden Input */}
       <input 
         ref={inputRef}
         type="text" 
         value={input} 
         onChange={handleInput} 
         className="absolute opacity-0 pointer-events-none" 
         autoFocus
         onBlur={() => !gameOver && isPlaying && inputRef.current?.focus()}
       />

    </div>
  );
};

export default FrogGame;