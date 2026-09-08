# 把 Letter Quest 搬进 Roblox Studio

孩子喜欢 Roblox，可以把同一套玩法做成一张真正的 3D Obby 地图。
这份文档给出可行的三条路线和一个起步脚本。

## 路线对比

| 路线 | 难度 | 效果 | 适合 |
|---|---|---|---|
| A. 网页版（本仓库） | ⭐ | 手机 / iPad 直接玩，有描红 | 现在就用 |
| B. Roblox Studio 自制 Obby | ⭐⭐⭐ | 3D 跑酷 + 字母门 + 真 Robux 风格奖励 | 和孩子一起做，本身就是亲子项目 |
| C. Roblox 现成教育地图 | ⭐ | 打开就玩，但内容不可控 | 补充 |

> 路线 B 不需要真的花 Robux，游戏内货币可以自己定义（leaderstats）。

## 路线 B：Roblox Obby 设计

### 地图结构

```
Spawn → 🏝️ Apple Island (A–E) → Boss 门 → 🌊 Fish Lagoon (F–J) → ...
```

每个字母 = 一段跑酷，跑酷终点是一个 **"字母门"（Letter Gate）**：

1. **认读门**：面前 4 个浮空方块写着不同字母，踩对的方块门才开
2. **听音门**：门口的 NPC 播放字母音（用 Sound 对象放录音），选正确的传送板
3. **拼读门**：4 个图片牌（apple / ball / cat / dog），走到首字母正确的牌前
4. **书写台**（简化）：在 SurfaceGui 上按顺序点亮笔画点（1→2→3），代替描红

踩错：掉下去回 checkpoint（obby 的天然"扣分"），并扣 5 金币。
踩对：+10 金币 + 音效 + 粒子特效。

### 奖励系统（leaderstats + DataStore）

- `Coins`、`Gems`、`Stars` 放进 `leaderstats`，Roblox 会自动显示在右上角排行榜 —— 兄妹俩天然比拼
- `DataStoreService` 存档，下次进游戏进度还在
- 商店：一个 `ProximityPrompt` 的 NPC，用 Coins 换帽子（`Accessory`）和宠物（跟随的 Part）
- Badge：用 Roblox 官方的 `BadgeService`，孩子会在自己的 Roblox 档案里看到真徽章（需要发布游戏）

### 开发步骤

1. 安装 Roblox Studio，新建 **Obby 模板**
2. 把 `roblox/LetterGateServer.lua` 放进 `ServerScriptService`
3. 把 `roblox/LetterData.lua` 放进 `ReplicatedStorage`（ModuleScript）
4. 在 Workspace 里建文件夹 `LetterGates`，每个门是一个 Model：
   - `Model.Name` = 字母，如 `A`
   - 里面放 4 个 Part 叫 `Choice`，每个的 `Attribute Letter` 设成显示的字母（SurfaceGui 里也显示）
   - 一个 Part 叫 `Door`（答对后消失 / 变透明）
5. 按 F5 测试；和孩子一起摆跑酷方块——这一步本身就是最好的奖励

### 与网页版的分工

- 网页版负责**描红书写**和**英美发音对比**（Roblox 上做不好 TTS 和手写）
- Roblox 版负责**3D 跑酷 + 社交比拼**
- 题库共用一份 `LetterData`（Lua 表与 `js/data.js` 结构一致）
