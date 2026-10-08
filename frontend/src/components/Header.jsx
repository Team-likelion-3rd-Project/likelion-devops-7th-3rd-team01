import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-title">
          AI 뉴스 브리핑
        </Link>
        <nav className="header-actions">
          <Link to="/mypage" className="header-button">
            마이페이지
          </Link>
          <button type="button" className="header-button header-button--primary">
            로그인
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
