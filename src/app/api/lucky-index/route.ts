import { NextRequest, NextResponse } from 'next/server';

// 数字命理学权重配置
const NUMEROLOGY_WEIGHTS = {
  name: 0.3,        // 姓名数字权重
  birthDate: 0.4,   // 生日数字权重
  luckyColor: 0.1,  // 幸运颜色权重
  randomSeed: 0.2   // 随机种子权重
};

// 颜色数值映射
const COLOR_VALUES: Record<string, number> = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
  blue: 5,
  purple: 6,
  pink: 7,
  white: 8,
  black: 9
};

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

interface UserInput {
  name: string;
  birthDate: string;
  luckyColor?: string;
  preferences?: {
    numberRange?: string;
    count?: number;
    includeZero?: boolean;
  };
}

interface LuckyResult {
  luckyIndex: number;
  luckyNumbers: number[];
  interpretation: string;
  randomSeed: string;
  timestamp: string;
  confidence: number;
  factors: {
    nameScore: number;
    birthScore: number;
    colorScore: number;
    randomScore: number;
  };
}

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

// 获取随机种子
async function getRandomSeed(): Promise<{ seed: string; numbers: number[] }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/random-seed?count=6&min=1&max=49`);
    const data = await response.json();
    
    if (data.success) {
      return {
        seed: data.data.join(''),
        numbers: data.data
      };
    }
  } catch (error) {
    console.warn('获取随机种子失败，使用备用方案:', error);
  }
  
  // 备用方案
  const numbers = Array.from({ length: 6 }, () => Math.floor(Math.random() * 49) + 1);
  return {
    seed: numbers.join(''),
    numbers
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
  count: number = 6
): number[] {
  const baseNumbers = [nameScore, birthScore, colorScore];
  const allNumbers = [...baseNumbers, ...randomNumbers];
  
  // 使用算法生成更多数字
  const luckyNumbers: number[] = [];
  const usedNumbers = new Set<number>();
  
  // 首先添加基础数字
  for (const num of allNumbers) {
    if (num >= 1 && num <= 49 && !usedNumbers.has(num)) {
      luckyNumbers.push(num);
      usedNumbers.add(num);
    }
  }
  
  // 生成额外的幸运数字
  while (luckyNumbers.length < count) {
    const seed = nameScore + birthScore + colorScore + luckyNumbers.length;
    const newNumber = ((seed * 7 + 13) % 49) + 1;
    
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
    
    // 获取随机种子
    const { seed, numbers: randomNumbers } = await getRandomSeed();
    
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
      count
    );
    
    // 获取解读文本
    const interpretation = getInterpretation(luckyIndex);
    
    // 计算可信度（基于真随机数的使用）
    const confidence = seed.includes('random.org') ? 95 : 85;
    
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
        randomSource: seed.includes('random.org') ? 'random.org' : 'fallback'
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