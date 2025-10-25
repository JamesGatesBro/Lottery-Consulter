'use client';

import { useState, useEffect } from 'react';
import type { LuckyResultDisplayProps } from '@/types/lucky-index';

export default function LuckyResultDisplay({ 
  result, 
  onRetry, 
  onUseNumbers, 
  className = '' 
}: LuckyResultDisplayProps) {
  const [animatedIndex, setAnimatedIndex] = useState(0);
  const [showNumbers, setShowNumbers] = useState(false);

  useEffect(() => {
    // 动画效果：逐步显示幸运指数
    const timer = setTimeout(() => {
      if (animatedIndex < result.luckyIndex) {
        setAnimatedIndex(prev => Math.min(prev + 2, result.luckyIndex));
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [animatedIndex, result.luckyIndex]);

  useEffect(() => {
    // 延迟显示幸运数字
    const timer = setTimeout(() => {
      setShowNumbers(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getIndexColor = (index: number) => {
    if (index >= 90) return 'text-green-400';
    if (index >= 80) return 'text-blue-400';
    if (index >= 70) return 'text-yellow-400';
    if (index >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getIndexGradient = (index: number) => {
    if (index >= 90) return 'from-green-400 to-emerald-500';
    if (index >= 80) return 'from-blue-400 to-cyan-500';
    if (index >= 70) return 'from-yellow-400 to-orange-500';
    if (index >= 60) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-pink-500';
  };

  const getStarCount = (index: number) => {
    if (index >= 90) return 5;
    if (index >= 80) return 4;
    if (index >= 70) return 3;
    if (index >= 60) return 2;
    return 1;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-yellow-400/30 ${className}`}>
      {/* 幸运指数显示 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">您的幸运指数</h2>
        
        {/* 圆形进度环 */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* 背景圆环 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* 进度圆环 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(animatedIndex / 100) * 283} 283`}
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className={`stop-color-yellow-400`} />
                <stop offset="100%" className={`stop-color-orange-500`} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* 中心数字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getIndexColor(result.luckyIndex)}`}>
                {animatedIndex}
              </div>
              <div className="text-gray-600 text-sm mt-1">/ 100</div>
            </div>
          </div>
        </div>

        {/* 星级显示 */}
        <div className="flex justify-center mb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`text-2xl ${
                i < getStarCount(result.luckyIndex) ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* 可信度显示 */}
        <div className="text-gray-600 text-sm mb-6">
          可信度: {result.confidence}% | 
          随机源: {result.randomSeed.includes('random.org') ? '真随机' : '伪随机'} |
          计算时间: {formatTimestamp(result.timestamp)}
        </div>
      </div>

      {/* 幸运数字展示 */}
      {showNumbers && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-yellow-400 text-center mb-4">您的专属幸运数字</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {result.luckyNumbers.map((number, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${getIndexGradient(result.luckyIndex)} rounded-lg p-4 text-center transform transition-all duration-500 hover:scale-110 animate-bounce`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-2xl font-bold text-white">{number}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 详细解读 */}
      <div className="bg-white/5 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-yellow-400 mb-3">幸运解读</h3>
        <p className="text-gray-800 leading-relaxed">{result.interpretation}</p>
      </div>

      {/* 详细分析 */}
      <div className="bg-white/5 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-yellow-400 mb-3">详细分析</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{result.factors.nameScore}</div>
            <div className="text-gray-600 text-sm">姓名数字</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{result.factors.birthScore}</div>
            <div className="text-gray-600 text-sm">生日数字</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{result.factors.colorScore}</div>
            <div className="text-gray-600 text-sm">颜色数字</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{result.factors.randomScore}</div>
            <div className="text-gray-600 text-sm">随机数字</div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={onRetry}
          className="flex-1 py-3 px-6 rounded-lg bg-white/10 border border-yellow-400/30 text-gray-800 font-medium hover:bg-white/20 transition-all"
        >
          重新测试
        </button>
        
        {onUseNumbers && (
          <button
            onClick={() => onUseNumbers(result.luckyNumbers)}
            className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
          >
            用这些数字试手气并生成号码
          </button>
        )}
        
        <button
          onClick={() => {
            const shareText = `我的幸运指数是${result.luckyIndex}分！幸运数字：${result.luckyNumbers.join(', ')}`;
            if (navigator.share) {
              navigator.share({
                title: '我的幸运指数测试结果',
                text: shareText,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(shareText);
              alert('结果已复制到剪贴板！');
            }
          }}
          className="flex-1 py-3 px-6 rounded-lg bg-white/10 border border-yellow-400/30 text-gray-800 font-medium hover:bg-white/20 transition-all"
        >
          分享结果
        </button>
      </div>
    </div>
  );
}