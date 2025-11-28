# 悠悠打字通 (Yoyo Typing Master)

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

一款专为学生设计的趣味打字练习工具，包含基础指法、单词练习、游戏模式和AI智能出题功能。

## 📸 界面预览

### 🏠 练习大厅
![Home](./img/Xnip2025-11-28_17-26-21.jpg)

### 🎮 趣味游戏
| 🐸 青蛙过河 | ⚔️ 勇者斗恶龙 | 🏁 打字赛跑 | ⌨️ 单词雨 |
|:---:|:---:|:---:|:---:|
| ![Xnip2025-11-28_17-27-35](./img/Xnip2025-11-28_17-27-35.jpg) | ![Dragon](./img/Xnip2025-11-28_17-27-23.jpg) | ![Race](./img/Xnip2025-11-28_17-26-21.jpg) | ![Race](./img/Xnip2025-11-28_17-27-07.jpg) |


## ✨ 功能特性

### 📚 丰富的练习内容
- **基础指法练习**：基准键位、各手指专项训练
- **单词练习**：常见单词100词
- **句子练习**：励志短句和常用句子
- **代码练习**：JavaScript、Python等编程语言练习
- **小学单词**：按年级分类的小学英语单词（1-6年级）

### 🎮 游戏模式
- **龙之挑战** (Dragon Game)：打字击败飞龙
- **竞速赛** (Race Game)：速度与准确率的比拼
- **青蛙过河** (Frog Game)：趣味打字闯关

### 🤖 AI智能出题
- 基于 Google Gemini API 的智能内容生成
- 支持自定义话题（如：恐龙、太空、科学等）
- 三种难度级别：简单、中等、困难

### 📊 数据统计
- **实时统计**：WPM（每分钟单词数）、准确率、错误数
- **历史记录**：练习历史数据追踪
- **可视化图表**：使用 Recharts 展示进步趋势
- **错误分析**：详细记录每个按键的错误次数

### 🎹 虚拟键盘
- 实时显示键盘布局
- 高亮当前按键
- 错误按键标记
- 手指位置提示

### 🎵 音效反馈
- 按键音效
- 错误提示音
- 完成成功音

## 🛠️ 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 6
- **AI服务**：Google Gemini API (@google/genai)
- **图表库**：Recharts
- **样式**：Tailwind CSS（内联样式）

## 📦 安装和运行

### 环境要求

- Node.js 16+ 
- npm/pnpm/yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd yoyo-typing
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **配置环境变量**

创建 `.env.local` 文件（如果不存在）：
```bash
cp .env .env.local
```

编辑 `.env.local`，添加你的 Gemini API Key：
```env
GEMINI_API_KEY=your_api_key_here
```

> 💡 **获取 API Key**：访问 [Google AI Studio](https://ai.google.dev/) 获取免费的 Gemini API Key

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**

打开浏览器访问 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产版本

```bash
npm run preview
```

## 📁 项目结构

```
yoyo-typing/
├── components/          # React 组件
│   ├── HomeScreen.tsx   # 首页
│   ├── PracticeScreen.tsx  # 练习界面
│   ├── StatsScreen.tsx     # 统计界面
│   ├── TypingGame.tsx      # 打字游戏组件
│   ├── DragonGame.tsx      # 龙之挑战游戏
│   ├── RaceGame.tsx        # 竞速赛游戏
│   ├── FrogGame.tsx        # 青蛙过河游戏
│   └── VirtualKeyboard.tsx # 虚拟键盘组件
├── services/            # 服务层
│   ├── geminiService.ts    # Gemini API 服务
│   └── soundService.ts     # 音效服务
├── App.tsx              # 主应用组件
├── constants.ts         # 常量定义（课程、键盘布局）
├── types.ts             # TypeScript 类型定义
├── word_data.ts         # 小学单词数据
├── vite.config.ts       # Vite 配置
├── package.json         # 项目依赖
└── README.md            # 项目说明文档
```

## 🎯 使用说明

### 基础练习

1. 从首页选择练习类型（基础指法、单词、句子等）
2. 选择难度级别（简单/中等/困难）
3. 开始打字，系统会自动记录你的输入
4. 完成后查看统计结果

### AI智能出题

1. 在首页找到"AI 智能出题"区域
2. 输入感兴趣的话题（如：恐龙、太空、编程）
3. 选择难度级别
4. 点击"生成课程"按钮
5. 等待AI生成内容后开始练习

> ⚠️ **注意**：AI功能需要配置 `GEMINI_API_KEY` 环境变量

### 自定义文本

1. 在首页选择"自定义文本"
2. 输入或粘贴你想要练习的文本
3. 开始练习

### 游戏模式

- **龙之挑战**：通过打字击败飞龙，体验RPG战斗
- **竞速赛**：与其他玩家（或AI）比拼打字速度
- **青蛙过河**：帮助青蛙通过打字跳过障碍

### 查看统计

- 点击首页的"查看进步"卡片
- 查看历史练习记录
- 分析WPM趋势和准确率变化
- 查看错误按键分析

## ⚙️ 配置说明

### 环境变量

项目使用 `.env.local` 文件存储敏感配置（该文件不会被git跟踪）。

**必需配置**：
- `GEMINI_API_KEY`：Google Gemini API密钥（用于AI出题功能）

**可选配置**：
- 可以通过修改 `vite.config.ts` 添加其他环境变量

### 端口配置

默认端口：`3000`

如需修改，编辑 `vite.config.ts`：
```typescript
server: {
  port: 3000,  // 修改为你想要的端口
  host: '0.0.0.0',
}
```

## 🎨 自定义

### 添加新课程

编辑 `constants.ts` 文件，在 `STATIC_LESSONS` 数组中添加新的课程对象：

```typescript
{
  id: 'custom-1',
  title: '我的课程',
  category: 'words',
  difficulty: Difficulty.MEDIUM,
  content: '你的练习内容...'
}
```

### 修改键盘布局

编辑 `constants.ts` 中的 `KEYBOARD_LAYOUT` 数组来调整虚拟键盘显示。

## 🐛 常见问题

### Q: AI出题功能无法使用？
A: 请确保已正确配置 `GEMINI_API_KEY` 环境变量，并重启开发服务器。

### Q: 音效没有声音？
A: 检查浏览器是否允许自动播放音频，或点击页面任意位置后再试。

### Q: 统计数据显示不正确？
A: 清除浏览器缓存或使用隐私模式重新测试。

## 📝 开发说明

### 代码规范

- 使用 TypeScript 进行类型检查
- 组件使用函数式组件和 Hooks
- 样式使用 Tailwind CSS 类名

### 添加新功能

1. 在 `types.ts` 中定义相关类型
2. 创建或修改组件文件
3. 在 `App.tsx` 中集成新功能
4. 更新 `constants.ts` 添加相关配置

## 📄 许可证

本项目为私有项目。

## 🔗 相关链接

- [Google AI Studio](https://ai.google.dev/) - 获取 Gemini API Key
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Recharts 文档](https://recharts.org/)

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**享受打字的乐趣，提升你的打字技能！** 🎉