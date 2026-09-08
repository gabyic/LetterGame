-- ServerScriptService/LetterGateServer (Script)
-- 字母门：玩家踩到正确的 Choice 方块 → 门打开 + 加币；踩错 → 扣币并弹回
-- 依赖：ReplicatedStorage/LetterData、Workspace/LetterGates/<Letter>/{Choice..., Door}

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

local LetterData = require(ReplicatedStorage:WaitForChild("LetterData"))
local store = DataStoreService:GetDataStore("LetterQuest_v1")

-- ---------- leaderstats（右上角自动显示，兄妹比拼） ----------
local function setupPlayer(player)
	local ls = Instance.new("Folder")
	ls.Name = "leaderstats"
	ls.Parent = player
	for _, name in ipairs({ "Coins", "Gems", "Stars" }) do
		local v = Instance.new("IntValue")
		v.Name = name
		v.Parent = ls
	end
	local ok, data = pcall(function() return store:GetAsync(player.UserId) end)
	if ok and data then
		for _, name in ipairs({ "Coins", "Gems", "Stars" }) do
			ls[name].Value = data[name] or 0
		end
	end
end

local function savePlayer(player)
	local ls = player:FindFirstChild("leaderstats")
	if not ls then return end
	pcall(function()
		store:SetAsync(player.UserId, { Coins = ls.Coins.Value, Gems = ls.Gems.Value, Stars = ls.Stars.Value })
	end)
end

Players.PlayerAdded:Connect(setupPlayer)
Players.PlayerRemoving:Connect(savePlayer)

local function addCoins(player, n)
	local ls = player:FindFirstChild("leaderstats")
	if ls then ls.Coins.Value = math.max(0, ls.Coins.Value + n) end
end

-- ---------- 字母门 ----------
local function shuffle(t)
	for i = #t, 2, -1 do
		local j = math.random(i)
		t[i], t[j] = t[j], t[i]
	end
	return t
end

local function setupGate(gate)
	local target = gate.Name -- 例如 "A"
	local choices = {}
	for _, c in ipairs(gate:GetChildren()) do
		if c.Name == "Choice" then table.insert(choices, c) end
	end
	local door = gate:FindFirstChild("Door")

	-- 生成选项：正确字母 + 随机干扰字母
	local pool = {}
	for _, d in ipairs(LetterData.Letters) do
		if d.L ~= target then table.insert(pool, d.L) end
	end
	shuffle(pool)
	local labels = { target }
	for i = 1, #choices - 1 do table.insert(labels, pool[i]) end
	shuffle(labels)

	for i, part in ipairs(choices) do
		local letter = labels[i]
		part:SetAttribute("Letter", letter)
		-- 在方块上显示字母
		local gui = part:FindFirstChildOfClass("SurfaceGui") or Instance.new("SurfaceGui", part)
		local label = gui:FindFirstChildOfClass("TextLabel") or Instance.new("TextLabel", gui)
		label.Size = UDim2.fromScale(1, 1)
		label.TextScaled = true
		label.BackgroundTransparency = 1
		label.Text = letter .. string.lower(letter)

		local debounce = {}
		part.Touched:Connect(function(hit)
			local player = Players:GetPlayerFromCharacter(hit.Parent)
			if not player or debounce[player] then return end
			debounce[player] = true
			task.delay(1, function() debounce[player] = nil end)

			if letter == target then
				addCoins(player, LetterData.Rewards.correct + LetterData.Rewards.gate)
				if door then
					door.Transparency = 1
					door.CanCollide = false
					task.delay(8, function()
						door.Transparency = 0
						door.CanCollide = true
					end)
				end
			else
				addCoins(player, LetterData.Rewards.wrong)
				local root = hit.Parent:FindFirstChild("HumanoidRootPart")
				if root then
					root.AssemblyLinearVelocity = Vector3.new(0, 60, 0) -- 弹飞，obby 式惩罚
				end
			end
		end)
	end
end

local gates = workspace:WaitForChild("LetterGates")
for _, gate in ipairs(gates:GetChildren()) do
	if gate:IsA("Model") then setupGate(gate) end
end
gates.ChildAdded:Connect(function(gate)
	if gate:IsA("Model") then setupGate(gate) end
end)
