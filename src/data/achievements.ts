// Direct port of AchievementDefinition.swift — 76 static achievement definitions.
import type { AchievementCategory, AchievementDefinition, AchievementTrigger } from '@/types/models'

export const superstarStickerIDs: string[] = [
  'ARG17', // Messi
  'POR15', // Ronaldo
  'FRA20', // Mbappé
  'NOR15', // Haaland
  'ENG11', // Bellingham
  'BRA14', // Vinícius Jr
  'CRO9', // Modrić
  'ESP15', // Yamal
  'EGY17', // Salah
  'KOR18', // Son
]

const superstarAchievements: AchievementDefinition[] = [
  {
    id: 'star_messi',
    titleEN: 'El Capitán',
    titleRU: 'Эль Капитан',
    descEN: 'Lionel Messi — Argentina #17',
    descRU: 'Лионель Месси — Аргентина №17',
    icon: 'star',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'ARG17' },
  },
  {
    id: 'star_ronaldo',
    titleEN: 'Siuuu!',
    titleRU: 'Siuuu!',
    descEN: 'Cristiano Ronaldo — Portugal #15',
    descRU: 'Криштиану Роналду — Португалия №15',
    icon: 'flame',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'POR15' },
  },
  {
    id: 'star_mbappe',
    titleEN: 'Donatello',
    titleRU: 'Донателло',
    descEN: 'Kylian Mbappé — France #20',
    descRU: 'Килиан Мбаппе — Франция №20',
    icon: 'zap',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'FRA20' },
  },
  {
    id: 'star_haaland',
    titleEN: 'Terminator',
    titleRU: 'Терминатор',
    descEN: 'Erling Haaland — Norway #15',
    descRU: 'Эрлинг Холанд — Норвегия №15',
    icon: 'footprints',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'NOR15' },
  },
  {
    id: 'star_bellingham',
    titleEN: 'Hey Jude',
    titleRU: 'Хей Джуд',
    descEN: 'Jude Bellingham — England #11',
    descRU: 'Джуд Беллингем — Англия №11',
    icon: 'music',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'ENG11' },
  },
  {
    id: 'star_vini',
    titleEN: 'Baila Viní!',
    titleRU: 'Байла Вини!',
    descEN: 'Vinícius Júnior — Brazil #14',
    descRU: 'Винисиус Жуниор — Бразилия №14',
    icon: 'party-popper',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'BRA14' },
  },
  {
    id: 'star_modric',
    titleEN: 'Maestro',
    titleRU: 'Маэстро',
    descEN: 'Luka Modrić — Croatia #9',
    descRU: 'Лука Модрич — Хорватия №9',
    icon: 'wand-sparkles',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'CRO9' },
  },
  {
    id: 'star_yamal',
    titleEN: 'Wonderkid',
    titleRU: 'Вундеркинд',
    descEN: 'Lamine Yamal — Spain #15',
    descRU: 'Ламин Ямаль — Испания №15',
    icon: 'sparkles',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'ESP15' },
  },
  {
    id: 'star_salah',
    titleEN: 'Egyptian King',
    titleRU: 'Египетский король',
    descEN: 'Mohamed Salah — Egypt #17',
    descRU: 'Мохаммед Салах — Египет №17',
    icon: 'crown',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'EGY17' },
  },
  {
    id: 'star_son',
    titleEN: 'Sonny',
    titleRU: 'Сонни',
    descEN: 'Son Heung-min — South Korea #18',
    descRU: 'Сон Хын Мин — Южная Корея №18',
    icon: 'heart',
    category: 'superstar',
    trigger: { kind: 'stickerPasted', id: 'KOR18' },
  },
]

const starHunter: AchievementDefinition = {
  id: 'star_hunter',
  titleEN: 'Star Hunter',
  titleRU: 'Охотник за звёздами',
  descEN: 'Collect all 10 world superstars',
  descRU: 'Собери всех 10 суперзвёзд мира',
  icon: 'star-half',
  category: 'starHunter',
  trigger: { kind: 'allStarsPasted' },
}

export const teamNicknames: Record<string, { en: string; ru: string }> = {
  ARG: { en: 'La Albiceleste', ru: 'Альбиселесте' },
  BRA: { en: 'Seleção', ru: 'Селесао' },
  FRA: { en: 'Les Bleus', ru: 'Синие' },
  ENG: { en: 'Three Lions', ru: 'Три льва' },
  ESP: { en: 'La Furia Roja', ru: 'Красная ярость' },
  GER: { en: 'Die Mannschaft', ru: 'Ди Маншафт' },
  POR: { en: 'Seleção das Quinas', ru: 'Команда щитов' },
  NED: { en: 'Oranje', ru: 'Оранжевые' },
  BEL: { en: 'Red Devils', ru: 'Красные дьяволы' },
  CRO: { en: 'Vatreni', ru: 'Огненные' },
  URU: { en: 'La Celeste', ru: 'Небесно-голубые' },
  MEX: { en: 'El Tri', ru: 'Эль Три' },
  USA: { en: 'USMNT', ru: 'Сборная США' },
  KOR: { en: 'Taeguk Warriors', ru: 'Воины Тэгук' },
  JPN: { en: 'Samurai Blue', ru: 'Синие самураи' },
  MAR: { en: 'Atlas Lions', ru: 'Львы Атласа' },
  SEN: { en: 'Lions of Teranga', ru: 'Львы Теранги' },
  AUS: { en: 'Socceroos', ru: 'Сокеруз' },
  SUI: { en: 'Nati', ru: 'Нати' },
  CAN: { en: 'Les Rouges', ru: 'Красные' },
  QAT: { en: 'Al-Annabi', ru: 'Аль-Аннаби' },
  KSA: { en: 'Green Falcons', ru: 'Зелёные соколы' },
  TUR: { en: 'Ay-Yıldızlılar', ru: 'Луна со звездой' },
  PAR: { en: 'La Albirroja', ru: 'Альбирроха' },
  COL: { en: 'Los Cafeteros', ru: 'Кофейщики' },
  ECU: { en: 'La Tri', ru: 'Ла Три' },
  PER: { en: 'La Blanquirroja', ru: 'Бланкирроха' },
  CIV: { en: 'Les Éléphants', ru: 'Слоны' },
  EGY: { en: 'Pharaohs', ru: 'Фараоны' },
  GHA: { en: 'Black Stars', ru: 'Чёрные звёзды' },
  IRN: { en: 'Team Melli', ru: 'Тим Мелли' },
  NZL: { en: 'All Whites', ru: 'Все белые' },
  SCO: { en: 'Tartan Army', ru: 'Клетчатая армия' },
  SWE: { en: 'Blågult', ru: 'Сине-жёлтые' },
  NOR: { en: 'Drillo', ru: 'Дрилло' },
  ALG: { en: 'Les Fennecs', ru: 'Фенеки' },
  TUN: { en: 'Eagles of Carthage', ru: 'Орлы Карфагена' },
  IRQ: { en: 'Lions of Mesopotamia', ru: 'Львы Месопотамии' },
  JOR: { en: 'Nashama', ru: 'Нашама' },
  UZB: { en: 'White Wolves', ru: 'Белые волки' },
  COD: { en: 'Léopards', ru: 'Леопарды' },
  CPV: { en: 'Tubarões Azuis', ru: 'Синие акулы' },
  BIH: { en: 'Zmajevi', ru: 'Драконы' },
  HAI: { en: 'Grenadiers', ru: 'Гренадёры' },
  CZE: { en: 'Národní tým', ru: 'Национальная сборная' },
  RSA: { en: 'Bafana Bafana', ru: 'Бафана Бафана' },
  CUW: { en: 'Wela di Kòrsou', ru: 'Сборная Кюрасао' },
  AUT: { en: 'Das Team', ru: 'Дас Тим' },
  PAN: { en: 'Los Canaleros', ru: 'Каналейрос' },
}

const allTeamCodes: string[] = [
  'FWC',
  'MEX', 'RSA', 'KOR', 'CZE',
  'CAN', 'SUI', 'QAT', 'BIH',
  'BRA', 'MAR', 'HAI', 'SCO',
  'USA', 'PAR', 'AUS', 'TUR',
  'GER', 'CUW', 'CIV', 'ECU',
  'NED', 'JPN', 'TUN', 'SWE',
  'BEL', 'EGY', 'IRN', 'NZL',
  'ESP', 'CPV', 'KSA', 'URU',
  'FRA', 'SEN', 'NOR', 'IRQ',
  'ARG', 'ALG', 'AUT', 'JOR',
  'POR', 'COL', 'UZB', 'COD',
  'ENG', 'CRO', 'GHA', 'PAN',
]

const teamAchievements: AchievementDefinition[] = allTeamCodes.map((code) => {
  const nick = teamNicknames[code]
  const nameEN = nick?.en ?? code
  const nameRU = nick?.ru ?? code
  return {
    id: `team_${code.toLowerCase()}`,
    titleEN: nameEN,
    titleRU: nameRU,
    descEN: `Complete the ${code} page — all 20 stickers`,
    descRU: `Собери все 20 наклеек ${code}`,
    icon: 'flag',
    category: 'team' as AchievementCategory,
    trigger: { kind: 'teamCompleted', code } as AchievementTrigger,
  }
})

const worldRuler: AchievementDefinition = {
  id: 'world_ruler',
  titleEN: 'World Ruler',
  titleRU: 'Абсолютный чемпион',
  descEN: 'Complete all 48 national teams',
  descRU: 'Собери все 48 сборных',
  icon: 'globe',
  category: 'worldRuler',
  trigger: { kind: 'allTeamsCompleted' },
}

const firstSticker: AchievementDefinition = {
  id: 'first_sticker',
  titleEN: 'First Sticker!',
  titleRU: 'Первая наклейка!',
  descEN: 'Paste your very first sticker',
  descRU: 'Вклей свою первую наклейку',
  icon: 'hand',
  category: 'milestone',
  trigger: { kind: 'totalPasted', count: 1 },
}

const centurion: AchievementDefinition = {
  id: 'centurion',
  titleEN: 'Centurion',
  titleRU: 'Первая сотня',
  descEN: 'Paste 100 stickers',
  descRU: 'Вклей 100 наклеек',
  icon: 'medal',
  category: 'centurion',
  trigger: { kind: 'totalPasted', count: 100 },
}

const milestones: AchievementDefinition[] = [
  {
    id: 'milestone_25',
    titleEN: 'Quarter Way',
    titleRU: 'Четверть пути',
    descEN: '25% of the album collected',
    descRU: '25% альбома собрано',
    icon: 'chart-pie',
    category: 'milestone',
    trigger: { kind: 'albumPercent', threshold: 0.25 },
  },
  {
    id: 'milestone_50',
    titleEN: 'Equator',
    titleRU: 'Экватор',
    descEN: '50% of the album collected',
    descRU: '50% альбома собрано',
    icon: 'gauge',
    category: 'milestone',
    trigger: { kind: 'albumPercent', threshold: 0.5 },
  },
  {
    id: 'milestone_75',
    titleEN: 'Final Stretch',
    titleRU: 'Финишная прямая',
    descEN: '75% of the album collected',
    descRU: '75% альбома собрано',
    icon: 'chart-bar',
    category: 'milestone',
    trigger: { kind: 'albumPercent', threshold: 0.75 },
  },
  {
    id: 'milestone_100',
    titleEN: 'Legend',
    titleRU: 'Легенда коллекционирования',
    descEN: 'Complete the entire album!',
    descRU: 'Полностью собери весь альбом!',
    icon: 'trophy',
    category: 'milestone',
    trigger: { kind: 'albumPercent', threshold: 1.0 },
  },
]

export const achievementCategoryOrder: AchievementCategory[] = [
  'superstar',
  'starHunter',
  'team',
  'worldRuler',
  'centurion',
  'milestone',
]

export const achievements: AchievementDefinition[] = [
  ...superstarAchievements,
  starHunter,
  ...teamAchievements,
  worldRuler,
  firstSticker,
  centurion,
  ...milestones,
]

export const achievementsById: Map<string, AchievementDefinition> = new Map(
  achievements.map((a) => [a.id, a]),
)
