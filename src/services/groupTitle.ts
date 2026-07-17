/** Display title for a group/page letter — shared by Groups, Stats, and the Album header. */
export function groupTitle(letter: string): string {
  if (letter === '00') return 'Panini Logo'
  if (letter === 'FWC') return 'FIFA World Cup'
  return `Group ${letter}`
}
