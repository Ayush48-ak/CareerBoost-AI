import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Briefcase, FileText, CheckSquare, TrendingUp, Download, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS_COLORS = {
  Applied:      '#6366f1',
  Interview:    '#f59e0b',
  Offer:        '#10b981',
  Rejected:     '#ef4444',
  Ghosted:      '#64748b',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const exportCSV = () => {
    const link = document.createElement('a')
    link.href = '/api/export/jobs'
    link.setAttribute('download', 'jobs.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const pieData = Object.entries(data?.status_breakdown || {}).map(([name, value]) => ({ name, value }))
  const barData = pieData

  const stats = [
    { label: 'Jobs Applied',    value: data?.total_jobs ?? 0,     icon: Briefcase,   color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'ATS Score',       value: `${data?.ats_score ?? 0}%`, icon: FileText,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Tasks Done',      value: `${data?.todos_done ?? 0}/${data?.todos_total ?? 0}`, icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Skills Detected', value: data?.skills_count ?? 0,   icon: TrendingUp,  color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good morning, <span className="text-indigo-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Here's your career progress at a glance</p>
        </div>
        <button onClick={exportCSV} className="btn-ghost text-sm hidden sm:flex">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${bg} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Application Status</h2>
          {pieData.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-sm">
              <Briefcase size={28} className="mb-2 opacity-30" />
              No applications yet
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map(({ name }) => (
                      <Cell key={name} fill={STATUS_COLORS[name] || '#6366f1'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map(({ name, value }) => (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[name] || '#6366f1' }} />
                    <span className="text-slate-300">{name}</span>
                    <span className="text-slate-500 ml-auto font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Applications by Status</h2>
          {barData.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-sm">
              <TrendingUp size={28} className="mb-2 opacity-30" />
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 10, color: '#e2e8f0', fontSize: 12 }}
                  cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {barData.map(({ name }) => <Cell key={name} fill={STATUS_COLORS[name] || '#6366f1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent jobs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Applications</h2>
          <Link to="/jobs" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {(data?.recent_jobs || []).length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Briefcase size={28} className="mx-auto mb-2 opacity-30" />
            No applications yet.{' '}
            <Link to="/jobs" className="text-indigo-400 hover:underline">Add your first one</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recent_jobs.map(job => (
              <div key={job.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1e1e35] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-400 text-xs font-bold">{job.company[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{job.role}</p>
                  <p className="text-xs text-slate-500 truncate">{job.company}</p>
                </div>
                <span className="badge text-xs flex-shrink-0"
                  style={{ background: (STATUS_COLORS[job.status] || '#6366f1') + '20',
                           color: STATUS_COLORS[job.status] || '#6366f1' }}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
