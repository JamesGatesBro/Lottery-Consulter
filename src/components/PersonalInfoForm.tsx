'use client';

import { useState, useEffect } from 'react';
import type { UserInput, PersonalInfoFormProps, FormErrors, LuckyColor } from '@/types/lucky-index';
import { LUCKY_COLORS, DEFAULT_PREFERENCES } from '@/types/lucky-index';

export default function PersonalInfoForm({ onSubmit, isLoading, className = '' }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState<UserInput>({
    name: '',
    birthDate: '',
    luckyColor: '',
    preferences: DEFAULT_PREFERENCES,
  });

  // 生日的年月日状态
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');

  const [errors, setErrors] = useState<FormErrors>({});

  // 判断是否为闰年
  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  // 获取指定年月的天数
  const getDaysInMonth = (year: number, month: number): number => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && isLeapYear(year)) {
      return 29;
    }
    return daysInMonth[month - 1];
  };

  // 生成年份选项（1900年到当前年份）
  const generateYearOptions = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  // 生成月份选项
  const generateMonthOptions = (): number[] => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // 生成日期选项
  const generateDayOptions = (): number[] => {
    if (!birthYear || !birthMonth) return [];
    const year = parseInt(birthYear);
    const month = parseInt(birthMonth);
    const daysInMonth = getDaysInMonth(year, month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // 初始化年月日状态（如果formData.birthDate有值）
  useEffect(() => {
    if (formData.birthDate && !birthYear && !birthMonth && !birthDay) {
      const date = new Date(formData.birthDate);
      if (!isNaN(date.getTime())) {
        setBirthYear(date.getFullYear().toString());
        setBirthMonth((date.getMonth() + 1).toString());
        setBirthDay(date.getDate().toString());
      }
    }
  }, [formData.birthDate, birthYear, birthMonth, birthDay]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 验证姓名
    if (!formData.name.trim()) {
      newErrors.name = '请输入您的姓名';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '姓名至少需要2个字符';
    } else if (formData.name.trim().length > 20) {
      newErrors.name = '姓名不能超过20个字符';
    }

    // 验证生日
    if (!formData.birthDate) {
      newErrors.birthDate = '请选择您的生日';
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        newErrors.birthDate = '生日格式不正确';
      } else if (birthDate > today) {
        newErrors.birthDate = '生日不能是未来日期';
      } else {
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 120);
        
        if (birthDate < minDate) {
          newErrors.birthDate = '请输入有效的生日';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof UserInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 清除对应字段的错误
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handlePreferencesChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  // 处理年月日变化
  const handleBirthDateChange = (type: 'year' | 'month' | 'day', value: string) => {
    let newYear = birthYear;
    let newMonth = birthMonth;
    let newDay = birthDay;

    if (type === 'year') {
      setBirthYear(value);
      newYear = value;
    } else if (type === 'month') {
      setBirthMonth(value);
      newMonth = value;
    } else if (type === 'day') {
      setBirthDay(value);
      newDay = value;
    }

    // 检查日期是否有效（处理2月29日在非闰年的情况）
    if (newYear && newMonth && newDay) {
      const year = parseInt(newYear);
      const month = parseInt(newMonth);
      const day = parseInt(newDay);
      const maxDays = getDaysInMonth(year, month);
      
      if (day > maxDays) {
        // 如果选择的日期超过了该月的最大天数，自动调整为该月的最后一天
        newDay = maxDays.toString();
        setBirthDay(newDay);
      }
    }

    // 更新formData.birthDate
    if (newYear && newMonth && newDay) {
      const formattedDate = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
      setFormData(prev => ({
        ...prev,
        birthDate: formattedDate,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        birthDate: '',
      }));
    }

    // 清除生日错误
    if (errors.birthDate) {
      setErrors(prev => ({
        ...prev,
        birthDate: undefined,
      }));
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-yellow-400/30 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">幸运指数测试</h2>
        <p className="text-gray-700">输入您的个人信息，获取专属幸运指数</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 姓名输入 */}
        <div>
          <label htmlFor="name" className="block text-gray-800 font-medium mb-2">
            姓名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
              errors.name ? 'border-red-400' : 'border-yellow-400/30'
            } text-gray-800 placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all`}
            placeholder="请输入您的姓名"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* 生日输入 */}
        <div>
          <label className="block text-gray-800 font-medium mb-2">
            生日 <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {/* 年份选择 */}
            <div>
              <label htmlFor="birthYear" className="block text-gray-700 text-sm mb-1">
                年份
              </label>
              <select
                id="birthYear"
                value={birthYear}
                onChange={(e) => handleBirthDateChange('year', e.target.value)}
                className={`w-full px-3 py-3 rounded-lg bg-white/10 border ${
                  errors.birthDate ? 'border-red-400' : 'border-yellow-400/30'
                } text-gray-800 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all`}
                disabled={isLoading}
              >
                <option value="">选择年份</option>
                {generateYearOptions().map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>

            {/* 月份选择 */}
            <div>
              <label htmlFor="birthMonth" className="block text-gray-700 text-sm mb-1">
                月份
              </label>
              <select
                id="birthMonth"
                value={birthMonth}
                onChange={(e) => handleBirthDateChange('month', e.target.value)}
                className={`w-full px-3 py-3 rounded-lg bg-white/10 border ${
                  errors.birthDate ? 'border-red-400' : 'border-yellow-400/30'
                } text-gray-800 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all`}
                disabled={isLoading}
              >
                <option value="">选择月份</option>
                {generateMonthOptions().map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>

            {/* 日期选择 */}
            <div>
              <label htmlFor="birthDay" className="block text-gray-700 text-sm mb-1">
                日期
              </label>
              <select
                id="birthDay"
                value={birthDay}
                onChange={(e) => handleBirthDateChange('day', e.target.value)}
                className={`w-full px-3 py-3 rounded-lg bg-white/10 border ${
                  errors.birthDate ? 'border-red-400' : 'border-yellow-400/30'
                } text-gray-800 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all`}
                disabled={isLoading || !birthYear || !birthMonth}
              >
                <option value="">选择日期</option>
                {generateDayOptions().map(day => (
                  <option key={day} value={day}>{day}日</option>
                ))}
              </select>
            </div>
          </div>
          {errors.birthDate && (
            <p className="text-red-400 text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>

        {/* 幸运颜色选择 */}
        <div>
          <label className="block text-gray-800 font-medium mb-3">
            幸运颜色 <span className="text-gray-600">(可选)</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {LUCKY_COLORS.map((color: LuckyColor) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleInputChange('luckyColor', color.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.luckyColor === color.value
                    ? 'border-yellow-400 bg-yellow-400/20'
                    : 'border-white/20 bg-white/5 hover:border-yellow-400/50'
                }`}
                disabled={isLoading}
              >
                <div
                  className="w-6 h-6 rounded-full mx-auto mb-2 border-2 border-white/30"
                  style={{ backgroundColor: color.color }}
                />
                <div className="text-gray-800 text-sm font-medium">{color.name}</div>
                <div className="text-gray-600 text-xs mt-1">{color.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 偏好设置 */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-gray-800 font-medium mb-3">偏好设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="count" className="block text-gray-700 text-sm mb-1">
                幸运数字个数
              </label>
              <select
                id="count"
                value={formData.preferences?.count || 6}
                onChange={(e) => handlePreferencesChange('count', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded bg-white/10 border border-yellow-400/30 text-gray-800 focus:outline-none focus:border-yellow-400"
                disabled={isLoading}
              >
                <option value={5}>5个数字</option>
                <option value={6}>6个数字</option>
                <option value={7}>7个数字</option>
              </select>
            </div>
            <div>
              <label htmlFor="numberRange" className="block text-gray-700 text-sm mb-1">
                数字范围
              </label>
              <select
                id="numberRange"
                value={formData.preferences?.numberRange || '1-33'}
                onChange={(e) => handlePreferencesChange('numberRange', e.target.value)}
                className="w-full px-3 py-2 rounded bg-white/10 border border-yellow-400/30 text-gray-800 focus:outline-none focus:border-yellow-400"
                disabled={isLoading}
              >
                <option value="1-30">1-30 (七乐彩)</option>
                <option value="1-33">1-33 (双色球)</option>
                <option value="1-80">1-80 (快乐8)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            isLoading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
              计算中...
            </div>
          ) : (
            '开始测试幸运指数'
          )}
        </button>
      </form>
    </div>
  );
}