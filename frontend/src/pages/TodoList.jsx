import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, CheckSquare, Trash2, X, Loader2, Calendar, Flag } from 'lucide-react'

const CATEGORIES = ['General', 'DSA', 'System Design', 'Behavioral', 'Resume', 'Research']
const PRIORITIES  = ['Low', 'Medium', 'High']

const PRI_COLOR = {
  High:   'text-red-400 bg-red-500/10',
  Medium: 'text-amber-400 bg-amber-500/10',
  Low:    'text-slate-400 bg-slate-500/10',
}
const CAT_COLOR = {
  DSA:            'bg-purple-500/10 text-purple-300',
  'System Design':'bg-blue-500/10 text-blue-300',
  Behavioral:     'bg-green-500/10 text-green-300',
  Resume:         'bg-pink-500/10 text-pink-300',
  Research:       'bg-cyan-500/10 text-cyan-300',
  General:        'bg-slate-500/10 text-slate-400',
}

export default function TodoList() {
  const [todos, setTodos]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]     = useState('All')
  const [form, setForm]         = useState({ title: '', category: 'General', priority: 'Medium', due_date: '' })

  useEffect(() => {
    api.get('/app/todos').then(r => setTodos(r.data)).finally(() => setLoading(false))
  }, [])

  const add = async e => {
    e.preventDefault()
    if (!form.title.trim()) return
    setAdding(true)
    try {
      const { data } = await api.post('/app/todos', form)
      setTodos(t => [data, ...t])
      setForm({ title: '', category: 'General', priority: 'Medium', due_date: '' })
      setShowForm(false)
      toast.success('Task added')
    } catch { toast.error('Failed') }
    finally { setAdding(false) }
  }

  const toggle = async id => {
    const { data } = await api.patch(`/app/todos/${id}/toggle`)
    setTodos(t => t.map(x => x.id === id ? data : x))
  }

  const del = async id => {
    await api.delete(`/app/todos/${id}`)
    setTodos(t => t.filter(x => x.id !== id))
    toast.success('Task removed')
  }

  const done  = todos.filter(t => t.done).length
  const total = todos.length
  const pct   = total ? Math.round((done / total) * 100) : 0

  const filtered = filter === 'All' ? todos : todos.filter(t => t.category === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Interview Prep</h1>
          <p className="text-slate-400 mt-1 text-sm">Track your preparation tasks and study goals</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Overall Progress</span>
            <span className="text-sm font-mono text-indigo-400">{done}/{total} tasks</span>
          </div>
          <div className="h-2 bg-[#2a2a45] rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">{pct}% complete</p>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={add} className="card p-5 space-y-3 animate-slide-up">
          <input
            className="input text-sm" placeholder="What do you need to prepare?" required
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <select className="input text-sm" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Priority</label>
              <select className="input text-sm" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Due Date</label>
              <input type="date" className="input text-sm" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={adding} className="btn-primary text-sm w-full justify-center">
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Task
          </button>
        </form>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === c ? 'bg-indigo-600 text-white' : 'bg-[#16162a] border border-[#2a2a45] text-slate-400 hover:text-white'
            }`}>{c}</button>
        ))}
      </div>

      {/* Todo items */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No tasks yet. Add one to start preparing!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(todo => (
            <div key={todo.id}
              className={`card px-4 py-3 flex items-start gap-3 transition-all duration-200
                ${todo.done ? 'opacity-50' : ''}`}>
              <button
                onClick={() => toggle(todo.id)}
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                  ${todo.done ? 'bg-indigo-600 border-indigo-600' : 'border-[#2a2a45] hover:border-indigo-500'}`}
              >
                {todo.done && <span className="text-white text-xs">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${todo.done ? 'line-through text-slate-500' : 'text-white'}`}>
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`badge text-xs ${CAT_COLOR[todo.category] || CAT_COLOR.General}`}>
                    {todo.category}
                  </span>
                  <span className={`badge text-xs ${PRI_COLOR[todo.priority]}`}>
                    <Flag size={9} className="mr-0.5" /> {todo.priority}
                  </span>
                  {todo.due_date && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={10} /> {todo.due_date}
                    </span>
                  )}
                </div>
              </div>

              <button onClick={() => del(todo.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
