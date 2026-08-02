# 主站结构约定

- `/index.html` 只提供灯光主页与 VJ 主页的入口，不承载任何一方的个人简历内容。
- `/light/` 是灯光师徐依帆的独立主页；原有灯光站资源继续保存在 `/src/` 与 `/public/`，避免重复大型媒体文件。
- `/visual/` 是 VJ 徐志杰的独立主页；页面、样式、脚本和媒体都保存在 `/visual/` 内。
- 两个主页的姓名、经历、联系方式、作品和媒体不得交叉复用。
- 根目录的 `CNAME` 与 `.nojekyll` 必须保留，GitHub Pages 从 `main` 分支根目录发布。
- 发布前必须验证 `/light/`、`/visual/`、VJ 视频 HTTPS 与 Range 请求。
