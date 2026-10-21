# 每日英语听说

面向英语重新起步者的碎片化听说 PWA。内置两周 14 课原创课程；支持词汇间隔复习、听力跟读、知识点口练、情景对话、打卡统计，以及个人课文/音频导入。

## 本地检查

```bash
npm install
npm run check-content
npm run build
```

如需在 Mac 上预览，请在终端运行：

```bash
npm run dev
```

然后打开终端显示的本地地址。麦克风能力最终需部署 HTTPS 后在 iPhone Safari 实测。

## 发布到 GitHub Pages

1. 在 GitHub 创建一个空仓库（例如 `english-app`），不要勾选自动创建 README。
2. 在本目录终端中执行（把地址换成你的仓库地址）：

```bash
git remote add origin https://github.com/你的用户名/english-app.git
git push -u origin main
```

3. 在仓库页面打开 **Settings → Pages**，将 **Source** 设为 **GitHub Actions**。
4. 打开 **Actions**，等待 `Deploy to GitHub Pages` 变绿；页面会显示访问地址。
5. 用 iPhone Safari 打开访问地址，点分享按钮 → **添加到主屏幕**。

## 导入自己的资料

准备同名文件并一次选择：

- `Lesson01.txt`：第一行是标题，后面是英文课文
- `Lesson01.mp3`（可选）：原版音频，也支持 m4a、wav、aac、ogg

资料仅写入当前设备的 IndexedDB，不会上传。清除 Safari 网站数据可能造成丢失，请在“设置”中定期导出备份。备份不含音频。

## 版权说明

仓库内课程均为原创内容，不包含《新概念英语》或其他教材的受版权保护课文与音频。请只导入你合法拥有、供个人学习使用的资料。

## 通用私有课程引擎

新概念只是首个资料适配器。标准课程包也可以承载普通音频、LRC/SRT/VTT 字幕、文章、播客和个人工作材料，并统一进入“听音识意 → 逐句解码 → 英英词汇 → 快速反应 → 英文复述 → 场景迁移”训练。

### Mac 扫描与生成课程包

```bash
npm run course-manager -- scan --source "/你的资料目录"
npm run course-manager -- build --source "/你的资料目录" --output "/你的私有输出目录" --lessons 015,031,047 --start nce1-015
npm run course-manager -- validate --source "/你的私有输出目录"
```

也可以直接打开 `course-manager/index.html`，选择本地资料文件夹、勾选课程并导出学习计划。网页只读取本地文件名，不上传资料。

### iPhone 导入

将输出目录通过 iCloud Drive 或 AirDrop 放到 iPhone。在 App 的“资料”页一次选择：

- `learning-plan.json`
- 所有 `*.lesson.json`
- 对应 MP3/M4A/WAV

App 会在写入前校验课程结构和媒体 SHA-256，并以一个事务导入整批课程。重复导入相同课程 ID 会更新内容但保留学习进度。

首批 6 课私有课程包位于仓库外的 `英语测评/私有课程包/第一阶段/`，不会被 Git 或 GitHub Pages 收集。
