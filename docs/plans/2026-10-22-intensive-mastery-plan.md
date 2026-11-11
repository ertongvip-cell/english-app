# 半严格精练掌握模式 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有私有课程六层训练上加入逐句听写、递减提示背诵、原速复现、客观掌握门槛和延迟复测。

**Architecture:** 新建独立 `mastery` 数据仓库保存逐课掌握状态，训练算法保持纯函数；`IntensiveCourse` 以七关状态机驱动课程，复用时间轴播放器和语音识别；首页根据掌握状态推荐最薄弱微任务。

**Tech Stack:** Preact、TypeScript、IndexedDB/idb、Web Speech API、HTMLAudioElement

---

### Task 1：掌握状态和听写评分
- 新建 `src/lib/intensive.ts`：词级编辑对齐、错误分类、听写门槛、掌握状态更新、复测日期计算。
- 扩展 `src/lib/db.ts` 到 v3，新增 `lessonMastery` store；升级不破坏 v1/v2。
- 更新 `src/lib/backup.ts` 校验和备份新 store。
- 在 `scripts/test-private-course.ts` 添加纯逻辑断言。

### Task 2：逐句听写卡
- 新建 `src/pages/cards/DictationCard.tsx`。
- 单句 seek/A-B 播放；文本输入后逐词显示正确、遗漏、多余和替换。
- 分类数字/时间、否定词、冠词、介词、助动词、词尾和一般词汇。
- 每句 90% 通过；保存 best score 和 pass streak。

### Task 3：跟读速度阶梯和递减提示
- 新建 `src/pages/cards/RecallCard.tsx`。
- 0.75/0.9/1.0 三档逐句跟读状态。
- 完整文本、挖空、首字母、关键词四级提示。
- 语音识别准确率达到 85% 才提升提示级别。

### Task 4：原速复现
- 新建 `src/pages/cards/OriginalSpeedCard.tsx`。
- 播放原音、脱稿录音识别；记录从开始到停止的总时长。
- 内容准确率 ≥85%、时长 ≤原音 1.2 倍，连续两次通过。

### Task 5：七关编排和延迟复测
- 修改 `src/pages/PrivateCourse.tsx` 为七关精练入口。
- 新建 `src/pages/cards/ReviewCard.tsx`，在 1/3/7/14/30 天抽取听写、句块和迁移任务。
- 复测三项通过两项则推进；失败项次日再排。
- 保持半严格：允许切换课程，但稳定掌握只由门槛决定。

### Task 6：首页当前材料
- 修改 `src/pages/Home.tsx` 显示七关进度、到期复测数和下一微任务。
- 完成当前微任务后返回首页并刷新统计。

### Task 7：验证与部署
- 运行 `npm run check-content`、`npm run check-private`、`npm run build`。
- 行为审查 IndexedDB 升级、听写评分、语音生命周期、课程切换和复测日期。
- 提交并通过 SSH 推送 main，验证自动 gh-pages 工作流和线上 bundle。
