# 轻碳生活小程序

一个用于记录个人碳排、查看统计趋势、参与低碳排行和管理个人低碳成就的微信小程序。

## 当前版本

当前 GitHub 最新提交包含：

- 登录修复版：微信登录不再使用旧的 `wx.getUserProfile` 强制获取头像昵称。
- 云函数版：`login` 和 `updateRank` 云函数已整理成可部署目录结构。
- 美化版：底部 tab 图标已替换为统一风格的 AI 生成图标。

## 已有功能

- 碳排记录：按交通、饮食、用电分类记录碳排放量。
- 数据统计：查看周、月、季度总排放、日均排放、趋势图和分类占比。
- 减排建议：根据主要碳排来源生成低碳建议。
- 低碳排行：通过云数据库 `rankList` 展示用户排行。
- 我的页面：微信登录、昵称头像、等级进度、低碳树、徽章、打卡日历、每日目标、本地数据导出。

## 微信登录说明

新版登录逻辑分成两步：

- 点击“微信登录”：通过云函数 `login` 静默获取当前用户 `openid`。
- 设置头像昵称：使用微信推荐能力：
  - 头像：`open-type="chooseAvatar"`
  - 昵称：`input type="nickname"`

这样可以避免旧接口 `wx.getUserProfile` 在开发者工具或真机中直接失败，并显示“已取消授权”的问题。

## 云开发配置

当前云环境 ID 配置在 `config.js`：

```js
module.exports = {
  cloudEnvId: 'cloud1-3gsmum3l9da9566a'
}
```

项目使用的云函数：

- `cloudfunctions/login`
- `cloudfunctions/updateRank`

云函数部署状态：

- `login` 已成功部署。
- `updateRank` 已成功部署。

云数据库集合：

- `userData`
- `rankList`

`updateRank` 云函数中包含集合初始化兜底逻辑，运行时会尝试确保以上集合存在。

## 开发与同步流程

本地项目目录固定为：

```text
C:\Users\33718\Desktop\碳排
```

GitHub 仓库：

```text
https://github.com/Wudiudiu7513/tanpai.git
```

推荐流程：

1. 微信开发者工具始终打开本地目录 `C:\Users\33718\Desktop\碳排`。
2. 不要重新下载 GitHub ZIP，也不要重新导入新目录。
3. 获取 GitHub 最新代码时，在项目目录执行：

```bash
git pull
```

4. 修改后提交并上传：

```bash
git add .
git commit -m 版本说明
git push
```

## 云函数部署命令

如果微信开发者工具已登录并开启服务端口，可以使用 CLI 部署：

```bash
"D:\学习\微信web开发者工具0\微信web开发者工具\cli.bat" cloud functions deploy ^
  --env cloud1-3gsmum3l9da9566a ^
  --paths "C:\Users\33718\Desktop\碳排\cloudfunctions\login" "C:\Users\33718\Desktop\碳排\cloudfunctions\updateRank" ^
  --remote-npm-install ^
  --appid wx4cfcf3ee52983c32
```

如果 CLI 提示函数处于 `Creating` 状态，等待 20-30 秒后重新执行即可。

## 注意事项

- 微信开发者工具需要使用真实小程序 AppID，不要使用测试号。
- 如果“微信登录”失败，优先检查 `login` 云函数是否已部署，以及云环境 ID 是否正确。
- 如果排行无法同步，检查 `updateRank` 云函数和 `rankList` 集合。
- 本地出现 `xxx (2).*` 文件通常是重复复制项目造成的，应删除并继续使用固定项目目录。
