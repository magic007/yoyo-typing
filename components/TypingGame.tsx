
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
  const speedMultiplier = useRef(1);

  // Start Game Handler
  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setWords([]);
    setInput('');
    lastSpawnRef.current = performance.now();
  };

  // Game Loop
  const animate = useCallback((time: number) => {
    if (gameOver || !isPlaying) return;

    // Spawn new word logic
    if (time - lastSpawnRef.current > 2000 / speedMultiplier.current) {
      const text = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
      const newWord: GameWord = {
        id: Date.now().toString() + Math.random(),
        text,
        x: Math.random() * 80 + 5, // 5% to 85% width
        y: -10,
        speed: (Math.random() * 0.1 + 0.05) * speedMultiplier.current
      };
      setWords(prev => [...prev, newWord]);
      lastSpawnRef.current = time;
    }

    // Move words
    setWords(prev => {
      const nextWords: GameWord[] = [];
      let livesLost = 0;

      prev.forEach(w => {
        const nextY = w.y + w.speed;
        if (nextY > 100) {
          livesLost++;
        } else {
          nextWords.push({ ...w, y: nextY });
        }
      });

      if (livesLost > 0) {
        setLives(l => {
          const newLives = l - livesLost;
          if (newLives <= 0) setGameOver(true);
          return newLives;
        });
      }
      
      return nextWords;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [gameOver, isPlaying]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate, isPlaying, gameOver]);

  // Difficulty scaling
  useEffect(() => {
    speedMultiplier.current = 1 + (score / 100);
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
    <div className="relative w-full flex-1 flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700">
      
      {/* HUD */}
      <div className="flex justify-between items-center p-4 bg-slate-800 text-white z-10 shrink-0">
        <div className="flex gap-4">
          <span className="font-cartoon text-2xl text-yellow-400">Score: {score}</span>
          <span className="font-cartoon text-2xl text-red-400">Lives: {'❤️'.repeat(Math.max(0, lives))}</span>
        </div>
        <button onClick={onExit} className="px-4 py-1 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm">Exit Game</button>
      </div>

      {/* Game Area */}
      <div className="relative flex-1 w-full bg-gradient-to-b from-slate-900 to-indigo-900 overflow-hidden">
        
        {/* Words */}
        {isPlaying && !gameOver && words.map(w => (
          <div
            key={w.id}
            className="absolute px-3 py-1 bg-white/10 backdrop-blur rounded-full text-white font-mono text-lg font-bold border border-white/20 shadow-lg"
            style={{
              left: `${w.x}%`,
              top: `${w.y}%`,
            }}
          >
            {w.text}
          </div>
        ))}

        {/* Start Screen Overlay */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
             <h2 className="text-6xl font-cartoon text-yellow-400 mb-2">WORD RAIN</h2>
             <p className="text-slate-300 mb-8 text-xl">Type the words before they fall!</p>
             <button 
               onClick={startGame}
               className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full text-2xl shadow-xl transform hover:scale-105 transition-all"
             >
               Start Game
             </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <h2 className="text-6xl font-cartoon text-red-500 mb-4">GAME OVER</h2>
            <p className="text-2xl text-white mb-8">Final Score: {score}</p>
            <div className="flex gap-4">
               <button 
                 onClick={startGame}
                 className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold rounded-full text-xl shadow-lg"
               >
                 Play Again
               </button>
               <button 
                 onClick={onExit}
                 className="px-8 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-full text-xl shadow-lg"
               >
                 Exit
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Zone */}
      <div className="p-6 bg-slate-800 flex justify-center z-10 shrink-0">
        <input
          type="text"
          autoFocus
          value={input}
          onChange={handleInputChange}
          placeholder={!isPlaying ? "Click Start to Play" : "Type falling words..."}
          disabled={!isPlaying || gameOver}
          className="w-full max-w-lg px-6 py-4 text-2xl font-mono text-center rounded-xl bg-slate-700 text-white border-2 border-slate-600 focus:border-yellow-400 focus:outline-none placeholder-slate-500 disabled:opacity-50"
        />
      </div>
    </div>
  );
};

export default TypingGame;
