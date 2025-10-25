"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FortuneDisplay } from "@/components/FortuneDisplay";
import { useFortune } from "@/hooks/useFortune";
import LuckyIndexTest from "@/components/LuckyIndexTest";




type GeneratedResult = {
  type: LotteryType;
  reds?: number[]; // for 双色球
  blues?: number[]; // for 双色球 (1 blue)
  numbers?: number[]; // for 七乐彩、福彩3D、快乐8
};

const LOTTERY_STORAGE_KEY = "lottery-consulter:last";
const TYPE_STORAGE_KEY = "lottery-consulter:type";

// Remove legacy Chinese-key LotteryType; use English keys below
type LotteryType = "double_color" | "qilecai" | "fucai3d" | "kuaile8";
const LOTTERY_LABELS: Record<LotteryType, string> = {
  double_color: "双色球",
  qilecai: "七乐彩",
  fucai3d: "福彩3D",
  kuaile8: "快乐8",
};

function useGluqloRolling(target: number, duration = 4500, min = 0, max = 99, startAnimation = false) {
  const [currentDisplayValue, setCurrentDisplayValue] = useState(0);
  const [running, setRunning] = useState(false);
  const [frame, setFrame] = useState(0);
  const [animationId, setAnimationId] = useState<number | null>(null);
  const [flipAnimationId, setFlipAnimationId] = useState<number | null>(null);

  useEffect(() => {
    // Cleanup previous animations
    if (animationId) {
      cancelAnimationFrame(animationId);
      setAnimationId(null);
    }
    if (flipAnimationId) {
      clearTimeout(flipAnimationId);
      setFlipAnimationId(null);
    }

    if (!startAnimation) {
      setRunning(false);
      setCurrentDisplayValue(target);
      setFrame(0);
      return;
    }

    setRunning(true);
    setFrame(0);
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    const flipInterval = 333; // Flip every 333ms (3 times per second)
    let lastFlipTime = startTime;
    
    let lastUpdateTime = startTime;
    const targetFPS = 8; // 8fps
    const frameInterval = 1000 / targetFPS; // 125ms per frame

    const animate = () => {
      const currentTime = Date.now();
      
      if (currentTime >= endTime) {
        // Animation complete: set to target value
        setCurrentDisplayValue(target);
        setRunning(false);
        setFrame(0);
        setAnimationId(null);
        return;
      }
      
      // FPS control: update only when interval reached
      if (currentTime - lastUpdateTime >= frameInterval) {
        // Compute overall progress
        const totalProgress = (currentTime - startTime) / (endTime - startTime);
        
        // Continuous flip logic at 8fps
        if (totalProgress < 0.85) {
          // Random phase: change every 125ms
          const randomValue = min + Math.floor(Math.random() * (max - min + 1));
          setCurrentDisplayValue(randomValue);
          setFrame(30 + Math.floor(Math.random() * 40)); // Flipping state
        } else {
          // Approach target phase
          const approachProgress = (totalProgress - 0.85) / 0.15;
          if (approachProgress > 0.6) {
            setCurrentDisplayValue(target);
            setFrame(0); // Static state
          } else {
            // Reduce change frequency during approach
            if (Math.random() < 0.4) {
              const randomValue = Math.random() < 0.85 ? target : (min + Math.floor(Math.random() * (max - min + 1)));
              setCurrentDisplayValue(randomValue);
              setFrame(15 + Math.floor(Math.random() * 25)); // Smaller flip state
            }
          }
        }
        
        lastUpdateTime = currentTime;
      }
      
      const id = requestAnimationFrame(animate);
      setAnimationId(id);
    };

    const id = requestAnimationFrame(animate);
    setAnimationId(id);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (flipAnimationId) {
        clearTimeout(flipAnimationId);
      }
    };
  }, [target, duration, min, max, startAnimation]);

  return { 
    value: currentDisplayValue, 
    running, 
    frame,
    targetValue: target
  };
}

function RollingFlap({ n, color, duration, startAnimation, min, max, padWidth = 2 }: { n: number; color: "red" | "blue" | "neutral" | "orange" | "sky" | "amber"; duration: number; startAnimation?: boolean; min: number; max: number; padWidth?: number }) {
  const { value, running, frame, targetValue } = useGluqloRolling(n, duration, min, max, startAnimation);

  const base =
     "w-16 h-20 md:w-20 md:h-24 rounded-lg overflow-hidden text-4xl md:text-5xl font-sans font-black select-none flip-number";
  const tone =
    color === "red"
      ? "bg-red-600 text-white shadow-lg"
      : color === "blue"
      ? "bg-blue-600 text-white shadow-lg"
      : color === "orange"
      ? "bg-orange-600 text-white shadow-lg"
      : color === "sky"
      ? "bg-sky-500 text-white shadow-lg"
      : color === "amber"
      ? "bg-amber-400 text-white shadow-lg"
      : "bg-zinc-900 text-zinc-50 dark:bg-zinc-950 shadow-lg";

  // Flip logic: current and target values
  const currentValue = value;
  const nextValue = running ? (currentValue >= max ? min : currentValue + 1) : targetValue; // Next value to display
  
  const currentText = currentValue.toString().padStart(padWidth, "0");
  const nextText = nextValue.toString().padStart(padWidth, "0");
  
  // Flip progress by frame (0–50)
  const flipProgress = frame / 50;

  return (
    <div 
      className={`${base} ${tone}`}
      style={{
        '--flip-progress': flipProgress,
        '--frame': frame
      } as React.CSSProperties}
      data-flipping={running && frame > 0}
      data-frame={frame}
    >
      {/* Front: current number */}
      <div className="time front" data-number={currentText}></div>
      
      {/* Back: next number */}
      <div className="time back" data-number={nextText}></div>
    </div>
  );
}

export default function Home() {
  const [type, setType] = useState<LotteryType | undefined>(undefined);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string>("");
  const [globalDuration, setGlobalDuration] = useState<number>(4500);
  const [startAnimation, setStartAnimation] = useState<boolean>(false);
  const [showFireworks, setShowFireworks] = useState<boolean>(false);
  const [showLuckyTest, setShowLuckyTest] = useState<boolean>(false);
  const [luckyNumbers, setLuckyNumbers] = useState<number[] | null>(null);
  const [shouldAutoTryLuck, setShouldAutoTryLuck] = useState<boolean>(false);
  
  // Fortune hook
  const { fortune, loading: fortuneLoading, error: fortuneError, fetchFortune } = useFortune();

  useEffect(() => {
    // Do not restore type and numbers on initial view
  }, []);

  useEffect(() => {
    if (type) localStorage.setItem(TYPE_STORAGE_KEY, type);
  }, [type]);

  const onTryLuck = useCallback(async () => {
    setError("");
    if (!type) {
      setError("请先选择彩票类型");
      return;
    }

    setStartAnimation(false);
    setResult(null);

    try {
      const requestBody: any = { type };
      
      // 如果有幸运数字，传递给API
      if (luckyNumbers && luckyNumbers.length > 0) {
        requestBody.luckyNumbers = luckyNumbers;
      }

      const response = await fetch("/api/lottery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      // 清除已使用的幸运数字
      setLuckyNumbers(null);

      // Start animation after a short delay
      setTimeout(() => {
        setStartAnimation(true);
      }, 100);

      // Show fireworks after animation completes
      setTimeout(() => {
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 3000);
      }, globalDuration + 500);

      // Fetch fortune after generating numbers
      fetchFortune('cookie');
    } catch (err) {
      console.error("Error generating lottery numbers:", err);
      setError("生成彩票号码时出错，请重试");
    }
  }, [type, luckyNumbers, globalDuration, fetchFortune]);

  // 监听幸运数字变化，自动触发彩票生成
  useEffect(() => {
    if (shouldAutoTryLuck && luckyNumbers && luckyNumbers.length > 0) {
      setShouldAutoTryLuck(false); // 重置标志
      onTryLuck();
    }
  }, [luckyNumbers, shouldAutoTryLuck, onTryLuck]);

  // 监听幸运数字使用事件和触发试手气事件
  useEffect(() => {
    const handleUseLuckyNumbers = (event: CustomEvent) => {
      const { numbers } = event.detail;
      setLuckyNumbers(numbers);
      
      // 自动设置为双色球类型（最常用）
      if (!type) {
        setType('double_color');
      }
    };

    const handleTriggerTryLuck = () => {
      // 设置标志，等待luckyNumbers状态更新后自动触发
      setShouldAutoTryLuck(true);
    };

    window.addEventListener('useLuckyNumbers', handleUseLuckyNumbers as EventListener);
    window.addEventListener('triggerTryLuck', handleTriggerTryLuck as EventListener);
    
    return () => {
      window.removeEventListener('useLuckyNumbers', handleUseLuckyNumbers as EventListener);
      window.removeEventListener('triggerTryLuck', handleTriggerTryLuck as EventListener);
    };
  }, [onTryLuck, type]);

  const title = useMemo(() => "好运来敲我的门", []);

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        {/* Subtitle */}
        <p className="mt-1 text-lg md:text-xl text-zinc-700 dark:text-zinc-300" style={{ fontFamily: '"KaiTi","Kaiti SC","STKaiti",serif' }}>
          中国福利彩票号码随机生成器
        </p>
        {/* Disclaimer */}
        <p className="mt-3 text-sm md:text-base text-zinc-600 dark:text-zinc-400">
          本页面不收集、不保存任何个人信息。仅供娱乐，不能用于彩票购买，不保证号码中奖。
        </p>

        {/* Selector and actions */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-zinc-500">彩票类型</label>
            <Select value={type} onValueChange={(v) => setType(v as LotteryType)}>
              <SelectTrigger className="w-full bg-white dark:bg-zinc-900 h-10">
                <SelectValue placeholder="请选择彩票类型" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900">
                <SelectItem value="double_color">{LOTTERY_LABELS.double_color}</SelectItem>
                <SelectItem value="qilecai">{LOTTERY_LABELS.qilecai}</SelectItem>
                <SelectItem value="fucai3d">{LOTTERY_LABELS.fucai3d}</SelectItem>
                <SelectItem value="kuaile8">{LOTTERY_LABELS.kuaile8}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onTryLuck} size="default" className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-yellow-300 border-0 h-10 px-4 py-2 text-sm">试试好手气</Button>
            {error && (
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            )}
          </div>
        </div>

        {/* Lucky Index Test Toggle */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => setShowLuckyTest(!showLuckyTest)}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800 hover:from-amber-100 hover:to-yellow-100 hover:border-amber-300 transition-all duration-300"
          >
            {showLuckyTest ? '隐藏幸运指数测试' : '🔮 幸运指数测试'}
          </Button>
        </div>

        {/* Lucky Index Test */}
        {showLuckyTest && (
          <div className="mt-6 mb-8">
            <LuckyIndexTest />
          </div>
        )}

        {/* Numbers area */}
        <section className="mt-8 rounded-lg border bg-card p-4 md:p-6 splitflap">
          {/* Show placeholder stars until result is generated */}

          {result && result.type === "double_color" && (
            <div>
              <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">红球（6个）：</div>
              <div className="flex flex-wrap gap-3">
                {result.reds?.map((n, idx) => (
                  <RollingFlap key={`r-${n}-${idx}`} n={n} color="red" duration={globalDuration} startAnimation={startAnimation} min={1} max={33} />
                ))}
              </div>
              <div className="mt-6 mb-2 text-sm text-zinc-600 dark:text-zinc-400">蓝球（1个）：</div>
              <div className="flex flex-wrap gap-3">
                {result.blues?.map((n, idx) => (
                  <RollingFlap key={`b-${n}-${idx}`} n={n} color="blue" duration={globalDuration} startAnimation={startAnimation} min={1} max={16} />
                ))}
              </div>
            </div>
          )}

          {result && result.type === "qilecai" && (
            <div>
              <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">号码（7个＋特别号1个）：</div>
              <div className="flex flex-wrap gap-3">
                {result.numbers?.map((n, idx) => {
                  const isLast = idx === (result.numbers?.length ?? 0) - 1;
                  const color = isLast ? "orange" : "amber";
                  return (
                    <RollingFlap key={`qlc-${n}-${idx}`} n={n} color={color as any} duration={globalDuration} startAnimation={startAnimation} min={1} max={30} />
                  );
                })}
              </div>
            </div>
          )}

          {result && result.type === "fucai3d" && (
            <div>
              <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">号码（3位）：</div>
              <div className="flex flex-wrap gap-3">
                {result.numbers?.map((n, idx) => (
                  <RollingFlap key={`3d-${idx}`} n={n} color="sky" duration={globalDuration} startAnimation={startAnimation} min={1} max={9} padWidth={1} />
                ))}
              </div>
            </div>
          )}

          {result && result.type === "kuaile8" && (
            <div>
              <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">号码（20个）：</div>
              <div className="flex flex-wrap gap-3">
                {result.numbers?.map((n, idx) => (
                  <RollingFlap key={`k8-${n}-${idx}`} n={n} color="orange" duration={globalDuration} startAnimation={startAnimation} min={1} max={80} />
                ))}
              </div>
            </div>
          )}
          {!result && (
            <div className="flex flex-wrap items-center justify-center gap-3 py-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <svg key={`star-${i}`} viewBox="0 0 24 24" aria-label="红色五角星" className="w-8 h-8 md:w-10 md:h-10 text-red-600 fill-current drop-shadow-sm">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"></path>
                </svg>
              ))}
            </div>
          )}
        </section>

        {/* Fortune Display */}
        {(fortune || fortuneLoading || fortuneError) && (
          <div className="mt-8">
            <FortuneDisplay 
              fortune={fortune} 
              loading={fortuneLoading} 
              error={fortuneError}
              onRefresh={() => fetchFortune('cookie')}
            />
          </div>
        )}

      </main>
      {/* Fireworks overlay */}
      <FireworksOverlay active={showFireworks} />
    </div>
  );
}

// Simple fireworks overlay: render full-screen canvas when active
function FireworksOverlay({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", resize);

    type Particle = {
      x: number; y: number; vx: number; vy: number; life: number; color: string; size: number;
    };
    const particles: Particle[] = [];

    function burst(cx: number, cy: number) {
      const colors = ["#ff4d4f", "#faad14", "#40a9ff", "#52c41a", "#eb2f96", "#ffd666"];
      const count = 80 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3.5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60 + Math.floor(Math.random() * 40),
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 2.5,
        });
      }
    }

    // 发射几枚烟花，中心在上半区域随机位置
    for (let i = 0; i < 4; i++) {
      const x = W * (0.2 + Math.random() * 0.6);
      const y = H * (0.2 + Math.random() * 0.35);
      setTimeout(() => burst(x, y), i * 220);
    }

    let raf = 0;
    function loop() {
      ctx.clearRect(0, 0, W, H);
      // 半透明叠加拖影
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, W, H);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // 重力与阻尼
        p.vy += 0.05;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        const alpha = Math.max(p.life / 100, 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, W, H);
    };
  }, [active]);

  return (
    <div className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`} aria-hidden>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
