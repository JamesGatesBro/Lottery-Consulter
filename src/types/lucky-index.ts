// 性别类型
export type Gender = 'male' | 'female' | 'other';

// 用户输入类型
export interface UserInput {
  name: string;
  birthDate: string; // YYYY-MM-DD format
  gender: Gender;
  luckyColor?: string;
  preferences?: {
    numberRange?: string;
    count?: number;
    includeZero?: boolean;
  };
}

// 随机种子类型
export interface RandomSeed {
  id: string;
  values: number[];
  source: 'random.org' | 'fallback';
  createdAt: string;
  isAuthentic: boolean;
}

// 幸运结果类型
export interface LuckyResult {
  luckyIndex: number; // 0-100
  luckyNumbers: number[];
  interpretation: string;
  randomSeed: string;
  timestamp: string;
  confidence: number; // 结果可信度
  factors: {
    nameScore: number;
    birthScore: number;
    genderScore: number;
    colorScore: number;
    randomScore: number;
  };
}

// API响应类型
export interface LuckyIndexResponse {
  success: boolean;
  data?: LuckyResult;
  error?: string;
  metadata: {
    processingTime: number;
    apiVersion: string;
    randomSource: string;
  };
}

// Random.org API响应类型
export interface RandomOrgResponse {
  success: boolean;
  data: number[];
  source: 'random.org' | 'fallback';
  error?: string;
}

// 幸运颜色选项
export interface LuckyColor {
  name: string;
  value: string;
  color: string; // CSS颜色值
  description: string;
}

// 数字命理学权重配置
export interface NumerologyWeights {
  name: number;
  birthDate: number;
  gender: number;
  luckyColor: number;
  randomSeed: number;
}

// 幸运指数解读
export interface LuckyInterpretation {
  min: number;
  max: number;
  text: string;
  level: 'excellent' | 'good' | 'average' | 'poor';
}

// Hook状态类型
export interface UseLuckyIndexState {
  isLoading: boolean;
  isCalculating: boolean;
  result: LuckyResult | null;
  error: string | null;
  randomSeed: RandomSeed | null;
}

// Hook返回类型
export interface UseLuckyIndexReturn extends UseLuckyIndexState {
  calculateLuckyIndex: (input: UserInput) => Promise<void>;
  reset: () => void;
  retry: () => Promise<void>;
}

// 组件Props类型
export interface LuckyIndexTestProps {
  className?: string;
  onResult?: (result: LuckyResult) => void;
  onError?: (error: string) => void;
}

export interface LuckyResultDisplayProps {
  result: LuckyResult;
  onRetry?: () => void;
  onUseNumbers?: (numbers: number[]) => void;
  onReset?: () => void;
  className?: string;
}

export interface PersonalInfoFormProps {
  onSubmit: (input: UserInput) => void;
  isLoading?: boolean;
  className?: string;
}

// 表单错误接口
export interface FormErrors {
  name?: string;
  birthDate?: string;
  gender?: string;
  luckyColor?: string;
  preferences?: string;
}

// 动画状态类型
export interface AnimationState {
  isVisible: boolean;
  isAnimating: boolean;
  progress: number;
}

// 常量定义
export const LUCKY_COLORS: LuckyColor[] = [
  { name: '红色', value: 'red', color: '#EF4444', description: '热情、活力、好运' },
  { name: '橙色', value: 'orange', color: '#F97316', description: '创造力、温暖、成功' },
  { name: '黄色', value: 'yellow', color: '#EAB308', description: '智慧、财富、光明' },
  { name: '绿色', value: 'green', color: '#22C55E', description: '成长、和谐、健康' },
  { name: '蓝色', value: 'blue', color: '#3B82F6', description: '平静、信任、稳定' },
  { name: '紫色', value: 'purple', color: '#A855F7', description: '神秘、高贵、直觉' },
  { name: '粉色', value: 'pink', color: '#EC4899', description: '爱情、温柔、浪漫' },
  { name: '白色', value: 'white', color: '#FFFFFF', description: '纯洁、新开始、清晰' },
  { name: '黑色', value: 'black', color: '#000000', description: '力量、优雅、保护' },
];

export const COLOR_VALUES: Record<string, number> = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
  blue: 5,
  purple: 6,
  pink: 7,
  white: 8,
  black: 9,
};

// 性别选项
export const GENDER_OPTIONS = [
  { value: 'male', label: '男性', description: '偏向奇数，增强事业运' },
  { value: 'female', label: '女性', description: '偏向偶数，增强感情运' },
  { value: 'other', label: '其他', description: '平衡计算，综合运势' },
] as const;

// 性别数值映射
export const GENDER_VALUES: Record<Gender, number> = {
  male: 1,
  female: 2,
  other: 3,
};

export const NUMEROLOGY_WEIGHTS: NumerologyWeights = {
  name: 0.25,
  birthDate: 0.35,
  gender: 0.15,
  luckyColor: 0.1,
  randomSeed: 0.15,
};

// 默认偏好设置
export const DEFAULT_PREFERENCES = {
  numberRange: '1-33',
  count: 6,
  includeZero: false,
};