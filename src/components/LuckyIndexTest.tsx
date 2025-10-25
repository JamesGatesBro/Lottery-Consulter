'use client';

import { useState } from 'react';
import PersonalInfoForm from './PersonalInfoForm';
import LuckyResultDisplay from './LuckyResultDisplay';
import { useLuckyIndex } from '@/hooks/useLuckyIndex';
import type { LuckyIndexTestProps, UserInput } from '@/types/lucky-index';

export default function LuckyIndexTest({ 
  className = '', 
  onResult, 
  onError 
}: LuckyIndexTestProps) {
  const [showResult, setShowResult] = useState(false);
  const {
    isLoading,
    isCalculating,
    result,
    error,
    randomSeed,
    calculateLuckyIndex,
    reset,
    retry,
  } = useLuckyIndex();

  const handleSubmit = async (input: UserInput) => {
    try {
      await calculateLuckyIndex(input);
      setShowResult(true);
      
      // 调用回调函数
      if (result && onResult) {
        onResult(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '计算失败';
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleRetry = async () => {
    setShowResult(false);
    await retry();
    if (result) {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setShowResult(false);
    reset();
  };

  const handleUseNumbers = (numbers: number[]) => {
    // 这里可以与主页面的彩票号码生成功能集成
    
    // 可以触发一个事件或调用父组件的回调
    if (typeof window !== 'undefined') {
      // 首先发送幸运数字事件
      window.dispatchEvent(new CustomEvent('useLuckyNumbers', { 
        detail: { numbers } 
      }));
      
      // 然后触发试手气功能
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('triggerTryLuck'));
      }, 100); // 稍微延迟确保幸运数字先被设置
    }
    
    // 显示提示
    alert(`正在使用幸运数字 ${numbers.join(', ')} 生成彩票号码...`);
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-400 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">⚠️</div>
            <div className="text-gray-800">
              <div className="font-medium">计算失败</div>
              <div className="text-sm text-gray-600">{error}</div>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            重新开始
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {isCalculating && (
        <div className="mb-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-yellow-400/30">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">正在计算您的幸运指数...</h3>
            <div className="text-gray-700 space-y-1">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
                <span>获取真随机种子</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2" style={{ animationDelay: '0.2s' }}></div>
                <span>分析个人信息</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2" style={{ animationDelay: '0.4s' }}></div>
                <span>计算数字命理学</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2" style={{ animationDelay: '0.6s' }}></div>
                <span>生成幸运数字</span>
              </div>
            </div>
            
            {/* 随机种子信息 */}
            {randomSeed && (
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-600">
                  随机源: {randomSeed.isAuthentic ? '🌟 真随机 (Random.org)' : '⚡ 伪随机 (备用)'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 主要内容 */}
      {!showResult && !isCalculating && !error && (
        <PersonalInfoForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          className="animate-fade-in"
        />
      )}

      {/* 结果展示 */}
      {showResult && result && !isCalculating && (
        <div className="animate-fade-in">
          <LuckyResultDisplay
            result={result}
            onRetry={handleRetry}
            onUseNumbers={handleUseNumbers}
          />
        </div>
      )}

      {/* 功能说明 */}
      {!showResult && !isCalculating && !error && (
        <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-bold text-yellow-400 mb-3">🔮 关于幸运指数测试</h3>
          <div className="text-gray-700 space-y-2 text-sm">
            <p>• <strong>真随机技术</strong>：使用Random.org的大气噪声生成真正的随机数</p>
            <p>• <strong>数字命理学</strong>：结合您的姓名、生日等信息进行个性化计算</p>
            <p>• <strong>科学算法</strong>：采用加权计算方式，确保结果的合理性</p>
            <p>• <strong>隐私保护</strong>：所有信息仅用于计算，不会存储或分享</p>
            <p>• <strong>娱乐性质</strong>：结果仅供娱乐参考，请理性对待</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}