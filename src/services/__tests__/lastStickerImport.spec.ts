import { describe, it, expect } from 'vitest'
import { parseLastStickerPage } from '@/services/lastStickerImport'

// Trimmed excerpt of the real r.jina.ai markdown output for a LastSticker.ru "fond" page —
// includes a second (Euro 2024) collection section to verify it never leaks into the result.
const FIXTURE = `
laststicker.ru/cards/panini_world_cup_2026/) ### [PANINI Чемпионат мира 2026](https://www.laststicker.ru/cards/panini_world_cup_2026/) ![Image 9](https://www.laststicker.ru/i/manuf/panini_s.gif)Год выпуска: 2026 Наклеек в коллекции: 1219 Собрано.. 65% [**Ищет(3)**](javascript: show_block('collect_cards_to_12176_all')) [fwc1](https://www.laststicker.ru/cards/panini_world_cup_2026/fwc1/), [mex1](https://www.laststicker.ru/cards/panini_world_cup_2026/mex1/), [rsa2](https://www.laststicker.ru/cards/panini_world_cup_2026/rsa2/) **На обмен(2):**[00](https://www.laststicker.ru/cards/panini_world_cup_2026/00/), [fwc3](https://www.laststicker.ru/cards/panini_world_cup_2026/fwc3/) ## Чемпионаты Европы Обновлено: **28 ноября 2024 11:49**
### [TOPPS Чемпионат Европы 2024](https://www.laststicker.ru/cards/topps_euro_2024/) ![Image 11] Год выпуска: 2024 Наклеек в коллекции: 1428 **Ищет(0):** Ничего не нужно **На обмен(1):**[euro3](https://www.laststicker.ru/cards/topps_euro_2024/euro3/)
`

describe('parseLastStickerPage', () => {
  it('extracts the World Cup 2026 need/have code lists', () => {
    const result = parseLastStickerPage(FIXTURE)
    expect(result.need).toEqual(['fwc1', 'mex1', 'rsa2'])
    expect(result.have).toEqual(['00', 'fwc3'])
  })

  it('never leaks a different collection (e.g. Euro 2024) into the result', () => {
    const result = parseLastStickerPage(FIXTURE)
    expect(result.need).not.toContain('euro3')
    expect(result.have).not.toContain('euro3')
  })

  it('throws when the profile has no World Cup 2026 collection', () => {
    expect(() => parseLastStickerPage('nothing relevant here')).toThrow('NO_ALBUM')
  })
})
