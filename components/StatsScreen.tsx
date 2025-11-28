
import React from 'react';
import { PracticeStats } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsScreenProps {
  history: PracticeStats[];
  onBack: () => void;
}

const StatsScreen: React.FC<StatsScreenProps> = ({ history, onBack }) => {
  // Reverse history for the list to show newest first
  const reversedHistory = [...history].reverse();

  // Prepare chart data with simple index
  const chartData = history.map((h, i) => ({
    name: `练习 ${i + 1}`,
    wpm: h.wpm,
    accuracy: h.accuracy
  }));

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 h-screen flex flex-col overflow-hidden">
       {/* Header */}
       <div className="flex justify-between items-center mb-6 shrink-0">
          <button 
            onClick={onBack} 
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm border border-slate-200 font-bold flex items-center gap-2 transition-all"
          >
            <span>🔙</span> 返回首页
          </button>
          <h2 className="text-3xl font-cartoon text-slate-700">📊 你的练习记录</h2>
          <div className="w-24"></div> {/* Spacer */}
       </div>
       
       {history.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center text-slate-400">
           <div className="text-6xl mb-4">📉</div>
           <p className="text-xl">还没有练习记录哦，快去打字吧！</p>
         </div>
       ) : (
         <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 min-h-[300px] shrink-0">
              <h3 className="text-lg font-bold text-slate-600 mb-4 ml-2">成长曲线</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="wpm" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} name="速度 (WPM)" activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={{r: 4}} name="正确率 %" activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List Section */}
            <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-6 pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-600">最近记录</h3>
              </div>
              <div className="overflow-y-auto p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-sm border-b border-slate-100">
                      <th className="p-3 font-medium">练习序号</th>
                      <th className="p-3 font-medium">速度 (WPM)</th>
                      <th className="p-3 font-medium">正确率</th>
                      <th className="p-3 font-medium">错误数</th>
                      <th className="p-3 font-medium">用时 (秒)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reversedHistory.map((stat, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
                        <td className="p-4 font-bold text-slate-600">
                          #{history.length - index}
                        </td>
                        <td className="p-4 text-blue-600 font-bold text-lg">{stat.wpm}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                            stat.accuracy >= 90 ? 'bg-green-100 text-green-700' : 
                            stat.accuracy >= 80 ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {stat.accuracy}%
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{stat.errors}</td>
                        <td className="p-4 text-slate-500">{Math.round(stat.timeElapsed)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default StatsScreen;
