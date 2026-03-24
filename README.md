# MBTI 深度测评系统

一个纯前端的 MBTI 性格测试网站，包含 93 道开放式论述题目，支持 7 级评分和 AI 深度分析。

## 功能特性

- **93 道题目**：涵盖 EI（外向/内向）、SN（实感/直觉）、TF（思考/情感）、JP（判断/感知）四个维度
- **7 级评分系统**：从"强烈否"(-3) 到"强烈是"(+3)，以及中立(0)，提供细致的评分选项
- **文本表达框**：每题都可附加详细说明，帮助 AI 更准确地理解你的想法
- **API 配置面板**：支持自定义 DeepSeek API 地址、密钥和模型名称
- **进度跟踪**：实时显示答题进度，支持快速导航到任意题目
- **AI 深度分析**：调用 DeepSeek API 进行综合分析，生成个性化的 MBTI 报告
- **本地存储**：自动保存答题进度，支持随时返回继续答题
- **响应式设计**：完美适配桌面、平板和移动设备

## 技术栈

- **前端框架**：React 19 + TypeScript
- **样式**：Tailwind CSS 4 + shadcn/ui
- **路由**：Wouter
- **构建工具**：Vite
- **部署**：GitHub Pages（静态站点）

## 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

### 使用指南

1. **配置 API**
   - 获取 DeepSeek API Key（访问 https://platform.deepseek.com）
   - 在页面顶部的 API 配置区输入密钥
   - 默认 API 地址为 `https://api.deepseek.com`
   - 点击"保存配置"以保存设置

2. **开始答题**
   - 逐题阅读开放式问题
   - 选择 1-7 级评分（或使用数字快捷键）
   - 在文本框中详细描述你的想法（可选但推荐）
   - 使用"下一题"按钮或快速导航跳转

3. **获取分析**
   - 完成全部 93 道题目
   - 点击"分析结果"按钮
   - 等待 AI 生成分析报告（通常需要 30-60 秒）
   - 查看你的 MBTI 类型和详细分析

4. **保存进度**
   - 答题进度自动保存到浏览器本地存储
   - 关闭浏览器后重新打开时会恢复进度
   - 点击"保存进度"手动保存 API 配置

## 项目结构

```
client/
├── public/
│   ├── questions.json          # 93 道题目数据
│   └── favicon.ico
├── src/
│   ├── pages/
│   │   └── Home.tsx            # 主页面组件
│   ├── components/             # UI 组件库
│   ├── App.tsx                 # 应用入口
│   ├── main.tsx                # React 入口
│   └── index.css               # 全局样式
└── index.html                  # HTML 模板
```

## 数据结构

### 题目格式

```json
{
  "id": "EI_001",
  "dimension": "EI",
  "sub_aspect": "social_energy",
  "original_text": "原始选择题文本",
  "open_ended": "开放式论述题文本"
}
```

### 答案存储

答案以 Map 形式存储在浏览器 localStorage 中，包含：
- `questionId`：题目 ID
- `score`：-3 到 +3 的评分
- `text`：用户的文本说明

## 部署到 GitHub Pages

### 方式一：使用 GitHub Actions（推荐）

1. 将项目推送到 GitHub
2. 在仓库设置中启用 GitHub Pages
3. 选择"GitHub Actions"作为构建来源
4. 自动构建并部署

### 方式二：手动部署

```bash
# 构建项目
pnpm build

# 将 dist 目录推送到 gh-pages 分支
npm run deploy
```

## API 集成

项目使用 DeepSeek API 进行 AI 分析。调用流程：

1. 收集用户的 93 道题目答案和评分
2. 计算各维度的平均分
3. 构建分析提示词
4. 调用 DeepSeek Chat API
5. 解析返回的 JSON 格式分析结果
6. 展示在前端界面

## 浏览器兼容性

- Chrome/Edge：最新版本
- Firefox：最新版本
- Safari：最新版本
- 移动浏览器：iOS Safari 12+，Chrome Mobile 最新版本

## 注意事项

- **API 密钥安全**：API 密钥仅存储在浏览器本地，不会上传到服务器
- **隐私保护**：所有答题数据仅存储在本地浏览器中，不会被收集或上传
- **网络连接**：分析功能需要互联网连接以调用 DeepSeek API
- **题目完成度**：必须完成全部 93 道题目才能进行 AI 分析

## 常见问题

### Q: 如何修改题目？
A: 编辑 `client/public/questions.json` 文件，修改或添加题目，然后重新构建项目。

### Q: 可以离线使用吗？
A: 可以，但 AI 分析功能需要网络连接和有效的 API 密钥。

### Q: 如何自定义样式？
A: 编辑 `client/src/index.css` 中的 CSS 变量，或修改 React 组件中的 Tailwind 类名。

### Q: 支持多语言吗？
A: 目前仅支持中文。可以通过修改题目和 UI 文本来支持其他语言。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系我们。
