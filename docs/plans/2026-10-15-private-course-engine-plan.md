# 通用私有课程引擎 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建 Mac 私有课程管理工具、标准课程包导入能力和以英语直接反应为核心的 iPhone 训练引擎，并先产出 6 个新概念补漏课程包。

**Architecture:** 仓库内实现通用 schema、校验器、来源适配器和学习 UI；仓库外保留教材原件与生成的私有课程包。Mac CLI/本地管理页读取用户指定目录并输出 `.lesson.json + media`，iPhone PWA 运行时导入到 IndexedDB，不向服务器上传。

**Tech Stack:** TypeScript、Vite、Preact、IndexedDB/idb、Node.js 文件处理、浏览器 Web Audio/HTMLAudioElement、现有 SpeechRecognition/TTS

---

### Task 1：私有资料隔离与课程包 Schema

**Files:**
- Modify: `.gitignore`
- Create: `src/private-course/schema.ts`
- Create: `src/private-course/validate.ts`
- Create: `scripts/test-private-course.ts`

**Steps:**
1. 定义 versioned `PrivateLesson`、时间轴、英英词汇、句块、复述、迁移任务和 `LearningPlan`。
2. 实现无依赖运行时校验，拒绝无效 ID、时间轴倒序、缺失引用和超范围反应时间。
3. 增加 PDF/MP3/LRC/AIFF/OCR/私有课程包/备份误提交防护。
4. 运行 `node --experimental-strip-types scripts/test-private-course.ts` 和 `npm run build`。

### Task 2：通用 LRC/文本来源适配器

**Files:**
- Create: `src/private-course/adapters/lrc.ts`
- Create: `src/private-course/adapters/text.ts`
- Create: `src/private-course/match.ts`
- Test: `scripts/test-private-course.ts`

**Steps:**
1. 解析 `[mm:ss.xx]`/`[mm:ss.xxx]`，过滤元数据，保留 cue 与源行号。
2. 支持 TXT/Markdown/LRC/SRT/VTT 归一化。
3. 使用来源、册号、课号、规范化标题匹配同名媒体，第一册识别奇偶课范围。
4. 用用户本地第 15、31、47、67、73、135 课 LRC 做结构检查，只输出统计，不输出大段原文。

### Task 3：Mac 课程管理 CLI 与本地预览

**Files:**
- Create: `scripts/course-manager.ts`
- Create: `course-manager/index.html`
- Create: `course-manager/app.ts`
- Modify: `package.json`

**Steps:**
1. CLI `scan --source <path>` 生成仓库外 manifest，显示缺失/重复/未完成媒体。
2. CLI `build --lessons 015,031,... --output <path>` 生成课程包骨架并复制/关联媒体。
3. 本地管理页展示匹配状态、课程勾选、顺序和起点；允许预览/编辑拆解 JSON。
4. 不把绝对路径或版权文本写入仓库。

### Task 4：扩展 IndexedDB 与课程包导入

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/lib/importer.ts`
- Modify: `src/lib/backup.ts`
- Modify: `src/pages/Management.tsx`

**Steps:**
1. `ImportedLesson` 支持标准私有课程字段、媒体校验值和学习计划。
2. 批量导入 `.lesson.json + MP3/M4A/WAV`，按固定 ID 更新内容且保留进度。
3. UI 展示来源、课号、拆解完整度、原音/时间轴状态；允许选择学习起点和标记熟悉。
4. 备份保留进度与用户生成元数据，不包含媒体；明确备份含私有课文。

### Task 5：时间轴播放器与逐句解码

**Files:**
- Create: `src/components/CuedAudioPlayer.tsx`
- Modify: `src/pages/Cards.tsx`
- Modify: `src/styles.css`

**Steps:**
1. 实现 cue seek、当前句同步高亮、逐句播放、A-B 循环和 0.7/0.85/1.0 倍速。
2. 解码顺序：英文原句 → 英文改述 → 中文兜底；记录中文提示使用次数。
3. 无时间轴时降级整段播放，无音频时降级系统 TTS。

### Task 6：英语直接反应训练

**Files:**
- Create: `src/lib/mastery.ts`
- Create: `src/pages/cards/ConceptCard.tsx`
- Create: `src/pages/cards/ReactionCard.tsx`
- Create: `src/pages/cards/RetellCard.tsx`
- Create: `src/pages/cards/TransferCard.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Cards.tsx`

**Steps:**
1. 英文概念题不默认显示中文。
2. 句块训练测量提示出现至识别完成的反应时长；5 秒、3 秒两级目标。
3. 连续两次正确且 ≤3 秒进入 direct 状态；慢答、中文提示或关键语序错误重新排期。
4. 复述从关键词到自由表达；按关键信息覆盖率评分。
5. 迁移任务按交流意图和关键表达判定，不要求逐字复现。
6. 首页展示直接反应词块数、平均回应时间和中文提示使用率。

### Task 7：首批 6 课私有课程包

**Private output only:** `../英语测评/私有课程包/第一阶段/`

**Steps:**
1. 处理 015&016、031&032、047&048、067&068、073&074、135&136 的 LRC/MP3。
2. 从扫描 PDF 本地 OCR 对应页面；人工核对课程边界。
3. 为每课整理逐句参考翻译、简单英文改述、核心词汇英英定义、搭配、原创语法讲解、概念题、句块、复述与三类场景迁移。
4. 运行 schema 校验和媒体匹配检查。
5. 确认私有输出未出现在 `git status`。

### Task 8：端到端验证

**Files:**
- Modify: `README.md`

**Steps:**
1. `npm run check-content`、私有课程单元检查、`npm run build`。
2. Mac 本地导入 6 课并走通课程选择和包生成。
3. PWA 走通课程包导入、逐句播放、中文淡出、反应计时、复述、迁移和进度保留。
4. 部署后在 iPhone Safari 实测音频 seek、语音识别、添加主屏幕和离线启动。
5. 文档说明其他音频/字幕材料如何通过通用适配器接入。
