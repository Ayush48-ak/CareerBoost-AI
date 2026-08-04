import { useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { MessageSquare, ChevronRight, ChevronLeft, RefreshCw, Loader2, Lightbulb, Check, RotateCcw } from 'lucide-react'

const ROLES = ['Software Engineer', 'Data Analyst', 'ML Engineer', 'Product Manager', 'Frontend Developer', 'Backend Developer']

export default function MockInterview() {
  const [role, setRole]           = useState('')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [answer, setAnswer]       = useState('')
  const [answers, setAnswers]     = useState({})
  const [loading, setLoading]     = useState(false)
  const [showHint, setShowHint]   = useState(false)
  const [done, setDone]           = useState(false)

  const start = async () => {
    if (!role) { toast.error('Select a role first'); return }
    setLoading(true)
    try {
      const { data } = await api.get(`/api/interview/questions?role=${encodeURIComponent(role)}`)
      setQuestions(data.questions)
      setCurrent(0); setAnswers({}); setAnswer(''); setShowHint(false); setDone(false)
    } catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }

  const saveAnswer = () => {
    if (answer.trim()) setAnswers(a => ({ ...a, [current]: answer.trim() }))
  }

  const next = () => {
    saveAnswer()
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
      setAnswer(answers[current + 1] || '')
      setShowHint(false)
    } else {
      saveAnswer()
      setDone(true)
    }
  }

  const prev = () => {
    saveAnswer()
    setCurrent(c => c - 1)
    setAnswer(answers[current - 1] || '')
    setShowHint(false)
  }

  const reset = () => {
    setQuestions([]); setAnswers({}); setAnswer(''); setCurrent(0); setDone(false); setRole('')
  }

  const HINTS = {
    "Tell me about yourself": "Structure: Present → Past → Future. Keep it under 2 minutes.",
    "greatest professional strength": "Pick one real strength with a concrete example and result.",
    "challenging project": "Use the STAR method: Situation → Task → Action → Result.",
    "5 years": "Be ambitious but realistic. Align with the company's growth path.",
    "Big-O notation": "Explain time/space complexity. Example: O(n log n) for merge sort.",
    "debugging": "Mention: reproduce → isolate → hypothesize → verify → fix → document.",
    "overfitting": "Mention regularization, dropout, cross-validation, more data.",
    "missing data": "Imputation, removal, model-based handling, or flagging as a feature.",
  }

  const getHint = q => {
    const key = Object.keys(HINTS).find(k => q.toLowerCase().includes(k.toLowerCase()))
    return key ? HINTS[key] : "Structure your answer clearly. Be specific and use real examples."
  }

  const answeredCount = Object.keys(answers).length

  if (questions.length === 0) return (
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Mock Interview</h1>
        <p className="text-slate-400 mt-1 text-sm">Practice role-specific interview questions and track your answers</p>
      </div>
      <div className="card p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto">
          <MessageSquare size={28} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Choose your role</h2>
          <p className="text-slate-400 text-sm mt-1">We'll generate targeted interview questions for you</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                role === r
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                  : 'border-[#2a2a45] text-slate-400 hover:text-white hover:border-indigo-500/30'
              }`}>{r}</button>
          ))}
        </div>
        <div className="flex gap-2 justify-center">
          <input className="input text-sm max-w-xs" placeholder="Or type a custom role…"
            value={ROLES.includes(role) ? '' : role}
            onChange={e => setRole(e.target.value)} />
        </div>
        <button onClick={start} disabled={loading || !role} className="btn-primary justify-center px-8">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
          Start Interview
        </button>
      </div>
    </div>
  )

  if (done) return (
    <div className="max-w-2xl space-y-5 animate-slide-up">
      <h1 className="text-2xl font-bold text-white">Session Complete 🎉</h1>
      <div className="card p-6 text-center space-y-3">
        <div className="text-5xl font-bold text-indigo-400">{answeredCount}<span className="text-2xl text-slate-400">/{questions.length}</span></div>
        <p className="text-slate-300">questions answered</p>
        <div className="h-2 bg-[#2a2a45] rounded-full overflow-hidden max-w-xs mx-auto">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Q{i+1}</span>
              <p className="text-sm font-medium text-white">{q}</p>
            </div>
            {answers[i] ? (
              <p className="text-sm text-slate-400 pl-9 leading-relaxed">{answers[i]}</p>
            ) : (
              <p className="text-xs text-slate-600 pl-9 italic">Not answered</p>
            )}
          </div>
        ))}
      </div>
      <button onClick={reset} className="btn-primary text-sm">
        <RotateCcw size={15} /> Start New Session
      </button>
    </div>
  )

  const q = questions[current]

  return (
    <div className="max-w-2xl space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mock Interview</h1>
          <p className="text-slate-400 text-sm mt-1">{role} · {questions.length} questions</p>
        </div>
        <button onClick={reset} className="btn-ghost text-sm"><RefreshCw size={14} /> Reset</button>
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="h-1.5 bg-[#2a2a45] rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-400 text-xs font-mono font-bold">{current + 1}</span>
          </div>
          <p className="text-white font-medium leading-relaxed">{q}</p>
        </div>
        {showHint && (
          <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <Lightbulb size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-300/90">{getHint(q)}</p>
          </div>
        )}
        <textarea
          rows={5}
          className="input resize-none text-sm"
          placeholder="Type your answer here…"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <button onClick={() => setShowHint(s => !s)} className="btn-ghost text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
            <Lightbulb size={13} /> {showHint ? 'Hide hint' : 'Show hint'}
          </button>
          {answers[current] && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={12} /> Saved
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={prev} disabled={current === 0} className="btn-ghost text-sm disabled:opacity-40">
          <ChevronLeft size={16} /> Previous
        </button>
        <button onClick={next} className="btn-primary flex-1 justify-center text-sm">
          {current === questions.length - 1 ? (
            <><Check size={15} /> Finish Session</>
          ) : (
            <>Next <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  )
}
