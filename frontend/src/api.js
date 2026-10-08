import homeMock from './mocks/home.json'
import categoryMock from './mocks/category.json'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// 응답의 mock 플래그를 공통 레이아웃(샘플 데이터 띠)과 공유하기 위한 작은 스토어
let mockFlag = USE_MOCK
const listeners = new Set()

export function subscribeMock(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getMockSnapshot() {
  return mockFlag
}

function track(data) {
  const next = data?.mock === true
  if (next !== mockFlag) {
    mockFlag = next
    listeners.forEach((listener) => listener())
  }
  return data
}

// 화면에서 error.code로 상황을 구분할 수 있게 코드를 붙인 오류
function apiError(code, message) {
  return Object.assign(new Error(message), { code })
}

async function request(path) {
  const res = await fetch(path, { credentials: 'include' })
  if (res.status === 404) {
    throw apiError('NOT_FOUND', `찾을 수 없음: ${path}`)
  }
  if (!res.ok) {
    throw apiError('HTTP_ERROR', `API 오류 ${res.status}: ${path}`)
  }
  return res.json()
}

// 시각(ms)을 한국 시간 ISO 8601 문자열로 (예: 2026-10-08T07:00:00+09:00)
function toKstIso(time) {
  const kst = new Date(time + 9 * 60 * 60 * 1000)
  return `${kst.toISOString().slice(0, 19)}+09:00`
}

// 목업은 항상 "방금 만든" 데이터로 취급해 갱신 지연 안내가 뜨지 않게 한다.
// 출처 기사 시각(publishedAt)도 같은 만큼 옮겨서, 원래 generatedAt과의 간격
// (목업 파일 기준 1~20시간 전)이 현재 시각 기준으로 유지되게 한다.
function freshMock(mock) {
  const data = structuredClone(mock)
  const now = Date.now()
  const shift = now - Date.parse(data.generatedAt)
  data.generatedAt = toKstIso(now)
  for (const issue of data.issues ?? []) {
    for (const source of issue.sources ?? []) {
      source.publishedAt = toKstIso(Date.parse(source.publishedAt) + shift)
    }
  }
  return data
}

export async function getHome() {
  if (USE_MOCK) return track(freshMock(homeMock))
  return track(await request('/api/news/home'))
}

export async function getCategory(category) {
  if (USE_MOCK) {
    const mock = Object.hasOwn(categoryMock, category) ? categoryMock[category] : null
    if (!mock) throw apiError('NOT_FOUND', `없는 분야: ${category}`)
    return track(freshMock(mock))
  }
  return track(await request(`/api/news/categories/${encodeURIComponent(category)}`))
}
