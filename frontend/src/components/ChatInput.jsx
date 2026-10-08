import { useEffect, useLayoutEffect, useRef, useState } from 'react'

function ArrowUpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="M5.5 11.5 12 5l6.5 6.5" />
    </svg>
  )
}

function ChatInput() {
  const [text, setText] = useState('')
  const wrapperRef = useRef(null)
  const fieldRef = useRef(null)

  // 내용에 맞춰 높이 조절 (최대 높이는 CSS max-height가 제한, 넘치면 내부 스크롤)
  useLayoutEffect(() => {
    const field = fieldRef.current
    if (!field) return
    field.style.height = 'auto'
    field.style.height = `${field.scrollHeight}px`
  }, [text])

  // 본문이 입력창에 가려지지 않도록 실제 높이를 CSS 변수로 알려 줌
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const root = document.documentElement
    const observer = new ResizeObserver(([entry]) => {
      root.style.setProperty('--chat-input-height', `${entry.borderBoxSize[0].blockSize}px`)
    })
    observer.observe(wrapper)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--chat-input-height')
    }
  }, [])

  const canSend = text.trim().length > 0

  const send = () => {
    const question = text.trim()
    if (!question) return
    // TODO: 질문 전송 API 연결
    alert(`전송: ${question}`)
    setText('')
  }

  const handleKeyDown = (e) => {
    // 한글 조합 중 Enter는 무시 (조합 확정용 Enter가 전송되는 것 방지)
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="chat-input" ref={wrapperRef}>
      <form
        className="chat-input-box"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <textarea
          ref={fieldRef}
          className="chat-input-field"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="뉴스에 대해 궁금한 점을 물어보세요"
          aria-label="질문 입력"
        />
        <button
          type="submit"
          className="chat-input-send"
          disabled={!canSend}
          aria-label="질문 전송"
        >
          <ArrowUpIcon />
        </button>
      </form>
    </div>
  )
}

export default ChatInput
