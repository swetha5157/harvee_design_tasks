import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { askAllocationAi, clearAiMessages } from '../store/slices/allocationSlice'
import ChatPanel from '../components/ChatPanel'

const suggestions = [
  'How many students were allocated to each course?',
  'Which students did not receive their first preference?',
  'Which course had the highest rejection rate?',
  'Show category-wise allocation summary'
]

export default function AiAssistantPage() {
  const dispatch = useAppDispatch()
  const { aiMessages, actionLoading } = useAppSelector(state => state.allocation)

  const handleSend = async (question) => {
    try {
      await dispatch(askAllocationAi(question)).unwrap()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>AI Allocation Assistant</h2>
          <p>Ask natural language questions about allocations, preferences, and rejection rates.</p>
        </div>
        <button className="btn" onClick={() => dispatch(clearAiMessages())}>Clear Chat</button>
      </div>

      <section className="panel">
        <ChatPanel
          messages={aiMessages}
          loading={actionLoading}
          onSend={handleSend}
          placeholder="Ask about allocations..."
          suggestions={suggestions}
        />
      </section>
    </div>
  )
}
