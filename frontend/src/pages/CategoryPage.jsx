import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getCategory } from '../api.js'
import { useReveal } from '../hooks/useReveal.js'
import { CATEGORIES, findCategory } from '../categories.js'
import './CategoryPage.css'

const STALE_AFTER_MS = 60 * 60 * 1000 // 1시간
const SKELETON_COUNT = 5
const MAX_ISSUES = 5

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// "N분 전" / "N시간 전" / "N일 전"
function formatRelativeTime(iso, now) {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return ''
  const diff = Math.max(0, now - time)
  if (diff < MINUTE) return '방금 전'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  return `${Math.floor(diff / DAY)}일 전`
}

function parseIssueId(value) {
  return value && /^\d+$/.test(value) ? Number(value) : null
}

function ChevronIcon() {
  return (
    <svg
      className="issue-chevron"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CategoryNav({ current }) {
  const listRef = useRef(null)
  const activeRef = useRef(null)

  // 좁은 화면에서 현재 분야 버튼이 보이도록 가로 스크롤만 맞춤 (세로 스크롤은 건드리지 않음)
  useLayoutEffect(() => {
    const list = listRef.current
    const active = activeRef.current
    if (!list || !active) return
    list.scrollLeft = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2
  }, [current])

  return (
    <nav className="category-nav" aria-label="분야 이동">
      <ul className="category-nav-list" ref={listRef}>
        {CATEGORIES.map(({ code, name }) => {
          const isCurrent = code === current
          return (
            <li key={code} ref={isCurrent ? activeRef : undefined}>
              <Link
                to={`/category/${code}`}
                className={`category-pill${isCurrent ? ' is-current' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function IssueItem({ issue, expanded, highlighted, onToggle, now }) {
  const buttonId = `issue-${issue.issueId}-button`
  const panelId = `issue-${issue.issueId}-panel`

  const className = [
    'issue-card',
    expanded && 'is-expanded',
    highlighted && 'is-highlighted',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li id={`issue-${issue.issueId}`} className={className} data-reveal>
      <h2 className="issue-heading">
        <button
          type="button"
          id={buttonId}
          className="issue-toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onToggle(issue.issueId)}
        >
          <span className="issue-title">{issue.title}</span>
          <ChevronIcon />
        </button>
      </h2>

      <div
        id={panelId}
        className="issue-panel"
        role="region"
        aria-labelledby={buttonId}
        inert={!expanded}
      >
        <div className="issue-panel-clip">
          <div className="issue-panel-content">
            <p className="issue-summary">{issue.summary}</p>

            {issue.sources?.length > 0 && (
              <>
                <h3 className="issue-sources-title">출처</h3>
                <ul className="issue-sources">
                  {issue.sources.map((source) => (
                    <li key={source.url} className="issue-source">
                      <span className="issue-source-press">{source.press}</span>
                      <span className="issue-source-sep" aria-hidden="true">
                        ·
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="issue-source-link"
                      >
                        {source.title}
                      </a>
                      <span className="issue-source-sep" aria-hidden="true">
                        ·
                      </span>
                      <time className="issue-source-time" dateTime={source.publishedAt}>
                        {formatRelativeTime(source.publishedAt, now)}
                      </time>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

function IssueSkeleton() {
  return (
    <li className="issue-card issue-card--skeleton" aria-hidden="true">
      <span className="skeleton-line" />
      <span className="skeleton-dot" />
    </li>
  )
}

function CategoryPage() {
  const { category } = useParams()
  const [searchParams] = useSearchParams()
  const openId = parseIssueId(searchParams.get('open'))
  const revealRef = useReveal()

  // --- 데이터 불러오기 ---
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${category}#${attempt}`
  const [result, setResult] = useState(null)
  // 분야가 바뀌거나 다시 시도하면 requestKey가 달라져 자동으로 로딩 상태가 된다
  const current = result?.key === requestKey ? result : { status: 'loading' }

  useEffect(() => {
    let cancelled = false
    getCategory(category).then(
      (data) => {
        if (cancelled) return
        const now = Date.now()
        const isStale = now - new Date(data.generatedAt).getTime() > STALE_AFTER_MS
        setResult({ key: requestKey, status: 'success', data, isStale, fetchedAt: now })
      },
      (error) => {
        if (cancelled) return
        const status = error?.code === 'NOT_FOUND' ? 'not-found' : 'error'
        setResult({ key: requestKey, status })
      },
    )
    return () => {
      cancelled = true
    }
  }, [category, requestKey])

  // --- 펼침 상태 (여러 개 동시에 펼칠 수 있음) ---
  // 분야나 ?open 값이 바뀌면 처음 상태(open 이슈만 펼침)로 돌아간다
  const expandKey = `${category}|${openId ?? ''}`
  const [expanded, setExpanded] = useState({ key: null, ids: new Set() })
  const expandedIds =
    expanded.key === expandKey
      ? expanded.ids
      : new Set(openId != null ? [openId] : [])

  const toggleIssue = (issueId) => {
    const next = new Set(expandedIds)
    if (next.has(issueId)) next.delete(issueId)
    else next.add(issueId)
    setExpanded({ key: expandKey, ids: next })
  }

  // --- ?open 이슈로 부드럽게 스크롤 ---
  useEffect(() => {
    if (current.status !== 'success' || openId == null) return
    const target = document.getElementById(`issue-${openId}`)
    if (!target) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [current.status, openId, category])

  if (current.status === 'not-found') {
    return (
      <div className="category-state category-state--center swap-in" role="alert">
        <p className="category-state-message">없는 분야예요</p>
        <Link to="/" className="category-state-action">
          홈으로 가기
        </Link>
      </div>
    )
  }

  const data = current.status === 'success' ? current.data : null
  const title = data?.categoryName ?? findCategory(category)?.name ?? ''
  const issues = data ? data.issues.slice(0, MAX_ISSUES) : []

  return (
    <div className="category-page" ref={revealRef}>
      <div className="category-heading">
        <h1 className="page-title">{title}</h1>
        {current.isStale && (
          <p className="category-stale swap-in" role="status">
            뉴스 갱신이 지연되고 있어요
          </p>
        )}
      </div>

      <CategoryNav current={category} />

      {current.status === 'loading' && (
        <>
          <span className="visually-hidden" role="status">
            뉴스를 불러오는 중이에요
          </span>
          <ul className="issue-list" aria-busy="true">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <IssueSkeleton key={i} />
            ))}
          </ul>
        </>
      )}

      {current.status === 'error' && (
        <div className="category-state category-state--center swap-in" role="alert">
          <p className="category-state-message">뉴스를 불러오지 못했어요</p>
          <button
            type="button"
            className="category-state-action"
            onClick={() => setAttempt((n) => n + 1)}
          >
            다시 시도
          </button>
        </div>
      )}

      {data && issues.length === 0 && (
        <p className="category-state category-state--empty swap-in">아직 요약이 없어요</p>
      )}

      {issues.length > 0 && (
        <ul className="issue-list">
          {issues.map((issue) => (
            <IssueItem
              key={issue.issueId}
              issue={issue}
              expanded={expandedIds.has(issue.issueId)}
              highlighted={issue.issueId === openId}
              onToggle={toggleIssue}
              now={current.fetchedAt}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default CategoryPage
