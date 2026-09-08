# 🔤 Letter Quest · 字母闯关

给刚开始学英语的小朋友设计的 **Roblox 风格字母闯关游戏**。
纯 HTML/JS，无需安装，手机 / iPad / 电脑浏览器打开即玩。

**在线玩：** https://chaoyi-ai.github.io/LetterGame/

## 解决什么问题

孩子记不住：
1. **哪个字母是哪个** —— 大小写认读、易混字母（b/d/p/q、m/n/w）
2. **怎么写** —— 带笔顺演示的手指描红，自动判分
3. **怎么读** —— 一键切换 🇬🇧 英式 / 🇺🇸 美式发音（字母名 + 单词），标注 IPA，Z 会分别读 *zed* / *zee*

## 玩法（像 Roblox 的 Obby 闯关）

```
5 个岛屿 → 每岛 5~6 个字母关卡 → 岛屿 Boss 👾 → 打开宝箱 🎁 → 解锁下一岛
```

每个字母关卡 7 个 checkpoint：

| # | 任务 | 练什么 |
|---|------|--------|
| 1 | Meet the letter | 看大小写 + 图片单词，听 UK/US 发音 |
| 2 | Find the BIG letter | 认大写（含易混干扰项） |
| 3 | Find the small letter | 认小写 |
| 4 | Listen & pick | 听音辨字母 |
| 5 | Trace `A` | 笔顺演示 + 描红大写 |
| 6 | Trace `a` | 描红小写 |
| 7 | Which starts with A? | 自然拼读，首字母 → 图片 |

## 奖励机制

- 🪙 **金币**：每题 +10，描红 +15，通关 +30~60，Boss +130~190
- ⭐ **星星**：0 错 3 星、≤2 错 2 星，可反复挑战冲 3 星
- 💎 **宝石**（稀有货币）：3 星、Boss 宝箱、获得徽章时发放
- ✨ **XP / 等级**：Newbie → Explorer → Letter Ninja → Word Wizard → Alphabet Hero → Legend
- 🛍️ **商店**：帽子、宠物、衣服，装扮自己的方块小人（宝石买稀有款：王冠、独角兽、龙、彩虹衣）
- 🏆 **14 个徽章**：First Step、Perfect!、Boss Slayer、On Fire（连续打卡）……
- 📜 **每日任务**：每天随机一个（完成 3 关 / 描写 4 个字母 / 答对 15 题）
- 🔥 **连续打卡**：每天玩就累计天数
- ⚡ **Letter Rush**：30 秒限时抢答小游戏（打败第 1 个 Boss 解锁）
- 🥇 **排行榜**：哥哥妹妹各自档案，同一设备比拼 XP、星星、徽章
- ⚙️ **家长面板**：查看答题统计，可手动发 50 金币奖励

## 本地运行

```bash
python3 -m http.server 8791
```
然后打开 http://localhost:8791 。

> 语音使用浏览器内置的 Web Speech API，Chrome / Safari / Edge 均支持；
> 系统里若安装了 en-GB 和 en-US 两种语音，英式 / 美式切换效果最好（macOS：设置 → 辅助功能 → 朗读内容 → 系统声音 → 管理声音）。

## 项目结构

```
index.html        页面骨架
css/style.css     Roblox 风格 UI（方块小人、厚底按钮）
js/data.js        26 个字母数据、笔画坐标、商店、徽章、每日任务
js/app.js         游戏逻辑（关卡引擎、描红判分、语音、奖励、存档）
docs/DESIGN.md    游戏设计文档（奖励循环、难度曲线、扩展方向）
docs/ROBLOX.md    如何把这套玩法搬进 Roblox Studio
roblox/           Roblox Studio 的 Luau 起步脚本
```

进度保存在浏览器 localStorage，每台设备最多 4 个玩家档案。
