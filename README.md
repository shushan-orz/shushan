# SHUSHAN Portfolio

个人作品展示静态网页，可部署到 GitHub Pages。

## 维护入口

- 个人信息：`assets/维护入口/个人信息/info.txt`
- 地编项目：`assets/维护入口/地编`
- 模型作品：`assets/维护入口/模型`
- 蓝图文本：`assets/维护入口/蓝图`

修改维护入口里的文件后，在项目根目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\刷新维护入口.ps1
```

脚本会重新生成 `portfolio-manifest.js`，网页会优先读取这个清单。

## GitHub Pages

上传整个项目根目录中的文件到 GitHub 仓库，然后在仓库 Settings > Pages 中选择从 `main` 分支根目录发布。
