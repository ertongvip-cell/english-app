# 英语听说学习 App 实施计划

**Goal:** 按设计文档实现一个离线可用、可添加到 iPhone 主屏幕的英语听说学习 PWA。

**Architecture:** Vite + Preact 单页应用，用 hash 路由；业务逻辑（间隔重复、跟读评分、打卡）是独立的纯函数模块；存储层封装 IndexedDB；语音模块封装 speechSynthesis 和 webkitSpeechRecognition；内容为 TS 数据文件，随代码打包。

**Tech Stack:** Vite 6、Preact 10、TypeScript、vite-plugin-pwa、idb

设计文档：`docs/plans/2026-10-15-english-app-design.md`

---

## 目录结构

```
english-app/
  index.html
  vite.config.ts            # base: './'，PWA 配置
  public/icon.svg
  src/
    main.tsx  app.tsx  styles.css
    router.ts               # hash 路由
    lib/
      db.ts                 # IndexedDB 封装
      srs.ts                # 简化 SM-2
      score.ts              # 归一化 + LCS 跟读评分 + 对话判定
      daily.ts              # 打卡/统计
      speech.ts             # TTS + 识别 + 能力检测
      recommend.ts          # 首页"下一张"推荐
      importer.ts           # 文件配对、切句
      backup.ts             # 导出/恢复
    content/
      types.ts  words.ts  grammar.ts  dialogues.ts  lessons.ts  assessment.ts  index.ts
    pages/
      Home.tsx  Cards.tsx  Stats.tsx  Library.tsx  Settings.tsx  Assessment.tsx
      cards/VocabCard.tsx  ListenCard.tsx  GrammarCard.tsx  DialogueCard.tsx
    components/
      SpeakButton.tsx  ScoredSentence.tsx  ProgressBar.tsx
  scripts/check-content.ts  # 内容引用校验
  .github/workflows/deploy.yml
```

## 任务

### Task 1：项目骨架
- 创建 package.json（固定版本）、vite.config.ts、tsconfig.json、index.html、main.tsx、app.tsx（底部 Tab：学习 / 统计 / 资料 / 设置）
- 验证：`npm install && npm run build` 成功
- 提交：`chore: 项目骨架`

### Task 2：纯逻辑模块
- `srs.ts`：`review(state, grade, today) → state`；`isDue(state, today)`
- `score.ts`：`normalize(text)`（小写、去标点、数字转单词、缩写展开）、`scoreSentence(target, heard) → {score, marks[]}`、`judgeTurn(turn, heard)`
- `daily.ts`：`streak(days, today)`、`recordCard(...)`
- 验证：临时 node 脚本对典型输入断言后删除；`npm run build` 通过
- 提交：`feat: 间隔重复、跟读评分、打卡逻辑`

### Task 3：存储与语音
- `db.ts`：stores = progress / srs / daily / imports / assessments / settings
- `speech.ts`：`speak(text, rate)`、`listen() → Promise<string>`、`canRecognize()`、`pickVoice()`
- 提交：`feat: 存储层与语音封装`

### Task 4：首页、卡片框架、统计
- 首页：今日完成数、连续打卡、推荐卡片、全部卡片入口、"忙碌模式"
- 统计：近 12 周打卡日历、本周卡片数、累计时长
- 提交：`feat: 首页与统计`

### Task 5：四类卡片
- VocabCard、ListenCard（四步流程、倍速、导入音频 A-B 循环）、GrammarCard、DialogueCard
- 识别不可用时降级：录音回放 + 自评
- 提交：`feat: 四类学习卡片`

### Task 6：首期内容（第 1–2 周，14 课）
- 原创课文、理解题、词汇（每课 5 个）、语法点、情景对话
- `scripts/check-content.ts` 校验引用完整性
- 提交：`content: 第 1-2 周课程`

### Task 7：导入、备份、设置、测评
- 资料页：多选文件 → 按文件名配对 → 存 IndexedDB → 生成导入课
- 备份 JSON 导出/恢复
- 设置：每日目标、语速、语音、AI（灰显）
- 测评：首次口语补测；距上次测评满 28 天时提醒复测
- 提交：`feat: 导入、备份、设置、测评`

### Task 8：部署
- GitHub Actions 构建并发布到 Pages；引导用户创建仓库并推送
- 在 iPhone 上实测清单（见设计文档第 7 节）
