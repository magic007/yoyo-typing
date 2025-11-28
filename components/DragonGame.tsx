import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_WORDS } from '../constants';
import { playClick, playError, playSuccess } from '../services/soundService';

interface DragonGameProps {
  onExit: () => void;
}

type CombatState = 'IDLE' | 'HERO_ATTACK' | 'BOSS_ATTACK' | 'VICTORY' | 'DEFEAT';

const DragonGame: React.FC<DragonGameProps> = ({ onExit }) => {
  // Game Configuration
  const MAX_HERO_HP = 100;
  const MAX_BOSS_HP = 200;
  
  // State
  const [heroHP, setHeroHP] = useState(MAX_HERO_HP);
  const [bossHP, setBossHP] = useState(MAX_BOSS_HP);
  const [currentWord, setCurrentWord] = useState('');
  const [input, setInput] = useState('');
  const [combatState, setCombatState] = useState<CombatState>('IDLE');
  const [bossTimer, setBossTimer] = useState(0); // 0 to 100%
  const [damageNum, setDamageNum] = useState<{val: number, type: 'hero' | 'boss' | null}>( {val: 0, type: null} );
  
  // Refs for loop
  const requestRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const difficultyMultiplier = useRef(1.0); // Increases as boss HP drops

  // Initialize Game
  const initGame = useCallback(() => {
    setHeroHP(MAX_HERO_HP);
    setBossHP(MAX_BOSS_HP);
    setBossTimer(0);
    setCombatState('IDLE');
    difficultyMultiplier.current = 1.0;
    pickNewWord();
    
    // Focus
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickNewWord = () => {
    const word = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
    setCurrentWord(word);
    setInput('');
  };

  // Game Loop for Boss Timer
  const animate = (time: number) => {
    if (combatState === 'VICTORY' || combatState === 'DEFEAT') return;

    if (prevTimeRef.current !== undefined) {
      const deltaTime = time - prevTimeRef.current;
      
      // Timer Logic
      // Base time to fill bar: approx 3-5 seconds depending on word length
      // Formula: Word Length * 500ms * (1 / difficulty)
      // We convert this to % per ms.
      
      if (combatState === 'IDLE') {
        const timeToAttack = (currentWord.length * 600) / difficultyMultiplier.current; 
        const percentPerMs = 100 / timeToAttack;
        
        setBossTimer(prev => {
          const next = prev + (percentPerMs * deltaTime);
          if (next >= 100) {
            triggerBossAttack();
            return 0;
          }
          return next;
        });
      }
    }
    prevTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  });

  // Actions
  const triggerBossAttack = () => {
    setCombatState('BOSS_ATTACK');
    playError(); // Use error sound for hit
    
    const dmg = Math.floor(15 + Math.random() * 10); // 15-25 dmg
    setDamageNum({val: dmg, type: 'hero'}); // Hero takes damage

    setHeroHP(prev => {
      const newHP = prev - dmg;
      if (newHP <= 0) {
        setTimeout(() => setCombatState('DEFEAT'), 500);
        return 0;
      }
      return newHP;
    });

    // Reset state after animation
    setTimeout(() => {
      setCombatState('IDLE');
      setDamageNum({val: 0, type: null});
      pickNewWord();
      setBossTimer(0);
    }, 800);
  };

  const triggerHeroAttack = () => {
    setCombatState('HERO_ATTACK');
    playSuccess();

    const dmg = Math.floor(15 + Math.random() * 5); // 15-20 dmg
    setDamageNum({val: dmg, type: 'boss'}); // Boss takes damage

    setBossHP(prev => {
      const newHP = prev - dmg;
      if (newHP <= 0) {
        setTimeout(() => setCombatState('VICTORY'), 500);
        return 0;
      }
      // Enrage: Increase difficulty as HP drops
      if (newHP < MAX_BOSS_HP * 0.5) difficultyMultiplier.current = 1.3;
      if (newHP < MAX_BOSS_HP * 0.2) difficultyMultiplier.current = 1.6;
      return newHP;
    });

    // Reset state
    setTimeout(() => {
      setCombatState('IDLE');
      setDamageNum({val: 0, type: null});
      pickNewWord();
      setBossTimer(0);
    }, 600);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (combatState !== 'IDLE') return;

    const val = e.target.value.toLowerCase().trim();
    
    // Check for errors immediately (optional: punish errors?)
    if (!currentWord.startsWith(val)) {
        playError();
        // Shake effect handled by UI binding to 'error' state if we added it
        // For now just block incorrect input
        return; 
    } else {
        playClick();
    }

    setInput(val);

    if (val === currentWord) {
      triggerHeroAttack();
    }
  };

  // Render Helpers
  const getBossColor = () => {
    if (bossHP < MAX_BOSS_HP * 0.3) return 'text-red-600 animate-pulse';
    return 'text-purple-600';
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white font-sans overflow-hidden relative selection:bg-transparent">
      
      {/* Top Bar: Healths */}
      <div className="flex justify-between items-center p-6 bg-slate-800 border-b-4 border-slate-700 z-10">
        
        {/* Hero HP */}
        <div className="flex flex-col w-1/3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🦸</span>
            <span className="font-bold text-blue-400">勇者 (YOU)</span>
          </div>
          <div className="w-full h-6 bg-slate-900 rounded-full border-2 border-slate-600 overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${(heroHP / MAX_HERO_HP) * 100}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold shadow-black drop-shadow-md">
              {heroHP} / {MAX_HERO_HP}
            </span>
          </div>
        </div>

        {/* VS Label */}
        <div className="font-cartoon text-3xl text-slate-500 italic">VS</div>

        {/* Boss HP */}
        <div className="flex flex-col items-end w-1/3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-purple-400">恶龙 (BOSS)</span>
            <span className="text-2xl">🐲</span>
          </div>
          <div className="w-full h-6 bg-slate-900 rounded-full border-2 border-slate-600 overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-l from-purple-600 to-red-500 transition-all duration-300"
              style={{ width: `${(bossHP / MAX_BOSS_HP) * 100}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold shadow-black drop-shadow-md">
              {bossHP} / {MAX_BOSS_HP}
            </span>
          </div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
        
        {/* Dungeon Background Effect */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brick-wall.png')]"></div>

        {/* Hero Sprite */}
        <div className={`absolute left-[10%] bottom-[30%] transition-transform duration-200 ${combatState === 'HERO_ATTACK' ? 'translate-x-20 scale-110' : 'scale-100'} ${combatState === 'BOSS_ATTACK' ? 'animate-shake text-red-500' : ''}`}>
           <div className="text-[8rem] filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
             {heroHP > 0 ? '🦸‍♂️' : '🪦'}
           </div>
           {damageNum.type === 'hero' && (
             <div className="absolute -top-10 left-10 text-5xl font-bold text-red-500 animate-bounce-custom">-{damageNum.val}</div>
           )}
        </div>

        {/* Boss Sprite */}
        <div className={`absolute right-[10%] bottom-[35%] transition-transform duration-200 ${combatState === 'BOSS_ATTACK' ? '-translate-x-20 scale-125' : 'scale-110'} ${combatState === 'HERO_ATTACK' ? 'animate-shake opacity-80' : ''}`}>
           <div className={`text-[10rem] filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] ${getBossColor()}`}>
             {bossHP > 0 ? '🐲' : '💥'}
           </div>
           {damageNum.type === 'boss' && (
             <div className="absolute -top-10 right-10 text-5xl font-bold text-yellow-400 animate-bounce-custom">-{damageNum.val}</div>
           )}
        </div>

        {/* Center Action Area (Word & Input) */}
        {(combatState === 'IDLE' || combatState === 'HERO_ATTACK' || combatState === 'BOSS_ATTACK') && (
          <div className="flex flex-col items-center z-20 mb-20">
            {/* Attack Timer Bar (Boss charge) */}
            <div className="w-64 h-3 bg-slate-700 rounded-full mb-4 overflow-hidden border border-slate-500 shadow-lg">
               <div 
                 className={`h-full transition-all duration-75 ${bossTimer > 80 ? 'bg-red-500' : 'bg-yellow-400'}`}
                 style={{ width: `${bossTimer}%` }}
               ></div>
            </div>
            <div className="text-xs text-slate-400 mb-2 font-bold tracking-widest uppercase">
               {bossTimer > 80 ? '⚠️ 恶龙即将攻击! ⚠️' : '恶龙蓄力中...'}
            </div>

            {/* The Word */}
            <div className="bg-black/40 backdrop-blur-md px-8 py-4 rounded-2xl border-2 border-slate-500 mb-6 shadow-2xl">
               <div className="text-5xl font-mono font-bold tracking-wider">
                  <span className="text-green-400">{currentWord.slice(0, input.length)}</span>
                  <span className="text-white">{currentWord.slice(input.length)}</span>
               </div>
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInput}
              className="bg-transparent border-b-4 border-white/20 text-center text-3xl text-transparent caret-white focus:outline-none focus:border-blue-500 w-full max-w-xs transition-colors"
              autoFocus
            />
            <p className="text-slate-500 mt-2 text-sm">输入单词发起攻击！</p>
          </div>
        )}

        {/* Victory Screen */}
        {combatState === 'VICTORY' && (
           <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in">
              <h1 className="text-7xl font-cartoon text-yellow-400 mb-4 drop-shadow-[0_5px_0_rgba(200,100,0,1)]">胜利! VICTORY</h1>
              <p className="text-2xl text-white mb-8">你打败了恶龙，守护了世界！</p>
              <div className="flex gap-4">
                 <button onClick={initGame} className="px-8 py-3 bg-green-600 rounded-full text-xl font-bold hover:scale-105 transition-transform">再战一局</button>
                 <button onClick={onExit} className="px-8 py-3 bg-slate-600 rounded-full text-xl font-bold hover:scale-105 transition-transform">退出</button>
              </div>
           </div>
        )}

        {/* Defeat Screen */}
        {combatState === 'DEFEAT' && (
           <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in">
              <h1 className="text-7xl font-cartoon text-red-600 mb-4 drop-shadow-[0_5px_0_rgba(100,0,0,1)]">失败 DEFEAT</h1>
              <p className="text-2xl text-white mb-8">勇者倒下了...</p>
              <div className="flex gap-4">
                 <button onClick={initGame} className="px-8 py-3 bg-blue-600 rounded-full text-xl font-bold hover:scale-105 transition-transform">重新挑战</button>
                 <button onClick={onExit} className="px-8 py-3 bg-slate-600 rounded-full text-xl font-bold hover:scale-105 transition-transform">退出</button>
              </div>
           </div>
        )}

      </div>

      {/* Exit Button */}
      <button 
        onClick={onExit}
        className="absolute top-6 right-6 px-4 py-2 bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg backdrop-blur font-bold border border-slate-500 z-50"
      >
        退出战斗
      </button>
      
      {/* CSS for custom animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes bounce-custom {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(-40px); opacity: 1; }
        }
        .animate-bounce-custom {
          animation: bounce-custom 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DragonGame;