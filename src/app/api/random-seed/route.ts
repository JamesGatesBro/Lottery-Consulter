import { NextRequest, NextResponse } from 'next/server';

interface RandomOrgResponse {
  success: boolean;
  data: number[];
  source: 'random.org' | 'fallback';
  error?: string;
}

// Random.org API配置
const RANDOM_ORG_API_URL = 'https://www.random.org/integers/';

// 生成备用随机数（当Random.org不可用时）
function generateFallbackRandom(count: number, min: number, max: number): number[] {
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return numbers;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '1');
    const min = parseInt(searchParams.get('min') || '1');
    const max = parseInt(searchParams.get('max') || '1000000');

    // 验证参数
    if (count < 1 || count > 10000) {
      return NextResponse.json(
        { success: false, error: '数量必须在1-10000之间' },
        { status: 400 }
      );
    }

    if (min >= max) {
      return NextResponse.json(
        { success: false, error: '最小值必须小于最大值' },
        { status: 400 }
      );
    }

    try {
      // 构建Random.org API URL
      const randomOrgUrl = new URL(RANDOM_ORG_API_URL);
      randomOrgUrl.searchParams.set('num', count.toString());
      randomOrgUrl.searchParams.set('min', min.toString());
      randomOrgUrl.searchParams.set('max', max.toString());
      randomOrgUrl.searchParams.set('col', '1');
      randomOrgUrl.searchParams.set('base', '10');
      randomOrgUrl.searchParams.set('format', 'plain');
      randomOrgUrl.searchParams.set('rnd', 'new');

      // 调用Random.org API
      const response = await fetch(randomOrgUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Lottery-Consulter/1.0',
        },
        // 设置超时时间
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Random.org API返回错误: ${response.status}`);
      }

      const text = await response.text();
      const numbers = text
        .trim()
        .split('\n')
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num));

      if (numbers.length !== count) {
        throw new Error('Random.org返回的数据格式不正确');
      }

      const result: RandomOrgResponse = {
        success: true,
        data: numbers,
        source: 'random.org',
      };

      return NextResponse.json(result);

    } catch (randomOrgError) {
      console.warn('Random.org API调用失败，使用备用随机数生成器:', randomOrgError);
      
      // 使用备用随机数生成器
      const fallbackNumbers = generateFallbackRandom(count, min, max);
      
      const result: RandomOrgResponse = {
        success: true,
        data: fallbackNumbers,
        source: 'fallback',
      };

      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Random seed API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}