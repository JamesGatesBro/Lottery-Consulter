import { useState, useCallback } from 'react';
import type {
  UserInput,
  LuckyResult,
  LuckyIndexResponse,
  UseLuckyIndexReturn,
  RandomSeed,
} from '@/types/lucky-index';

export function useLuckyIndex(): UseLuckyIndexReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<LuckyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [randomSeed, setRandomSeed] = useState<RandomSeed | null>(null);
  const [lastInput, setLastInput] = useState<UserInput | null>(null);

  const calculateLuckyIndex = useCallback(async (input: UserInput) => {
    try {
      setIsLoading(true);
      setIsCalculating(true);
      setError(null);
      setResult(null);
      setLastInput(input);

      // 验证输入
      if (!input.name.trim()) {
        throw new Error('请输入您的姓名');
      }

      if (!input.birthDate) {
        throw new Error('请选择您的生日');
      }

      // 验证生日格式和有效性
      const birthDate = new Date(input.birthDate);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        throw new Error('生日格式不正确');
      }

      if (birthDate > today) {
        throw new Error('生日不能是未来日期');
      }

      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120);
      
      if (birthDate < minDate) {
        throw new Error('请输入有效的生日');
      }

      // 调用API计算幸运指数
      const response = await fetch('/api/lucky-index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `服务器错误: ${response.status}`);
      }

      const data: LuckyIndexResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || '计算幸运指数失败');
      }

      if (!data.data) {
        throw new Error('服务器返回数据格式错误');
      }

      // 设置随机种子信息
      if (data.metadata?.randomSource) {
        setRandomSeed({
          id: data.data.randomSeed,
          values: data.data.luckyNumbers,
          source: data.metadata.randomSource as 'random.org' | 'fallback',
          createdAt: data.data.timestamp,
          isAuthentic: data.metadata.randomSource === 'random.org',
        });
      }

      setResult(data.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '计算幸运指数时发生未知错误';
      setError(errorMessage);
      console.error('Lucky index calculation error:', err);
    } finally {
      setIsLoading(false);
      setIsCalculating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setRandomSeed(null);
    setLastInput(null);
    setIsLoading(false);
    setIsCalculating(false);
  }, []);

  const retry = useCallback(async () => {
    if (lastInput) {
      await calculateLuckyIndex(lastInput);
    } else {
      setError('没有可重试的输入数据');
    }
  }, [lastInput, calculateLuckyIndex]);

  return {
    isLoading,
    isCalculating,
    result,
    error,
    randomSeed,
    calculateLuckyIndex,
    reset,
    retry,
  };
}