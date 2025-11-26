import React from 'react';
import { KEYBOARD_LAYOUT } from '../constants';
import { KeyConfig } from '../types';

interface VirtualKeyboardProps {
  activeKey: string | null;
  errorKeys: Record<string, number>;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ activeKey, errorKeys }) => {
  
  const getKeyColor = (k: KeyConfig) => {
    const isPressed = activeKey === k.key;
    const errorCount = errorKeys[k.key] || 0;

    // Heatmap logic
    if (errorCount > 5) return 'bg-red-500 text-white border-red-700';
    if (errorCount > 2) return 'bg-orange-300 text-orange-900 border-orange-400';
    
    // Active state
    if (isPressed) return 'bg-blue-500 text-white border-blue-700 transform translate-y-1 shadow-none';

    // Default hands
    if (k.hand === 'left') return 'bg-sky-100 border-sky-300 text-sky-800';
    return 'bg-emerald-100 border-emerald-300 text-emerald-800';
  };

  const getFingerHint = (finger?: number) => {
    if (!finger) return null;
    const hand = finger <= 5 ? 'Left' : 'Right';
    const fingerName = finger <= 5 ? finger : finger - 5;
    // Simple visual cue: 1=Pinky, 5=Thumb
    const map = ['Pinky', 'Ring', 'Middle', 'Index', 'Thumb'];
    return `${hand} ${map[fingerName-1]}`;
  };

  const activeKeyConfig = KEYBOARD_LAYOUT.flat().find(k => k.key === activeKey);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white/50 backdrop-blur rounded-2xl shadow-xl w-full max-w-4xl mx-auto border border-white/60">
      
      {/* Keyboard Grid */}
      <div className="flex flex-col gap-1.5 w-full select-none">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {row.map((k) => (
              <div
                key={k.key}
                className={`
                  relative flex items-center justify-center rounded-lg border-b-4 font-bold transition-all duration-100
                  ${getKeyColor(k)}
                `}
                style={{
                  width: k.width ? `${k.width * 3.5}rem` : '3.5rem',
                  height: '3.5rem',
                }}
              >
                <span className="text-lg">{k.label || k.key.toUpperCase()}</span>
                {/* Finger Dot Hint */}
                {activeKey === k.key && (
                  <span className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Helper Text */}
      <div className="h-8 flex items-center justify-center text-slate-500 font-medium">
        {activeKeyConfig ? (
          <span className="flex items-center gap-2 animate-pulse text-blue-600">
            Uses: <span className="font-bold">{getFingerHint(activeKeyConfig.finger)}</span>
          </span>
        ) : (
          <span>Start typing...</span>
        )}
      </div>
    </div>
  );
};

export default VirtualKeyboard;