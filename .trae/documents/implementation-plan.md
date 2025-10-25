# Fortune Cookie API 集成实现计划

## 1. 实现阶段规划

### 阶段一：基础架构搭建 (1-2天)
- [ ] 创建API代理端点
- [ ] 实现基础的TypeScript类型定义
- [ ] 搭建缓存管理系统
- [ ] 添加错误处理机制

### 阶段二：核心功能开发 (2-3天)
- [ ] 集成Fortune Cookie API调用
- [ ] 实现签语展示组件
- [ ] 修改现有号码生成流程
- [ ] 添加并发请求处理

### 阶段三：UI/UX优化 (1-2天)
- [ ] 设计签语展示区域
- [ ] 实现加载状态动画
- [ ] 优化响应式布局
- [ ] 添加交互反馈效果

### 阶段四：测试与优化 (1天)
- [ ] 功能测试
- [ ] 性能优化
- [ ] 错误场景测试
- [ ] 用户体验调优

## 2. 详细实现步骤

### 步骤1：创建API代理端点

**文件：`src/app/api/fortune/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

const FORTUNE_API_BASE = 'http://fortunecookieapi.herokuapp.com/v1';
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'cookie';
    
    // 检查缓存
    const cached = getCachedData(type);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    // 请求外部API
    const response = await fetch(`${FORTUNE_API_BASE}/${type}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 } // 30分钟缓存
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 更新缓存
    setCachedData(type, data);
    
    return NextResponse.json({
      success: true,
      data,
      cached: false
    });
    
  } catch (error) {
    console.error('Fortune API Error:', error);
    
    // 返回降级数据
    return NextResponse.json({
      success: true,
      data: getFallbackData(),
      cached: false,
      fallback: true
    });
  }
}
```

### 步骤2：类型定义

**文件：`src/types/fortune.ts`**
```typescript
export interface FortuneResponse {
  fortune: {
    message: string;
    id: number;
  };
  lesson: {
    english: string;
    chinese: string;
    id: number;
  };
  lotto: {
    id: number;
    numbers: number[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  fallback?: boolean;
  timestamp?: number;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}
```

### 步骤3：缓存管理工具

**文件：`src/lib/cache.ts`**
```typescript
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, CacheItem<any>>();
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  set<T>(key: string, data: T, ttl: number = 30 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    
    // 内存缓存
    this.memoryCache.set(key, item);
    
    // LocalStorage缓存
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('LocalStorage cache failed:', error);
    }
  }
  
  get<T>(key: string): T | null {
    // 先检查内存缓存
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expiry > Date.now()) {
      return memoryItem.data;
    }
    
    // 检查LocalStorage缓存
    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (stored) {
        const item: CacheItem<T> = JSON.parse(stored);
        if (item.expiry > Date.now()) {
          // 恢复到内存缓存
          this.memoryCache.set(key, item);
          return item.data;
        }
      }
    } catch (error) {
      console.warn('LocalStorage read failed:', error);
    }
    
    return null;
  }
  
  clear(key?: string): void {
    if (key) {
      this.memoryCache.delete(key);
      localStorage.removeItem(`cache:${key}`);
    } else {
      this.memoryCache.clear();
      // 清除所有缓存项
      Object.keys(localStorage)
        .filter(k => k.startsWith('cache:'))
        .forEach(k => localStorage.removeItem(k));
    }
  }
}
```

### 步骤4：Fortune Hook

**文件：`src/hooks/useFortune.ts`**
```typescript
import { useState, useCallback } from 'react';
import { FortuneResponse, ApiResponse } from '@/types/fortune';

export function useFortune() {
  const [fortune, setFortune] = useState<FortuneResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchFortune = useCallback(async (type: string = 'cookie') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/fortune?type=${type}`);
      const result: ApiResponse<FortuneResponse> = await response.json();
      
      if (result.success && result.data) {
        setFortune(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch fortune');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Fortune fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const refreshFortune = useCallback(() => {
    return fetchFortune('cookie');
  }, [fetchFortune]);
  
  return {
    fortune,
    loading,
    error,
    fetchFortune,
    refreshFortune
  };
}
```

### 步骤5：签语展示组件

**文件：`src/components/FortuneDisplay.tsx`**
```typescript
import { FortuneResponse } from '@/types/fortune';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';

interface FortuneDisplayProps {
  fortune: FortuneResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export function FortuneDisplay({ fortune, loading, onRefresh }: FortuneDisplayProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-amber-700">正在获取您的幸运签语...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!fortune) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">点击生成按钮获取您的幸运签语</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-amber-800">今日幸运签语</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white/70 rounded-lg p-4 border border-amber-200">
            <p className="text-amber-900 text-lg font-medium leading-relaxed">
              {fortune.fortune.message}
            </p>
          </div>
          
          {fortune.lesson && (
            <div className="bg-white/70 rounded-lg p-4 border border-amber-200">
              <p className="text-amber-800 text-sm mb-2">智慧格言：</p>
              <p className="text-amber-900 font-medium">
                {fortune.lesson.chinese}
              </p>
              <p className="text-amber-700 text-sm mt-2 italic">
                {fortune.lesson.english}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            换一个签语
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 步骤6：修改主页面

**修改文件：`src/app/page.tsx`**
```typescript
// 在现有代码基础上添加以下导入和功能
import { useFortune } from '@/hooks/useFortune';
import { FortuneDisplay } from '@/components/FortuneDisplay';

// 在主组件中添加fortune相关状态
export default function Home() {
  // ... 现有状态
  const { fortune, loading: fortuneLoading, fetchFortune, refreshFortune } = useFortune();
  
  // 修改生成函数，同时获取签语
  const handleGenerate = useCallback(async () => {
    if (running) return;
    
    setRunning(true);
    setResult(null);
    
    // 并发执行号码生成和签语获取
    const [newResult] = await Promise.all([
      new Promise<GeneratedResult>((resolve) => {
        setTimeout(() => {
          const generated = generateNumbers(selectedType);
          resolve(generated);
        }, 100);
      }),
      fetchFortune('cookie')
    ]);
    
    setResult(newResult);
    localStorage.setItem(LOTTERY_STORAGE_KEY, JSON.stringify(newResult));
    
    setTimeout(() => {
      setRunning(false);
    }, 4500);
  }, [selectedType, running, fetchFortune]);
  
  // 在JSX中添加签语展示区域
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* ... 现有内容 */}
      
      {/* 新增签语展示区域 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：号码展示区域 */}
          <div>
            {/* ... 现有号码展示内容 */}
          </div>
          
          {/* 右侧：签语展示区域 */}
          <div>
            <FortuneDisplay
              fortune={fortune}
              loading={fortuneLoading}
              onRefresh={refreshFortune}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 3. 测试计划

### 3.1 功能测试
- [ ] API代理端点正常工作
- [ ] 缓存机制有效运行
- [ ] 错误处理和降级方案
- [ ] 签语展示组件渲染正确
- [ ] 响应式布局适配

### 3.2 性能测试
- [ ] API响应时间测试
- [ ] 缓存命中率测试
- [ ] 并发请求处理测试
- [ ] 内存使用情况监控

### 3.3 用户体验测试
- [ ] 加载状态反馈
- [ ] 错误提示友好性
- [ ] 交互流程顺畅性
- [ ] 移动端体验测试

## 4. 部署注意事项

### 4.1 环境变量配置
```bash
# .env.local
FORTUNE_API_BASE_URL=http://fortunecookieapi.herokuapp.com/v1
FORTUNE_CACHE_TTL=1800000  # 30分钟
NEXT_PUBLIC_ENABLE_FORTUNE=true
```

### 4.2 构建优化
- 确保API Routes正确打包
- 检查外部API依赖
- 验证缓存机制在生产环境的表现

### 4.3 监控和日志
- 添加API调用成功率监控
- 记录缓存命中率统计
- 监控错误发生频率和类型

这个实现计划提供了详细的步骤指导，确保Fortune Cookie API能够顺利集成到现有项目中，同时保持良好的用户体验和系统性能。