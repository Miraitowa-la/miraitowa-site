# miraitowa-site

个人技术网站。包含主页、公开项目展示、Markdown 知识库博客、关于占位页面和自定义 404。全部页面静态生成，通过 Cloudflare Workers Static Assets 发布。

## 本地开发

使用 Node.js 22.12+（推荐 Node.js 24 LTS）与 npm，Windows PowerShell / VSCode 均可。

```powershell
npm ci
npm run dev
```

打开 http://localhost:4321 。主页导航和卡片可跳转到 `/blog/`、`/projects/`、`/about/`；各页面可返回主页。

```powershell
npm run build
npm run preview
```

构建产物位于 `dist/`，预览地址以终端输出为准。

## 文件位置

- `src/config/site.ts`：网站名称、简介、GitHub 和导航。
- `src/layouts/BaseLayout.astro`：共享 HTML、导航和页脚。
- `src/components/ProfileSidebar.astro`：个人信息、项目分类和技术关键词侧栏。
- `src/components/ProjectCard.astro`：首页和项目页共用的项目卡片。
- `src/pages/index.astro`：主页。
- `src/pages/[section].astro`：静态生成关于占位页面。
- `content/notes/`：准备公开的 Obsidian Markdown 笔记与附件。
- `src/lib/notes.mjs`：解析笔记、转换双链/附件、生成目录和反向链接。
- `src/pages/blog/index.astro`：文章列表、全文搜索和分类筛选。
- `src/pages/blog/search.json.ts`：静态生成仅包含公开文章的全文搜索索引，输入搜索时加载。
- `src/lib/blog-search.mjs`：Fuse.js 模糊匹配，标题和标签优先于摘要、正文，多关键词取交集。
- `src/components/CategorySelect.astro`：圆角分类菜单，支持键盘选择；禁用 JavaScript 时保留原生下拉框。
- `src/pages/blog/[slug].astro`：文章阅读、目录和反向链接。
- `src/pages/blog-assets/[...asset].ts`：构建时输出公开文章引用的本地图片，不是运行时接口。
- `src/components/MermaidDiagrams.astro`：仅在有 Mermaid 的文章中加载图表渲染。
- `src/styles/blog.css`：文章排版、目录和搜索控件样式；卡片复用全站项目卡片样式。
- `tests/notes.test.mjs`：验证链接解析、图片、公式与公开范围。
- `src/pages/projects.astro`：按方向展示公开项目。
- `src/data/projects.ts`：集中维护项目名称、简介、分类、技术标签与链接。
- `src/pages/404.astro`：自定义 404。
- `src/styles/global.css`：全局样式和移动端适配。
- `wrangler.jsonc`：发布 `dist/` 的纯静态 Worker 配置，没有 `main` 入口。

## GitHub → Cloudflare Workers Builds

仓库：https://github.com/Miraitowa-la/miraitowa-site

1. 将代码提交并推送到 GitHub。
2. 在 Cloudflare 的 Workers & Pages 中创建 Worker，选择导入 Git 仓库，授权 GitHub 并选择上述仓库。
3. Worker 名称设为 `miraitowa-site`，生产分支选择实际使用的分支（通常为 `main`），根目录使用仓库根目录。
4. Build command：`npm run build`。
5. Deploy command：`npx wrangler deploy`。
6. 保存并部署，使用 Cloudflare 提供的实际 `workers.dev` 地址验证主页及导航跳转。
7. 后续推送到生产分支时检查 Workers Builds 构建日志和线上变化。

建议 Cloudflare 构建环境使用与本地一致的 Node.js 24 版本（`NODE_VERSION=24`）。依赖锁文件 `package-lock.json` 应提交。

也可以首次在本地手动发布：

```powershell
npx wrangler login
npm run deploy
```

`npm run deploy` 会先构建再发布；Workers Builds 已有独立构建步骤，因此其 Deploy command 使用 `npx wrangler deploy`。

当前应用不需要环境变量。不要提交任何 Token、密码或 `.env`；Cloudflare 账户授权和 GitHub Integration 在平台中配置。

## 后续

当前视觉采用灰蓝色圆角卡片与局部毛玻璃。桌面使用个人侧栏，移动端重排为单栏。导航中的太阳/月亮按钮只在浅色和深色间切换；首次访问跟随系统，未手动切换时也响应系统主题变化。手动选择保存于浏览器本地，旧版的 system 设置视为未手动选择。配色集中在 `src/styles/global.css`，不支持背景模糊的浏览器使用半透明面板回退。

项目内容根据 GitHub 公开仓库简介与 README 整理，核对日期为 2026-10-04。私有仓库不在展示范围内。列表为本地静态数据，不会自动同步；新增或修改项目请编辑 `src/data/projects.ts`，更新后构建并推送。历史项目单独分组，项目主页仅在已知链接时提供。

博客已实现 Markdown 阅读、知识关联与全文搜索。RSS、Sitemap、评论与 MDX 暂未实现。示例文章明确标注为功能演示，不代表个人项目成果。

## Obsidian 笔记发布

将准备公开的 Markdown 文件与附件复制到 `content/notes/`，可以保留文件夹结构。不需要复制 `.obsidian/`。上传指复制进本地项目并提交 Git，当前没有网页上传后台。

文件可直接放在 `notes/` 根目录，也可放在任意多级目录，如 `notes/嵌入式/ESP32/SPI通信.md`。“示例”只是演示文件夹，不是必需目录。目录用于整理文件，网站分类由 `category` 字段决定，文章地址由 `slug` 决定。

搜索范围包含标题、摘要、标签与正文（包括代码文字）。支持英文大小写不敏感和较长关键词的轻量拼写容错；一到两个字符采用精确包含匹配。多个词用空格分隔，每个词都需要匹配。结果按相关程度排序，并可叠加分类和标签筛选；不提供拼音转换或语义搜索。全文索引在构建时更新，只包含公开文章，浏览器首次输入时才下载；加载失败时提示并回退到标题、摘要和标签匹配。

每篇公开笔记顶部填写：

```yaml
---
title: 我的技术笔记
slug: my-technical-note
date: 2026-10-04
updated: 2026-10-05 # 可选：实际修改后手动更新，不早于发布日期
description: 一句话摘要
category: 嵌入式
tags: [ESP32, SPI]
aliases: [可选别名]
publish: true
---
```

`slug` 使用唯一的小写英文、数字与短横线，保持不变即可保留文章网址。缺少 `publish: true` 或设置 `draft: true` 的文章不会发布。不要把私密笔记放进公开 Git 仓库：页面排除不等于仓库私密。

支持以下内容：

- 普通 Markdown、表格、代码块、基础 Obsidian 提示块。
- `[[笔记]]`、`[[目录/笔记]]`、`[[笔记|显示文字]]`、`[[笔记#标题]]`，以及指向 `.md` 的标准 Markdown 链接。
- `![[图片.png]]`、`![[图片.png|600]]` 和 `![说明](相对路径.png)`。附件可集中放在 `content/notes/附件/`，只输出公开笔记引用到的图片；支持 PNG/JPEG/GIF/WebP/AVIF/SVG，不自动压缩。
- `$行内公式$` 与 `$$独立公式$$`，使用 KaTeX 在构建时生成排版。
- `mermaid` 代码块在浏览器中绘制图表；断网或渲染失败时保留原始代码。图表采用浅色画布，以保证深色主题下也清晰。

文章图片支持点击或键盘打开原图预览，按 Escape、关闭按钮或点击遮罩关闭。本地图片提供原图下载；外链图片打开原图后另存，避免跨域下载限制。普通代码块提供复制按钮，剪贴板不可用时提示手动复制。

文章页展示发布时间及可选 `updated` 更新时间；列表在更新时间不同于发布日期时显示更新日期。日期由文章元数据控制，不使用 Git 时间或构建时间。文章提供 Markdown 下载，保留原始正文及公开元数据，不包含图片附件；要在 Obsidian 中保留本地图片，需要另行保存并保持原有附件路径。仅为公开笔记生成下载文件，下载路由位于 `src/pages/blog-downloads/[slug].md.ts`，阅读交互位于 `src/components/ArticleTools.astro`。

双链先匹配根目录路径，再匹配当前笔记的相对路径；省略目录时仅在文件名或别名唯一时解析。重名请补充目录。未公开、缺失、歧义的目标或不存在的标题会在构建终端提示，正文保留文字，不生成死链接。代码块和行内代码中的双链不参与引用关系。

正文引用其他公开文章时自动生成反向链接，重复引用合并。知识图谱与附近的知识功能已移除。侧栏技术关键词从公开文章标签自动去重生成，点击标签可以筛选博客；页面提供清除标签入口，以及同时清空搜索、分类和标签的“重置筛选”入口。

首页“最新博客”显示按文章 `date` 从新到旧排列的前两篇公开笔记，与博客列表共用 `src/components/NoteCard.astro`，卡片样式与精选项目一致。

附件保留原有中文文件名，网站使用稳定的 ASCII 文件地址并设置图片类型。Astro 接受带或不带末尾斜杠的地址，避免开发模式把图片文件地址误判为不存在。

暂不支持整篇笔记嵌入、块引用、嵌套章节路径、Dataview、Excalidraw 源文件和 Canvas。手绘图可以先导出 SVG/PNG。文章内原始 HTML 不直接执行。

本地运行 `npm run dev` 后，在 `/blog/` 阅读；修改笔记后刷新查看，增删路由必要时重启开发服务。发布前执行：

```powershell
npm test
npm run build
npm run preview
```

目前含 3 篇明确标注的示例笔记，可以逐步替换为你的实际内容。提交本地 Git 不会更新线上网站；推送生产分支才触发 Cloudflare 发布。

## 许可证

尚未选择许可证；公开仓库不代表已授权他人复用，后续由作者确定并添加 LICENSE。
