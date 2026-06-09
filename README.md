# SHUSHAN Portfolio

个人作品展示静态网页，可部署到 GitHub Pages。

## 维护入口

- 个人信息：`assets/维护入口/个人信息/info.txt`
- 地编项目：`assets/维护入口/地编`
- 模型作品：`assets/维护入口/模型`，推荐每个作品一个文件夹，里面放 `.obj` 或 `.fbx`、预览图和可选 PBR 贴图。
- 蓝图文本：`assets/维护入口/蓝图`
- 视频作品：`assets/维护入口/视频`
- 鼠标拖尾：`assets/维护入口/拖尾`
- 无缝贴图工具：在网页最后一个模块中直接上传图片使用，不需要维护入口文件。
- 小游戏：固定尺寸 `16:9` 游戏窗口，内置九款经典小游戏。

修改维护入口里的文件后，在项目根目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\刷新维护入口.ps1
```

脚本会重新生成 `portfolio-manifest.js`，网页会优先读取这个清单。

本地测试 3D 模型时，不要直接双击 `index.html`。请运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\启动本地预览.ps1
```

然后用脚本打开的 `http://localhost:8088/` 预览页面。

模型文件夹内的贴图会自动识别：`baseColor/albedo/diffuse` 为基础色，`roughness` 为粗糙度，`metalness/metallic` 为金属度，`normal/nrm` 为法线。同一个模型可以放多套贴图，例如 `uv1_BaseColor.png`、`uv2_BaseColor.png`；网页会尝试按材质名和 UV 编号分配。不放贴图时，3D 预览会按白模显示。

拖尾维护入口里的 `config.txt` 可设置 `enabled`、`scale`、`opacity`；文件夹里有图片时使用图片拖尾，没有图片时使用默认线条拖尾。

无缝贴图工具会在浏览器内计算，不会上传图片。较大的图片会按“最大处理尺寸”自动缩小后再生成结果，便于网页保持流畅。

`assets/维护入口/个人信息/info.txt` 中的 `showLevel`、`showModeling`、`showBlueprint`、`showVideo`、`showBilibili`、`showFanqie`、`showTextureTool`、`showMiniGame` 可控制模块显示：`1` 显示，`0` 关闭。

## GitHub Pages

上传整个项目根目录中的文件到 GitHub 仓库，然后在仓库 Settings > Pages 中选择从 `main` 分支根目录发布。
