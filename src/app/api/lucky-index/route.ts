import { NextRequest, NextResponse } from 'next/server';
import type { UserInput, LuckyResult } from '@/types/lucky-index';
import { NUMEROLOGY_WEIGHTS, COLOR_VALUES } from '@/types/lucky-index';

// 幸运指数解读文本
const INTERPRETATIONS = [
  { min: 90, max: 100, text: "您的幸运指数极高！今天是展现才华和抓住机遇的绝佳时机。建议大胆尝试新的挑战，财运和事业运都非常旺盛。" },
  { min: 80, max: 89, text: "您的幸运指数很高！今天适合做重要决定和开展新项目。人际关系和合作机会都很不错，把握当下的好运势。" },
  { min: 70, max: 79, text: "您的幸运指数良好！今天整体运势平稳向上，适合稳步推进计划。保持积极心态，好运会持续眷顾您。" },
  { min: 60, max: 69, text: "您的幸运指数中等偏上！今天运势较为平稳，适合处理日常事务和维护人际关系。耐心等待更好的机会。" },
  { min: 50, max: 59, text: "您的幸运指数中等！今天运势平平，建议保持低调，专注于个人提升和学习。避免冒险决定。" },
  { min: 40, max: 49, text: "您的幸运指数偏低！今天需要更加谨慎，避免重大决策。专注于休息调整，为明天的好运做准备。" },
  { min: 0, max: 39, text: "您的幸运指数较低！今天适合反思和规划，避免冒险行为。相信困难是暂时的，好运即将到来。" }
];



// 将字符串转换为数字（数字命理学）
function stringToNumber(str: string): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  // 将数字缩减到1-9
  while (sum > 9) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }
  return sum;
}

// 计算生日数字
function calculateBirthNumber(birthDate: string): number {
  const date = new Date(birthDate);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  let sum = day + month + year;
  while (sum > 9) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }
  return sum;
}

// 解析数字范围字符串
function parseNumberRange(numberRange: string): { min: number; max: number } {
  const [minStr, maxStr] = numberRange.split('-');
  const min = parseInt(minStr) || 1;
  const max = parseInt(maxStr) || 33;
  return { min, max };
}

// 获取随机种子
async function getRandomSeed(min: number = 1, max: number = 49): Promise<{ seed: string; numbers: number[]; source: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/random-seed?count=6&min=${min}&max=${max}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        seed: data.source === 'random.org' ? `random.org-${data.data.join('')}` : data.data.join(''),
        numbers: data.data,
        source: data.source
      };
    }
  } catch (error) {
    console.warn('获取随机种子失败，使用备用方案:', error);
  }
  
  // 备用方案
  const range = max - min + 1;
  const numbers = Array.from({ length: 6 }, () => Math.floor(Math.random() * range) + min);
  return {
    seed: numbers.join(''),
    numbers,
    source: 'fallback'
  };
}

// 计算幸运指数
function calculateLuckyIndex(factors: {
  nameScore: number;
  birthScore: number;
  colorScore: number;
  randomScore: number;
}): number {
  const weightedSum = 
    factors.nameScore * NUMEROLOGY_WEIGHTS.name +
    factors.birthScore * NUMEROLOGY_WEIGHTS.birthDate +
    factors.colorScore * NUMEROLOGY_WEIGHTS.luckyColor +
    factors.randomScore * NUMEROLOGY_WEIGHTS.randomSeed;
  
  // 将结果映射到0-100范围
  return Math.round(weightedSum * 11.11); // 9 * 11.11 ≈ 100
}

// 生成幸运数字
function generateLuckyNumbers(
  nameScore: number,
  birthScore: number,
  colorScore: number,
  randomNumbers: number[],
  count: number = 6,
  min: number = 1,
  max: number = 49
): number[] {
  const baseNumbers = [nameScore, birthScore, colorScore];
  const allNumbers = [...baseNumbers, ...randomNumbers];
  
  // 使用算法生成更多数字
  const luckyNumbers: number[] = [];
  const usedNumbers = new Set<number>();
  const range = max - min + 1;
  
  // 首先添加基础数字（需要映射到指定范围）
  for (const num of allNumbers) {
    const mappedNum = ((num - 1) % range) + min;
    if (mappedNum >= min && mappedNum <= max && !usedNumbers.has(mappedNum)) {
      luckyNumbers.push(mappedNum);
      usedNumbers.add(mappedNum);
    }
  }
  
  // 生成额外的幸运数字
  while (luckyNumbers.length < count) {
    const seed = nameScore + birthScore + colorScore + luckyNumbers.length;
    const newNumber = ((seed * 7 + 13) % range) + min;
    
    if (!usedNumbers.has(newNumber)) {
      luckyNumbers.push(newNumber);
      usedNumbers.add(newNumber);
    }
  }
  
  return luckyNumbers.slice(0, count).sort((a, b) => a - b);
}

// 获取解读文本
function getInterpretation(luckyIndex: number): string {
  const interpretation = INTERPRETATIONS.find(
    item => luckyIndex >= item.min && luckyIndex <= item.max
  );
  return interpretation?.text || "您的幸运指数独特，今天是充满可能性的一天！";
}

export async function POST(request: NextRequest) {
  try {
    const body: UserInput = await request.json();
    
    // 验证必需字段
    if (!body.name || !body.birthDate) {
      return NextResponse.json(
        { success: false, error: '姓名和生日是必需的' },
        { status: 400 }
      );
    }
    
    // 验证生日格式
    const birthDate = new Date(body.birthDate);
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { success: false, error: '生日格式不正确' },
        { status: 400 }
      );
    }
    
    // 解析数字范围
    const numberRange = body.preferences?.numberRange || '1-33';
    const { min, max } = parseNumberRange(numberRange);
    
    // 获取随机种子
    const { seed, numbers: randomNumbers, source } = await getRandomSeed(min, max);
    
    // 计算各项分数
    const nameScore = stringToNumber(body.name);
    const birthScore = calculateBirthNumber(body.birthDate);
    const colorScore = body.luckyColor ? (COLOR_VALUES[body.luckyColor] || 5) : 5;
    const randomScore = randomNumbers.reduce((sum, num) => sum + num, 0) % 9 + 1;
    
    const factors = {
      nameScore,
      birthScore,
      colorScore,
      randomScore
    };
    
    // 计算幸运指数
    const luckyIndex = calculateLuckyIndex(factors);
    
    // 生成幸运数字
    const count = body.preferences?.count || 6;
    const luckyNumbers = generateLuckyNumbers(
      nameScore,
      birthScore,
      colorScore,
      randomNumbers,
      count,
      min,
      max
    );
    
    // 获取解读文本
    const interpretation = getInterpretation(luckyIndex);
    
    // 计算可信度（基于真随机数的使用）
    const confidence = source === 'random.org' ? 95 : 85;
    
    const result: LuckyResult = {
      luckyIndex,
      luckyNumbers,
      interpretation,
      randomSeed: seed,
      timestamp: new Date().toISOString(),
      confidence,
      factors
    };
    
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime: Date.now(),
        apiVersion: '1.0',
        randomSource: source
      }
    });
    
  } catch (error) {
    console.error('Lucky index API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '计算幸运指数时发生错误' 
      },
      { status: 500 }
    );
  }
}