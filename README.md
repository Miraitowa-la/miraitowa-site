# miraitowa-site

个人技术网站的最小 Demo。当前包含主页、公开项目展示、博客/关于占位页面和自定义 404，用于验证本地开发、静态构建和 Cloudflare 发布流程。

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
- `src/pages/[section].astro`：静态生成博客和关于占位页面。
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

流程验证后再增加 Content Collections、Markdown / MDX、文章阅读页、SEO、RSS、Sitemap、Pagefind 与 Giscus。本 Demo 暂未实现这些功能，也没有虚构项目或文章内容。

## 许可证

尚未选择许可证；公开仓库不代表已授权他人复用，后续由作者确定并添加 LICENSE。
