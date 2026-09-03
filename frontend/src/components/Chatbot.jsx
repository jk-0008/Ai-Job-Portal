import { useState } from 'react'
import API from '../api'

export default function Chatbot() {
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!message.trim()) return

    setIsSending(true)
    try {
      const response = await API.post('applications/chatbot/', {
        message: message.trim(),
      })
      setReply(response.data.reply)
      setMessage('')
    } catch {
      setReply('The assistant is currently unavailable. Please try again later.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <aside aria-label="Job portal assistant" style={{ padding: '20px' }}>
      <h2>Job Portal Assistant</h2>
      {reply && <p>{reply}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="chat-message">Ask a question</label>
        <input
          id="chat-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="How do I update my profile?"
        />
        <button type="submit" disabled={isSending || !message.trim()}>
          {isSending ? 'Sending...' : 'Ask'}
        </button>
      </form>
    </aside>
  )
}