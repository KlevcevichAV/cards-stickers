import { describe, it, expect } from 'vitest'
import { stickerIdFor, stickerIdForEntry } from '@/services/stickerId'

describe('stickerIdFor', () => {
  it('maps the standalone "00" team (the Panini Logo sticker) to id "00", not "000"', () => {
    expect(stickerIdFor('00', 0)).toBe('00')
    expect(stickerIdForEntry({ teamCode: '00', number: 0 })).toBe('00')
  })

  it('uses the normal teamCode+number concatenation for every other sticker, including FWC', () => {
    expect(stickerIdFor('FWC', 1)).toBe('FWC1')
    expect(stickerIdFor('ARG', 17)).toBe('ARG17')
    expect(stickerIdForEntry({ teamCode: 'BRA', number: 14 })).toBe('BRA14')
  })
})
