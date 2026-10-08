import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHome } from '../api.js'
import { useReveal } from '../hooks/useReveal.js'
import './HomePage.css'

const STALE_AFTER_MS = 60 * 60 * 1000 // 1시간
const SKELETON_COUNT = 6

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function formatGeneratedAt(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : `${timeFormatter.format(date)} 기준`
}

function CategoryCard({ category, categoryName, issues }) {
  const categoryPath = `/category/${encodeURIComponent(category)}`

  return (
    <article className="category-card" data-reveal>
      <h2 className="category-card-name">
        <span className="category-card-mark" aria-hidden="true" />
        {categoryName}
      </h2>

      {issues.length > 0 ? (
        <ul className="category-card-issues">
          {issues.map((issue) => (
            <li key={issue.issueId}>
              <Link
                to={`${categoryPath}?open=${encodeURIComponent(issue.issueId)}`}
                className="category-card-issue"
                title={issue.title}
              >
                {issue.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="category-card-empty">아직 요약이 없어요</p>
      )}

      <Link
        to={categoryPath}
        className="category-card-more"
        aria-label={`${categoryName} 더 보기`}
      >
        더 보기
      </Link>
    </article>
  )
}

function CategorySkeleton() {
  return (
    <div className="category-card category-card--skeleton" aria-hidden="true">
      <span className="skeleton-bar skeleton-bar--name" />
      <span className="skeleton-bar" />
      <span className="skeleton-bar skeleton-bar--short" />
      <span className="skeleton-bar" />
      <span className="skeleton-bar skeleton-bar--more" />
    </div>
  )
}

function HomePage() {
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const revealRef = useReveal()

  useEffect(() => {
    let cancelled = false
    getHome().then(
      (data) => {
        if (cancelled) return
        const generatedTime = new Date(data.generatedAt).getTime()
        const isStale = Date.now() - generatedTime > STALE_AFTER_MS
        setState({ status: 'success', data, isStale })
      },
      () => {
        if (!cancelled) setState({ status: 'error' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  if (state.status === 'error') {
    return (
      <div className="home-error swap-in" role="alert">
        <p className="home-error-message">뉴스를 불러오지 못했어요</p>
        <button type="button" className="home-error-retry" onClick={retry}>
          다시 시도
        </button>
      </div>
    )
  }

  const data = state.status === 'success' ? state.data : null
  const generatedLabel = data ? formatGeneratedAt(data.generatedAt) : null

  return (
    <div className="home" ref={revealRef}>
      <div className="home-heading">
        <h1 className="page-title">오늘의 브리핑</h1>
        {generatedLabel && (
          <p className="home-updated swap-in">
            <time dateTime={data.generatedAt}>{generatedLabel}</time>
          </p>
        )}
      </div>

      {state.isStale && (
        <p className="home-stale swap-in" role="status">
          뉴스 갱신이 지연되고 있어요
        </p>
      )}

      {data ? (
        <div className="category-grid">
          {data.categories.map((item) => (
            <CategoryCard key={item.category} {...item} />
          ))}
        </div>
      ) : (
        <div className="category-grid" aria-busy="true">
          <span className="visually-hidden" role="status">
            뉴스를 불러오는 중이에요
          </span>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  )
}

export default HomePage
