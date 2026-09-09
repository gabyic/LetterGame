-- ReplicatedStorage/LetterData (ModuleScript)
-- 与 js/data.js 同源的字母题库，供服务器端脚本生成"字母门"题目
local LetterData = {}

LetterData.Letters = {
	{ L = "A", word = "apple",      emoji = "🍎" },
	{ L = "B", word = "ball",       emoji = "⚽" },
	{ L = "C", word = "cat",        emoji = "🐱" },
	{ L = "D", word = "dog",        emoji = "🐶" },
	{ L = "E", word = "elephant",   emoji = "🐘" },
	{ L = "F", word = "fish",       emoji = "🐟" },
	{ L = "G", word = "grapes",     emoji = "🍇" },
	{ L = "H", word = "hat",        emoji = "🎩" },
	{ L = "I", word = "ice cream",  emoji = "🍦" },
	{ L = "J", word = "juice",      emoji = "🧃" },
	{ L = "K", word = "kite",       emoji = "🪁" },
	{ L = "L", word = "lion",       emoji = "🦁" },
	{ L = "M", word = "monkey",     emoji = "🐵" },
	{ L = "N", word = "nose",       emoji = "👃" },
	{ L = "O", word = "orange",     emoji = "🍊" },
	{ L = "P", word = "pig",        emoji = "🐷" },
	{ L = "Q", word = "queen",      emoji = "👸" },
	{ L = "R", word = "rabbit",     emoji = "🐰" },
	{ L = "S", word = "sun",        emoji = "☀️" },
	{ L = "T", word = "tiger",      emoji = "🐯" },
	{ L = "U", word = "umbrella",   emoji = "☂️" },
	{ L = "V", word = "violin",     emoji = "🎻" },
	{ L = "W", word = "watermelon", emoji = "🍉" },
	{ L = "X", word = "fox",        emoji = "🦊" },
	{ L = "Y", word = "yo-yo",      emoji = "🪀" },
	{ L = "Z", word = "zebra",      emoji = "🦓" },
}

LetterData.Worlds = {
	{ name = "Apple Island", letters = { "A", "B", "C", "D", "E" } },
	{ name = "Fish Lagoon",  letters = { "F", "G", "H", "I", "J" } },
	{ name = "Lion Jungle",  letters = { "K", "L", "M", "N", "O" } },
	{ name = "Pig Volcano",  letters = { "P", "Q", "R", "S", "T" } },
	{ name = "Zebra Galaxy", letters = { "U", "V", "W", "X", "Y", "Z" } },
}

LetterData.Rewards = { correct = 10, wrong = -5, gate = 30, boss = 100 }

function LetterData.byLetter(L)
	for _, d in ipairs(LetterData.Letters) do
		if d.L == L then return d end
	end
end

return LetterData
