# 个人信息维护

编辑 `info.txt` 即可修改网页标题、右上角昵称、电话、邮箱、B站信息和各模块开关。

格式保持为 `字段=内容`，不要删除等号。

- `siteTitle`：左上角网页标题。
- `nickname`：右上角显示昵称。
- `phone`：右上角电话。
- `email`：右上角邮箱。
- `themePreset`：默认配色，`0` 黑金，`1` 粉白，`2` 蓝白，`3` 黑紫。
- `bilibiliVmid`：B站 UID，用于动态读取头像和主页置顶视频。
- `bilibiliHomepage`：B站主页按钮链接。
- `fallbackAvatar`：B站头像动态读取失败时使用的本地头像。
- `showLevel`：地编模块开关。
- `showModeling`：建模模块开关。
- `showBlueprint`：蓝图模块开关。
- `showVideo`：视频模块开关。
- `showBilibili`：B站模块开关。
- `showFanqie`：番茄小说模块开关。
- `showTextureTool`：无缝贴图模块开关。
- `showMiniGame`：小游戏模块开关。

模块开关填写 `1` 时显示，填写 `0` 时关闭。关闭模块后，顶部对应导航会隐藏，后续模块序号会自动重新排列。
