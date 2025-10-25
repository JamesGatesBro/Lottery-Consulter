import { useState, useCallback } from 'react';
import { FortuneResponse, ApiResponse, FortuneState } from '@/types/fortune';

export function useFortune() {
  const [state, setState] = useState<FortuneState>({
    fortune: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const fetchFortune = useCallback(async (type: string = 'cookie') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`/api/fortune?type=${type}`);
      const result: ApiResponse<FortuneResponse> = await response.json();
      
      if (result.success && result.data) {
        setState({
          fortune: result.data,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        });
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch fortune');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const clearFortune = useCallback(() => {
    setState({
      fortune: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
  }, []);

  return {
    ...state,
    fetchFortune,
    clearFortune
  };
}