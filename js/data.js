// ===== Letter data =====
// Each letter: word + emoji for phonics, IPA for letter name (UK / US), phonics hint
const LETTERS = [
  { L: 'A', word: 'apple',      emoji: '🍎', nameUK: '/eɪ/',  nameUS: '/eɪ/',  sound: '/æ/',  cn: '苹果' },
  { L: 'B', word: 'ball',       emoji: '⚽', nameUK: '/biː/', nameUS: '/biː/', sound: '/b/',  cn: '球' },
  { L: 'C', word: 'cat',        emoji: '🐱', nameUK: '/siː/', nameUS: '/siː/', sound: '/k/',  cn: '猫' },
  { L: 'D', word: 'dog',        emoji: '🐶', nameUK: '/diː/', nameUS: '/diː/', sound: '/d/',  cn: '狗' },
  { L: 'E', word: 'elephant',   emoji: '🐘', nameUK: '/iː/',  nameUS: '/iː/',  sound: '/e/',  cn: '大象' },
  { L: 'F', word: 'fish',       emoji: '🐟', nameUK: '/ef/',  nameUS: '/ef/',  sound: '/f/',  cn: '鱼' },
  { L: 'G', word: 'grapes',     emoji: '🍇', nameUK: '/dʒiː/',nameUS: '/dʒiː/',sound: '/g/',  cn: '葡萄' },
  { L: 'H', word: 'hat',        emoji: '🎩', nameUK: '/eɪtʃ/',nameUS: '/eɪtʃ/',sound: '/h/',  cn: '帽子' },
  { L: 'I', word: 'ice cream',  emoji: '🍦', nameUK: '/aɪ/',  nameUS: '/aɪ/',  sound: '/ɪ/',  cn: '冰淇淋' },
  { L: 'J', word: 'juice',      emoji: '🧃', nameUK: '/dʒeɪ/',nameUS: '/dʒeɪ/',sound: '/dʒ/', cn: '果汁' },
  { L: 'K', word: 'kite',       emoji: '🪁', nameUK: '/keɪ/', nameUS: '/keɪ/', sound: '/k/',  cn: '风筝' },
  { L: 'L', word: 'lion',       emoji: '🦁', nameUK: '/el/',  nameUS: '/el/',  sound: '/l/',  cn: '狮子' },
  { L: 'M', word: 'monkey',     emoji: '🐵', nameUK: '/em/',  nameUS: '/em/',  sound: '/m/',  cn: '猴子' },
  { L: 'N', word: 'nose',       emoji: '👃', nameUK: '/en/',  nameUS: '/en/',  sound: '/n/',  cn: '鼻子' },
  { L: 'O', word: 'orange',     emoji: '🍊', nameUK: '/əʊ/',  nameUS: '/oʊ/',  sound: '/ɒ/',  cn: '橙子' },
  { L: 'P', word: 'pig',        emoji: '🐷', nameUK: '/piː/', nameUS: '/piː/', sound: '/p/',  cn: '猪' },
  { L: 'Q', word: 'queen',      emoji: '👸', nameUK: '/kjuː/',nameUS: '/kjuː/',sound: '/kw/', cn: '女王' },
  { L: 'R', word: 'rabbit',     emoji: '🐰', nameUK: '/ɑː/',  nameUS: '/ɑr/',  sound: '/r/',  cn: '兔子' },
  { L: 'S', word: 'sun',        emoji: '☀️', nameUK: '/es/',  nameUS: '/es/',  sound: '/s/',  cn: '太阳' },
  { L: 'T', word: 'tiger',      emoji: '🐯', nameUK: '/tiː/', nameUS: '/tiː/', sound: '/t/',  cn: '老虎' },
  { L: 'U', word: 'umbrella',   emoji: '☂️', nameUK: '/juː/', nameUS: '/juː/', sound: '/ʌ/',  cn: '雨伞' },
  { L: 'V', word: 'violin',     emoji: '🎻', nameUK: '/viː/', nameUS: '/viː/', sound: '/v/',  cn: '小提琴' },
  { L: 'W', word: 'watermelon', emoji: '🍉', nameUK: '/ˈdʌbljuː/', nameUS: '/ˈdʌbəljuː/', sound: '/w/', cn: '西瓜' },
  { L: 'X', word: 'fox',        emoji: '🦊', nameUK: '/eks/', nameUS: '/eks/', sound: '/ks/', cn: '狐狸', ends: true },
  { L: 'Y', word: 'yo-yo',      emoji: '🪀', nameUK: '/waɪ/', nameUS: '/waɪ/', sound: '/j/',  cn: '悠悠球' },
  { L: 'Z', word: 'zebra',      emoji: '🦓', nameUK: '/zed/', nameUS: '/ziː/', sound: '/z/',  cn: '斑马', nameWordUK: 'zed', nameWordUS: 'zee' },
];
const LETTER_MAP = Object.fromEntries(LETTERS.map(l => [l.L, l]));

// ===== Worlds (Roblox-style islands) =====
const WORLDS = [
  { id: 0, name: 'Apple Island',   cn: '苹果岛',   emoji: '🏝️', letters: ['A','B','C','D','E'],     color: '#4ade80', bg: 'linear-gradient(180deg,#bbf7d0,#4ade80)' },
  { id: 1, name: 'Fish Lagoon',    cn: '小鱼湾',   emoji: '🌊', letters: ['F','G','H','I','J'],     color: '#38bdf8', bg: 'linear-gradient(180deg,#bae6fd,#38bdf8)' },
  { id: 2, name: 'Lion Jungle',    cn: '狮子丛林', emoji: '🌴', letters: ['K','L','M','N','O'],     color: '#fbbf24', bg: 'linear-gradient(180deg,#fde68a,#fbbf24)' },
  { id: 3, name: 'Pig Volcano',    cn: '小猪火山', emoji: '🌋', letters: ['P','Q','R','S','T'],     color: '#f87171', bg: 'linear-gradient(180deg,#fecaca,#f87171)' },
  { id: 4, name: 'Zebra Galaxy',   cn: '斑马星系', emoji: '🚀', letters: ['U','V','W','X','Y','Z'], color: '#a78bfa', bg: 'linear-gradient(180deg,#ddd6fe,#a78bfa)' },
];

// ===== Stroke data for handwriting (0..100 box; cap top=10, x-height=45, baseline=80, descender=100) =====
function circlePts(cx, cy, r, startDeg = -90, sweep = 360, n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (startDeg + sweep * i / n) * Math.PI / 180;
    pts.push([+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1)]);
  }
  return pts;
}
const STROKES = {
  A: [[[20,80],[50,10],[80,80]], [[32,55],[68,55]]],
  B: [[[25,10],[25,80]], [[25,10],[60,10],[70,20],[70,35],[60,45],[25,45]], [[25,45],[65,45],[75,55],[75,70],[65,80],[25,80]]],
  C: [circlePts(50,45,35,-45,-270)],
  D: [[[25,10],[25,80]], [[25,10],[55,10],[72,25],[75,45],[72,65],[55,80],[25,80]]],
  E: [[[70,10],[25,10],[25,80],[70,80]], [[25,45],[60,45]]],
  F: [[[70,10],[25,10],[25,80]], [[25,45],[60,45]]],
  G: [circlePts(50,45,35,-45,-270).concat([[75,48],[52,48]])],
  H: [[[25,10],[25,80]], [[75,10],[75,80]], [[25,45],[75,45]]],
  I: [[[35,10],[65,10]], [[50,10],[50,80]], [[35,80],[65,80]]],
  J: [[[35,10],[70,10]], [[55,10],[55,65],[48,80],[35,78],[28,68]]],
  K: [[[25,10],[25,80]], [[70,10],[25,50]], [[38,40],[72,80]]],
  L: [[[25,10],[25,80],[72,80]]],
  M: [[[22,80],[22,10],[50,55],[78,10],[78,80]]],
  N: [[[25,80],[25,10],[75,80],[75,10]]],
  O: [circlePts(50,45,35,-90,-360)],
  P: [[[25,80],[25,10]], [[25,10],[62,10],[74,22],[74,36],[62,48],[25,48]]],
  Q: [circlePts(50,45,35,-90,-360), [[60,62],[80,82]]],
  R: [[[25,80],[25,10]], [[25,10],[62,10],[74,22],[74,36],[62,48],[25,48]], [[48,48],[75,80]]],
  S: [[[74,22],[60,10],[42,10],[28,20],[28,32],[40,42],[60,48],[72,58],[72,70],[58,80],[40,80],[26,68]]],
  T: [[[22,10],[78,10]], [[50,10],[50,80]]],
  U: [[[25,10],[25,60],[32,76],[50,82],[68,76],[75,60],[75,10]]],
  V: [[[22,10],[50,80],[78,10]]],
  W: [[[15,10],[32,80],[50,30],[68,80],[85,10]]],
  X: [[[25,10],[75,80]], [[75,10],[25,80]]],
  Y: [[[22,10],[50,45],[78,10]], [[50,45],[50,80]]],
  Z: [[[25,10],[75,10],[25,80],[75,80]]],

  a: [circlePts(50,62,18,-30,-330), [[68,45],[68,80]]],
  b: [[[30,10],[30,80]], [[30,72],[42,80],[56,80],[68,70],[68,55],[56,45],[42,45],[30,54]]],
  c: [circlePts(50,62,18,-45,-270)],
  d: [circlePts(50,62,18,-30,-330), [[68,10],[68,80]]],
  e: [[[32,62],[68,62],[66,50],[54,45],[40,47],[32,58],[32,70],[42,80],[56,80],[68,73]]],
  f: [[[66,16],[54,10],[44,18],[44,80]], [[30,45],[60,45]]],
  g: [circlePts(50,62,18,-30,-330), [[68,45],[68,88],[58,100],[44,100],[34,92]]],
  h: [[[30,10],[30,80]], [[30,55],[42,45],[58,45],[70,55],[70,80]]],
  i: [[[50,45],[50,80]], [[50,28],[50,31]]],
  j: [[[56,45],[56,88],[46,100],[36,96]], [[56,28],[56,31]]],
  k: [[[30,10],[30,80]], [[66,45],[30,68]], [[42,60],[68,80]]],
  l: [[[50,10],[50,80]]],
  m: [[[22,80],[22,45]], [[22,55],[32,45],[42,45],[50,55],[50,80]], [[50,55],[60,45],[70,45],[78,55],[78,80]]],
  n: [[[30,80],[30,45]], [[30,55],[42,45],[58,45],[70,55],[70,80]]],
  o: [circlePts(50,62,18,-90,-360)],
  p: [[[30,45],[30,100]], [[30,54],[42,45],[56,45],[68,55],[68,70],[56,80],[42,80],[30,72]]],
  q: [circlePts(50,62,18,-30,-330), [[68,45],[68,100]]],
  r: [[[36,80],[36,45]], [[36,58],[46,46],[58,45],[68,50]]],
  s: [[[68,50],[58,45],[42,45],[34,52],[38,60],[60,66],[66,74],[58,81],[42,81],[32,74]]],
  t: [[[45,20],[45,72],[52,80],[66,78]], [[30,45],[65,45]]],
  u: [[[30,45],[30,70],[38,80],[55,80],[68,70]], [[68,45],[68,80]]],
  v: [[[28,45],[50,80],[72,45]]],
  w: [[[18,45],[32,80],[50,52],[68,80],[82,45]]],
  x: [[[30,45],[70,80]], [[70,45],[30,80]]],
  y: [[[30,45],[50,80]], [[72,45],[42,100]]],
  z: [[[30,45],[70,45],[30,80],[70,80]]],
};

// ===== Shop (spend coins / gems like Robux) =====
const SHOP = [
  { id: 'hat_cap',     type: 'hat', name: 'Cap',        cn: '棒球帽', emoji: '🧢', cost: 60 },
  { id: 'hat_party',   type: 'hat', name: 'Party Hat',  cn: '派对帽', emoji: '🎉', cost: 80 },
  { id: 'hat_bow',     type: 'hat', name: 'Bow',        cn: '蝴蝶结', emoji: '🎀', cost: 80 },
  { id: 'hat_top',     type: 'hat', name: 'Top Hat',    cn: '礼帽',   emoji: '🎩', cost: 120 },
  { id: 'hat_grad',    type: 'hat', name: 'Grad Cap',   cn: '学士帽', emoji: '🎓', cost: 150 },
  { id: 'hat_crown',   type: 'hat', name: 'Crown',      cn: '王冠',   emoji: '👑', gems: 5 },
  { id: 'hat_wizard',  type: 'hat', name: 'Wizard Hat', cn: '巫师帽', emoji: '🧙', gems: 8 },
  { id: 'pet_dog',     type: 'pet', name: 'Puppy',      cn: '小狗',   emoji: '🐶', cost: 100 },
  { id: 'pet_cat',     type: 'pet', name: 'Kitty',      cn: '小猫',   emoji: '🐱', cost: 100 },
  { id: 'pet_bunny',   type: 'pet', name: 'Bunny',      cn: '兔子',   emoji: '🐰', cost: 120 },
  { id: 'pet_panda',   type: 'pet', name: 'Panda',      cn: '熊猫',   emoji: '🐼', cost: 180 },
  { id: 'pet_unicorn', type: 'pet', name: 'Unicorn',    cn: '独角兽', emoji: '🦄', gems: 6 },
  { id: 'pet_dragon',  type: 'pet', name: 'Dragon',     cn: '龙',     emoji: '🐉', gems: 10 },
  { id: 'pet_dino',    type: 'pet', name: 'Dino',       cn: '恐龙',   emoji: '🦖', gems: 10 },
  { id: 'skin_pink',   type: 'shirt', name: 'Pink Shirt',   cn: '粉色衣服', color: '#f472b6', cost: 40 },
  { id: 'skin_blue',   type: 'shirt', name: 'Blue Shirt',   cn: '蓝色衣服', color: '#60a5fa', cost: 40 },
  { id: 'skin_green',  type: 'shirt', name: 'Green Shirt',  cn: '绿色衣服', color: '#4ade80', cost: 40 },
  { id: 'skin_purple', type: 'shirt', name: 'Purple Shirt', cn: '紫色衣服', color: '#a78bfa', cost: 40 },
  { id: 'skin_gold',   type: 'shirt', name: 'Gold Shirt',   cn: '金色衣服', color: '#facc15', gems: 4 },
  { id: 'skin_rainbow',type: 'shirt', name: 'Rainbow Shirt',cn: '彩虹衣服', color: 'linear-gradient(90deg,#f87171,#fbbf24,#4ade80,#60a5fa,#a78bfa)', gems: 12 },
];

// ===== Badges =====
const BADGES = [
  { id: 'first',     name: 'First Step',     cn: '第一步',     emoji: '👣', desc: '完成第一个字母',        test: p => Object.keys(p.stars).length >= 1 },
  { id: 'five',      name: 'High Five',      cn: '击掌五连',   emoji: '🖐️', desc: '完成 5 个字母',         test: p => Object.keys(p.stars).length >= 5 },
  { id: 'half',      name: 'Halfway Hero',   cn: '半程英雄',   emoji: '🦸', desc: '完成 13 个字母',        test: p => Object.keys(p.stars).length >= 13 },
  { id: 'alphabet',  name: 'Alphabet Master',cn: '字母大师',   emoji: '🏆', desc: '完成全部 26 个字母',    test: p => Object.keys(p.stars).length >= 26 },
  { id: 'perfect',   name: 'Perfect!',       cn: '完美通关',   emoji: '💯', desc: '一个字母拿到 3 星',     test: p => Object.values(p.stars).some(s => s === 3) },
  { id: 'stars10',   name: 'Star Collector', cn: '星星收藏家', emoji: '⭐', desc: '收集 30 颗星',          test: p => Object.values(p.stars).reduce((a, b) => a + b, 0) >= 30 },
  { id: 'island1',   name: 'Island Explorer',cn: '岛屿探险家', emoji: '🗺️', desc: '打败第一个 Boss',       test: p => p.bosses.length >= 1 },
  { id: 'bosses',    name: 'Boss Slayer',    cn: 'Boss 终结者',emoji: '⚔️', desc: '打败全部 5 个 Boss',    test: p => p.bosses.length >= 5 },
  { id: 'streak3',   name: 'On Fire',        cn: '连续打卡',   emoji: '🔥', desc: '连续 3 天学习',         test: p => p.streak.count >= 3 },
  { id: 'streak7',   name: 'Week Warrior',   cn: '一周勇士',   emoji: '📅', desc: '连续 7 天学习',         test: p => p.streak.count >= 7 },
  { id: 'writer',    name: 'Little Writer',  cn: '小小书法家', emoji: '✍️', desc: '成功描写 20 次',        test: p => p.stats.traced >= 20 },
  { id: 'rich',      name: 'Coin Bank',      cn: '小富翁',     emoji: '💰', desc: '累计赚到 500 金币',     test: p => p.stats.coinsEarned >= 500 },
  { id: 'shopper',   name: 'Fashion Star',   cn: '时尚达人',   emoji: '🛍️', desc: '买 3 件物品',           test: p => p.items.length >= 3 },
  { id: 'rush',      name: 'Speedster',      cn: '闪电侠',     emoji: '⚡', desc: 'Letter Rush 得 15 分',   test: p => p.stats.rushBest >= 15 },
];

// ===== Levels (XP titles) =====
const LEVELS = [
  { xp: 0,    title: 'Newbie',        cn: '新手' },
  { xp: 100,  title: 'Explorer',      cn: '探险者' },
  { xp: 250,  title: 'Letter Ninja',  cn: '字母忍者' },
  { xp: 500,  title: 'Word Wizard',   cn: '单词巫师' },
  { xp: 900,  title: 'Alphabet Hero', cn: '字母英雄' },
  { xp: 1500, title: 'Legend',        cn: '传奇' },
];

const DAILY_QUESTS = [
  { id: 'stages3', text: 'Finish 3 stages',   cn: '完成 3 个关卡', target: 3, key: 'stages', reward: 50 },
  { id: 'trace4',  text: 'Trace 4 letters',   cn: '描写 4 个字母', target: 4, key: 'traced', reward: 50 },
  { id: 'correct15', text: 'Get 15 answers right', cn: '答对 15 题', target: 15, key: 'correct', reward: 60 },
];
