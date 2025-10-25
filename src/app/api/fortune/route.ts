import { NextRequest, NextResponse } from 'next/server';

const FORTUNE_API_BASE = 'http://fortunecookieapi.herokuapp.com/v1';

// 降级数据 - 每次都生成不同的随机内容
const fallbackMessages = [
  "好运即将降临，保持积极的心态。",
  "今天是充满机遇的一天，勇敢迈出第一步。",
  "幸福就在不远处等着你，继续前进。",
  "相信自己的直觉，它会指引你走向成功。",
  "今日的努力将为明天带来丰硕的果实。",
  "保持微笑，好运自然会跟随而来。",
  "机会总是留给有准备的人，你已经准备好了。",
  "今天是实现梦想的好日子，勇敢追求吧。"
];

const fallbackLessons = [
  { english: "Good fortune comes to those who wait.", chinese: "好运总是眷顾有耐心的人。" },
  { english: "Every cloud has a silver lining.", chinese: "乌云背后总有一线光明。" },
  { english: "Fortune favors the bold.", chinese: "幸运眷顾勇敢的人。" },
  { english: "The best time to plant a tree was 20 years ago. The second best time is now.", chinese: "种树的最佳时机是20年前，其次是现在。" },
  { english: "Success is where preparation and opportunity meet.", chinese: "成功是准备与机遇的结合。" }
];

function getRandomFallbackData() {
  const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  const randomLesson = fallbackLessons[Math.floor(Math.random() * fallbackLessons.length)];
  
  return {
    fortune: {
      message: randomMessage,
      id: Math.floor(Math.random() * 1000) + 1
    },
    lesson: {
      english: randomLesson.english,
      chinese: randomLesson.chinese,
      id: Math.floor(Math.random() * 1000) + 1
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'cookie';
    
    // 添加随机参数确保每次请求都是唯一的
    const randomParam = Math.random().toString(36).substring(7);
    const apiUrl = `${FORTUNE_API_BASE}/${type}?_t=${Date.now()}&_r=${randomParam}`;
    
    // 请求外部API，移除缓存
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Lottery-Consulter/1.0'
      },
      cache: 'no-store' // 禁用缓存
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data,
      cached: false
    });
    
  } catch (error) {
    console.error('Fortune API Error:', error);
    
    // 返回随机降级数据
    return NextResponse.json({
      success: true,
      data: getRandomFallbackData(),
      cached: false,
      fallback: true
    });
  }
}