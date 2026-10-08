import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import QuestionPage from './pages/QuestionPage.jsx'
import MyPage from './pages/MyPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/questions/:id" element={<QuestionPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Route>
    </Routes>
  )
}

export default App
