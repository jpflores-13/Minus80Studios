export function starText(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}
