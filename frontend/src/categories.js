// 분야 코드와 표시 이름 (분야 이동 버튼 순서)
export const CATEGORIES = [
  { code: 'POLITICS', name: '정치' },
  { code: 'ECONOMY', name: '경제' },
  { code: 'SOCIETY', name: '사회' },
  { code: 'LIFE_CULTURE', name: '생활/문화' },
  { code: 'IT_SCIENCE', name: 'IT/과학' },
  { code: 'SPORTS', name: '스포츠' },
]

export function findCategory(code) {
  return CATEGORIES.find((item) => item.code === code) ?? null
}
