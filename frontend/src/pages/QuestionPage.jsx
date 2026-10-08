import { useParams } from 'react-router-dom'

function QuestionPage() {
  const { id } = useParams()
  return <h1 className="page-title">질문 결과 #{id}</h1>
}

export default QuestionPage
