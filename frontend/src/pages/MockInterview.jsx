import { useState } from 'react'
import toast from 'react-hot-toast'
import { MessageSquare, ChevronRight, ChevronLeft, RefreshCw, Lightbulb, Check, RotateCcw, Code, Brain, User } from 'lucide-react'

const ROLES = ['Software Engineer', 'Data Analyst', 'ML Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer']

const QUESTIONS = {
  'Software Engineer': {
    behavioral: [
      "Tell me about yourself and your engineering background.",
      "Describe a time you solved a difficult technical problem.",
      "How do you handle tight deadlines and pressure?",
      "Tell me about a project you are most proud of.",
      "How do you approach learning new technologies?",
    ],
    technical: [
      "What is the difference between a stack and a queue?",
      "Explain Object Oriented Programming with an example.",
      "What is the difference between REST and GraphQL?",
      "Explain time complexity with an example.",
      "What is the difference between SQL and NoSQL databases?",
    ],
    coding: [
      "Write a function to reverse a string without using built-in methods.",
      "Write a function to check if a number is prime.",
      "Write a function to find duplicate elements in an array.",
      "Write a function to implement binary search.",
      "Write a function to check if a string is a palindrome.",
    ],
  },

  'Frontend Developer': {
    behavioral: [
      "Tell me about yourself and your frontend experience.",
      "Describe your most challenging UI project.",
      "How do you ensure your code is accessible?",
      "How do you stay updated with frontend trends?",
      "Tell me about a time you improved website performance.",
    ],
    technical: [
      "What is the difference between let, const and var in JavaScript?",
      "Explain the React component lifecycle.",
      "What is the virtual DOM and how does it work?",
      "What is CSS flexbox and when do you use it?",
      "Explain the difference between == and === in JavaScript.",
    ],
    coding: [
      "Write a React component that shows a counter with increment and decrement buttons.",
      "Write a function to debounce an API call in JavaScript.",
      "Write CSS to center a div both horizontally and vertically.",
      "Write a function to fetch data from an API and handle errors.",
      "Write a React hook that tracks window resize.",
    ],
  },

  'Backend Developer': {
    behavioral: [
      "Tell me about yourself and your backend experience.",
      "Describe a time you designed a scalable system.",
      "How do you handle database performance issues?",
      "Tell me about a time you fixed a critical production bug.",
      "How do you approach API security?",
    ],
    technical: [
      "What is the difference between authentication and authorization?",
      "Explain database indexing and why it matters.",
      "What is a REST API and what are its principles?",
      "What is the difference between synchronous and asynchronous programming?",
      "Explain what Docker is and why it is used.",
    ],
    coding: [
      "Write a Python function to connect to a database and fetch records.",
      "Write an API endpoint that accepts POST request and validates input.",
      "Write a function to hash a password securely.",
      "Write a function to paginate a list of results.",
      "Write a function to implement rate limiting logic.",
    ],
  },

  'Data Analyst': {
    behavioral: [
      "Tell me about yourself and your data analysis experience.",
      "Describe a time your analysis influenced a business decision.",
      "How do you handle missing or dirty data?",
      "Tell me about a complex dataset you worked with.",
      "How do you communicate technical findings to non-technical people?",
    ],
    technical: [
      "What is the difference between mean, median and mode?",
      "Explain the difference between inner join and outer join in SQL.",
      "What is data normalization and why is it important?",
      "What is the difference between correlation and causation?",
      "Explain what a pivot table is and when you use it.",
    ],
    coding: [
      "Write a SQL query to find the top 5 highest selling products.",
      "Write a Python function using pandas to remove duplicate rows.",
      "Write a SQL query to find employees with salary above average.",
      "Write a Python function to plot a bar chart using matplotlib.",
      "Write a SQL query to find customers who made more than 3 orders.",
    ],
  },

  'ML Engineer': {
    behavioral: [
      "Tell me about yourself and your ML experience.",
      "Describe an end-to-end ML project you built.",
      "How do you handle imbalanced datasets?",
      "Tell me about a time your model failed in production.",
      "How do you explain ML models to non-technical stakeholders?",
    ],
    technical: [
      "What is overfitting and how do you prevent it?",
      "Explain the difference between supervised and unsupervised learning.",
      "What is gradient descent and how does it work?",
      "What is the difference between precision and recall?",
      "Explain what cross-validation is and why it matters.",
    ],
    coding: [
      "Write Python code to split data into train and test sets.",
      "Write Python code to normalize a dataset using sklearn.",
      "Write Python code to train a logistic regression model.",
      "Write Python code to plot a confusion matrix.",
      "Write Python code to find feature importance in a random forest.",
    ],
  },

  'Full Stack Developer': {
    behavioral: [
      "Tell me about yourself and your full stack experience.",
      "Describe a full stack project you built from scratch.",
      "How do you decide which technology stack to use?",
      "Tell me about a time you had to debug both frontend and backend.",
      "How do you manage state in large applications?",
    ],
    technical: [
      "Explain how HTTP requests work from browser to server.",
      "What is CORS and why does it exist?",
      "What is the difference between server-side and client-side rendering?",
      "Explain JWT authentication flow.",
      "What is the difference between SQL and NoSQL? When to use which?",
    ],
    coding: [
      "Write a React component that fetches and displays a list of users from an API.",
      "Write a FastAPI endpoint that accepts a file upload.",
      "Write a function to implement JWT token generation in Python.",
      "Write a React form with validation for email and password.",
      "Write a SQL query to join users and orders tables and get recent orders.",
    ],
  },
}

const TYPE_COLORS = {
  behavioral: 'bg-green-500/10 text-green-300 border-green-500/20',
  technical:  'bg-blue-500/10 text-blue-300 border-blue-500/20',
  coding:     'bg-purple-500/10 text-purple-300 border-purple-500/20',
}

const TYPE_ICONS = {
  behavioral: User,
  technical:  Brain,
  coding:     Code,
}

export default function MockInterview() {
  const [role, setRole]           = useState('')
  const [customRole, setCustomRole] = useState('')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [answer, setAnswer]       = useState('')
  const [answers, setAnswers]     = useState({})
  const [showHint, setShowHint]   = useState(false)
  const [done, setDone]           = useState(false)
  const [activeTypes, setActiveTypes] = useState(['behavioral', 'technical', 'coding'])

  const start = () => {
    const selectedRole = role || customRole
    if (!selectedRole) { toast.error('Select or type a role first'); return }

    const roleData = QUESTIONS[selectedRole] || QUESTIONS['Software Engineer']
    const allQuestions = []

    if (activeTypes.includes('behavioral')) {
      roleData.behavioral.forEach(q => allQuestions.push({ q, type: 'behavioral' }))
    }
    if (activeTypes.includes('technical')) {
      roleData.technical.forEach(q => allQuestions.push({ q, type: 'technical' }))
    }
    if (activeTypes.includes('coding')) {
      roleData.coding.forEach(q => allQuestions.push({ q, type: 'coding' }))
    }

    setQuestions(allQuestions)
    setCurrent(0); setAnswers({}); setAnswer(''); setShowHint(false); setDone(false)
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
    setQuestions([]); setAnswers({}); setAnswer('')
    setCurrent(0); setDone(false); setRole(''); setCustomRole('')
  }

  const toggleType = type => {
    setActiveTypes(t => t.includes(type) ? t.filter(x => x !== type) : [...t, type])
  }

  const answeredCount = Object.keys(answers).length

  // Not started
  if (questions.length === 0) return (
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Mock Interview</h1>
        <p className="text-slate-400 mt-1 text-sm">Practice role-specific behavioral, technical and coding questions</p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Role selection */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">Select your role:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button key={r} onClick={() => { setRole(r); setCustomRole('') }}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                  role === r
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'border-[#2a2a45] text-slate-400 hover:text-white hover:border-indigo-500/30'
                }`}>{r}</button>
            ))}
          </div>
        </div>

        {/* Custom role */}
        <div>
          <p className="text-xs text-slate-500 mb-1.5">Or type a custom role:</p>
          <input className="input text-sm" placeholder="e.g. DevOps Engineer, Product Manager…"
            value={customRole}
            onChange={e => { setCustomRole(e.target.value); setRole('') }} />
        </div>

        {/* Question types */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">Question types:</p>
          <div className="flex gap-2 flex-wrap">
            {['behavioral', 'technical', 'coding'].map(type => {
              const Icon = TYPE_ICONS[type]
              return (
                <button key={type} onClick={() => toggleType(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                    activeTypes.includes(type)
                      ? TYPE_COLORS[type]
                      : 'border-[#2a2a45] text-slate-500'
                  }`}>
                  <Icon size={12} /> {type}
                  <span className="font-mono">5</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Total: {activeTypes.length * 5} questions selected
          </p>
        </div>

        <button onClick={start} disabled={!role && !customRole} className="btn-primary w-full justify-center py-2.5">
          <MessageSquare size={16} /> Start Interview
        </button>
      </div>
    </div>
  )

  // Done screen
  if (done) return (
    <div className="max-w-2xl space-y-5 animate-slide-up">
      <h1 className="text-2xl font-bold text-white">Session Complete 🎉</h1>
      <div className="card p-6 text-center space-y-3">
        <div className="text-5xl font-bold text-indigo-400">
          {answeredCount}<span className="text-2xl text-slate-400">/{questions.length}</span>
        </div>
        <p className="text-slate-300">questions answered</p>
        <div className="h-2 bg-[#2a2a45] rounded-full overflow-hidden max-w-xs mx-auto">
          <div className="h-full bg-indigo-500 rounded-full"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {questions.map(({ q, type }, i) => {
          const Icon = TYPE_ICONS[type]
          return (
            <div key={i} className="card p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className={`badge text-xs border ${TYPE_COLORS[type]} flex items-center gap-1`}>
                  <Icon size={9} /> {type}
                </span>
                <p className="text-sm font-medium text-white">{q}</p>
              </div>
              {answers[i] ? (
                <p className="text-sm text-slate-400 pl-2 leading-relaxed">{answers[i]}</p>
              ) : (
                <p className="text-xs text-slate-600 pl-2 italic">Not answered</p>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={reset} className="btn-primary text-sm">
        <RotateCcw size={15} /> Start New Session
      </button>
    </div>
  )

  // Active interview
  const { q, type } = questions[current]
  const Icon = TYPE_ICONS[type]

  return (
    <div className="max-w-2xl space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mock Interview</h1>
          <p className="text-slate-400 text-sm mt-1">{role || customRole} · {questions.length} questions</p>
        </div>
        <button onClick={reset} className="btn-ghost text-sm"><RefreshCw size={14} /> Reset</button>
      </div>

      {/* Progress */}
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

      {/* Question */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className={`badge text-xs border ${TYPE_COLORS[type]} flex items-center gap-1`}>
              <Icon size={10} /> {type}
            </span>
          </div>
          <p className="text-white font-medium leading-relaxed">{q}</p>
        </div>

        {type === 'coding' && (
          <div className="bg-[#1e1e35] rounded-xl p-3 text-xs text-slate-400 border border-[#2a2a45]">
            💡 Write your approach/pseudocode or actual code in the answer box below
          </div>
        )}

        <textarea
          rows={type === 'coding' ? 8 : 5}
          className="input resize-none text-sm font-mono"
          placeholder={type === 'coding'
            ? "Write your code or approach here…"
            : "Type your answer here…"}
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <button onClick={() => setShowHint(s => !s)}
            className="btn-ghost text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
            <Lightbulb size={13} /> {showHint ? 'Hide hint' : 'Show hint'}
          </button>
          {answers[current] && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={12} /> Saved
            </span>
          )}
        </div>

        {showHint && (
          <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <Lightbulb size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-300/90">
              {type === 'behavioral' && "Use the STAR method: Situation → Task → Action → Result"}
              {type === 'technical' && "Think out loud, explain your reasoning step by step"}
              {type === 'coding' && "Start with brute force, then optimize. Explain time complexity"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
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