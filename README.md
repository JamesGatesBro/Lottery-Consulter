# 好运来敲我的门 · 中国福利彩票号码随机生成器

一个基于 Next.js + React 的号码随机生成与翻页动画演示项目，支持多种彩票类型与合规的号码范围展示。页面仅供娱乐，不能用于彩票购买，不保证号码中奖。

## 功能特性
- 支持的彩种与范围约束：
  - 双色球：红球 1–33（6个），蓝球 1–16（1个）
  - 七乐彩：1–30（7个）＋特别号 1–30（1个）
  - 福彩3D：每位 1–9（3位，单数字显示）
  - 快乐8：1–80（20个）
- 翻页/滚动动画展示（按类型范围循环，不越界）
- 简洁 UI 与暗黑模式支持

## 技术栈
- Next.js（React, TypeScript）
- Tailwind CSS（样式）
- Shadcn/UI（部分组件）

## 快速开始
### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:3000/）
npm run dev
```

### 构建与生产预览
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

建议使用 Node.js 18+。如果你在 Windows 使用本项目的 `node-portable`，可直接运行对应的 npm 命令。

## 目录结构（简要）
```
lottery-consulter/
├── public/
├── src/
│   ├── app/           # 页面入口与布局
│   ├── components/    # UI 组件
│   └── lib/           # 工具函数
├── .next/             # 构建/开发产物（不需提交到仓库）
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── README.md
```

## 重要说明
- `.next/` 是 Next.js 的构建与开发产物目录：
  - 开发模式（`npm run dev`）与生产构建（`npm run build`）都会生成内容到该目录。
  - 这是自动生成的二进制与中间文件集合，不应提交到 Git 仓库。
- `.gitignore` 是 Git 的忽略规则文件：
  - 用于告知 Git 哪些文件/目录不需要纳入版本控制。
  - 典型内容示例：
    ```gitignore
    node_modules/
    .next/
    .env*
    dist/
    .DS_Store
    ```

## 声明
- 本项目仅用于娱乐与技术演示，不构成投注建议或任何承诺。
- 生成的号码不保证中奖，请理性看待。

## 许可证
- 暂未设置许可证；如需开源发布，可添加合适的开源许可证（例如 MIT）。

## 环境变量示例
- 在仓库根目录新增了 `.env.example`，请复制为 `.env` 并填写实际值：
  - `NEXT_PUBLIC_*` 变量会在客户端可见（例如 `NEXT_PUBLIC_APP_NAME`、`NEXT_PUBLIC_BASE_URL`、`NEXT_PUBLIC_DEFAULT_LOTTERY`）。
  - 服务端私密变量不要以 `NEXT_PUBLIC_` 开头，例如 `API_BASE_URL`、`SECRET_KEY`。
- `.gitignore` 已默认忽略 `.env`，不要将私密配置提交到仓库。

## 部署到 Vercel/Netlify
- Vercel（推荐，原生支持 Next.js）：
  - 将本项目推送到 GitHub 后，在 Vercel 仪表盘选择 “Add New → Project”，导入仓库。
  - 框架选择 `Next.js`；构建命令默认 `npm run build`，生产启动由平台托管。
  - 在 Project Settings → Environment Variables 中添加 `.env` 的变量（参考 `.env.example`）。
  - 部署成功后，Vercel 会分配预览域名与生产域名，可通过 `NEXT_PUBLIC_BASE_URL` 进行配置引用。
- Netlify（两种方式）：
  - 方式 A（支持 SSR，推荐）：安装 Next.js 插件并配置 `netlify.toml`：
    ```toml
    [build]
      command = "npm run build"
      publish = ".next"
    [[plugins]]
      package = "@netlify/plugin-nextjs"
    ```
    在 Netlify 的 Site settings → Build & deploy → Environment 中添加环境变量。
  - 方式 B（纯静态导出）：若页面不依赖 SSR，可使用 `next export`：
    - 在 `package.json` 中添加脚本：`"export": "next build && next export"`
    - 运行 `npm run export` 后将生成 `out/` 目录；Netlify 的 Publish directory 设置为 `out/`。

- 注意：`.next/` 目录为构建产物，已在 `.gitignore` 中忽略，部署平台会在云端构建生成。
