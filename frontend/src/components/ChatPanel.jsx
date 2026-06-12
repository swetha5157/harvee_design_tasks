export default function ChatPanel({ messages, loading, onSend, placeholder, suggestions = [] }) {
  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {!messages.length && (
          <div className="empty-state">
            Ask a question or pick a suggestion below.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}>
            <span className="chat-role">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
            <pre>{msg.text}</pre>
          </div>
        ))}
        {loading && <div className="chat-bubble assistant">Thinking...</div>}
      </div>

      {!!suggestions.length && (
        <div className="suggestions">
          {suggestions.map(text => (
            <button key={text} type="button" className="chip" onClick={() => onSend(text)}>
              {text}
            </button>
          ))}
        </div>
      )}

      <ChatInput onSend={onSend} loading={loading} placeholder={placeholder} />
    </div>
  )
}

function ChatInput({ onSend, loading, placeholder }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const text = e.target.question.value.trim()
    if (!text || loading) return
    onSend(text)
    e.target.reset()
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input name="question" placeholder={placeholder} disabled={loading} />
      <button type="submit" disabled={loading}>Send</button>
    </form>
  )
}
