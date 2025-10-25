import { FortuneResponse } from '@/types/fortune';
import { Sparkles, RefreshCw } from 'lucide-react';

interface FortuneDisplayProps {
  fortune: FortuneResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function FortuneDisplay({ fortune, loading, error, onRefresh }: FortuneDisplayProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
          <span className="text-amber-700 dark:text-amber-300">正在获取幸运签语...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <span className="text-red-700 dark:text-red-300">获取签语失败，请稍后重试</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!fortune) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800 shadow-lg">
      <div className="space-y-4">
        {/* 标题 */}
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
            今日幸运签语
          </h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-auto text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
              title="换一个签语"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 幸运签语 */}
        <div className="bg-white/60 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-100 dark:border-amber-700">
          <p className="text-amber-900 dark:text-amber-100 text-center font-medium leading-relaxed">
            {fortune.fortune.message}
          </p>
        </div>

        {/* 中文格言 */}
        {fortune.lesson && (
          <div className="bg-white/40 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-100 dark:border-amber-700">
            <p className="text-amber-800 dark:text-amber-200 text-sm text-center">
              {fortune.lesson.chinese}
            </p>
            {fortune.lesson.english && (
              <p className="text-amber-600 dark:text-amber-400 text-xs text-center mt-1 italic">
                {fortune.lesson.english}
              </p>
            )}
          </div>
        )}


      </div>
    </div>
  );
}