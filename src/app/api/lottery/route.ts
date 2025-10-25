import { NextRequest, NextResponse } from 'next/server';

export type LotteryType = "double_color" | "qilecai" | "fucai3d" | "kuaile8";

export interface GeneratedResult {
  type: LotteryType;
  reds?: number[];
  blues?: number[];
  numbers?: number[];
}

interface LotteryRequest {
  type: LotteryType;
  luckyNumbers?: number[];
}

// 生成指定范围内的不重复随机数
function pickUnique(count: number, max: number, min: number = 1): number[] {
  const result: number[] = [];
  const used = new Set<number>();
  
  while (result.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!used.has(num)) {
      used.add(num);
      result.push(num);
    }
  }
  
  return result.sort((a, b) => a - b);
}

// 使用幸运数字生成彩票号码
function generateWithLuckyNumbers(type: LotteryType, luckyNumbers: number[]): GeneratedResult {
  if (type === "double_color") {
    // 双色球：红球1-33（6个），蓝球1-16（1个）
    const validReds = luckyNumbers.filter(n => n >= 1 && n <= 33);
    const validBlues = luckyNumbers.filter(n => n >= 1 && n <= 16);
    
    let reds: number[] = [];
    let blues: number[] = [];
    
    // 使用有效的幸运数字作为红球
    if (validReds.length > 0) {
      reds = [...new Set(validReds)].slice(0, 6);
    }
    
    // 补充红球到6个
    while (reds.length < 6) {
      const additional = pickUnique(6 - reds.length, 33);
      for (const num of additional) {
        if (!reds.includes(num)) {
          reds.push(num);
        }
      }
    }
    
    // 使用有效的幸运数字作为蓝球
    if (validBlues.length > 0) {
      blues = [validBlues[0]];
    } else {
      blues = pickUnique(1, 16);
    }
    
    reds.sort((a, b) => a - b);
    return { type, reds, blues };
  }
  
  if (type === "qilecai") {
    // 七乐彩：1-30（7个）+ 特别号1-30（1个）
    const validNumbers = luckyNumbers.filter(n => n >= 1 && n <= 30);
    let mains: number[] = [];
    
    if (validNumbers.length > 0) {
      mains = [...new Set(validNumbers)].slice(0, 7);
    }
    
    // 补充到7个
    while (mains.length < 7) {
      const additional = pickUnique(7 - mains.length, 30);
      for (const num of additional) {
        if (!mains.includes(num)) {
          mains.push(num);
        }
      }
    }
    
    // 生成特别号
    let special = 0;
    const remainingNumbers = validNumbers.filter(n => !mains.includes(n));
    if (remainingNumbers.length > 0) {
      special = remainingNumbers[0];
    } else {
      while (true) {
        special = Math.floor(Math.random() * 30) + 1;
        if (!mains.includes(special)) break;
      }
    }
    
    const numbers = [...mains.sort((a, b) => a - b), special];
    return { type, numbers };
  }
  
  if (type === "fucai3d") {
    // 福彩3D：每位1-9（3位）
    const validNumbers = luckyNumbers.filter(n => n >= 1 && n <= 9);
    let numbers: number[] = [];
    
    if (validNumbers.length >= 3) {
      numbers = validNumbers.slice(0, 3);
    } else {
      numbers = [...validNumbers];
      while (numbers.length < 3) {
        numbers.push(Math.floor(Math.random() * 9) + 1);
      }
    }
    
    return { type, numbers };
  }
  
  if (type === "kuaile8") {
    // 快乐8：1-80（20个）
    const validNumbers = luckyNumbers.filter(n => n >= 1 && n <= 80);
    let numbers: number[] = [];
    
    if (validNumbers.length > 0) {
      numbers = [...new Set(validNumbers)].slice(0, 20);
    }
    
    // 补充到20个
    while (numbers.length < 20) {
      const additional = pickUnique(20 - numbers.length, 80);
      for (const num of additional) {
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }
    }
    
    numbers.sort((a, b) => a - b);
    return { type, numbers };
  }
  
  throw new Error(`Unsupported lottery type: ${type}`);
}

// 普通随机生成
function generateNumbers(type: LotteryType): GeneratedResult {
  if (type === "double_color") {
    const reds = pickUnique(6, 33);
    const blues = pickUnique(1, 16);
    return { type, reds, blues };
  }
  
  if (type === "qilecai") {
    const mains = pickUnique(7, 30);
    let special = 0;
    while (true) {
      special = Math.floor(Math.random() * 30) + 1;
      if (!mains.includes(special)) break;
    }
    const numbers = [...mains, special];
    return { type, numbers };
  }
  
  if (type === "fucai3d") {
    const numbers = Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 9));
    return { type, numbers };
  }
  
  if (type === "kuaile8") {
    const numbers = pickUnique(20, 80);
    return { type, numbers };
  }
  
  throw new Error(`Unsupported lottery type: ${type}`);
}

export async function POST(request: NextRequest) {
  try {
    const body: LotteryRequest = await request.json();
    const { type, luckyNumbers } = body;
    
    if (!type) {
      return NextResponse.json(
        { error: '请指定彩票类型' },
        { status: 400 }
      );
    }
    
    let result: GeneratedResult;
    
    if (luckyNumbers && luckyNumbers.length > 0) {
      result = generateWithLuckyNumbers(type, luckyNumbers);
    } else {
      result = generateNumbers(type);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating lottery numbers:', error);
    return NextResponse.json(
      { error: '生成彩票号码时出错' },
      { status: 500 }
    );
  }
}