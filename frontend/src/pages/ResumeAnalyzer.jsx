import { useEffect, useState, useRef } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Upload, FileText, Loader2, Zap, Award, CheckCircle2, Clock } from 'lucide-react'

function ScoreRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r
  const dash = circ * (score / 100)
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} stroke="#2a2a45" strokeWidth="10" fill="none" />
        <circle cx="70" cy="70" r={r} stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-white">{score}</p>
        <p className="text-xs text-slate-400">ATS Score</p>
      </div>
    </div>
  )
}

export default function ResumeAnalyzer() {
  const [resume, setResume]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [drag, setDrag]       = useState(false)
  const fileRef               = useRef()

  useEffect(() => {
    api.get('/resume/latest').then(r => setResume(r.data)).finally(() => setFetching(false))
  }, [])

  const upload = async file => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return }
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResume(data)
      toast.success('Resume analyzed!')
    } catch {
      toast.error('Analysis failed — try a text-based PDF')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]) }

  const scoreColor = s => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-red-400'
  const scoreBg    = s => s >= 70 ? 'bg-emerald-500/10' : s >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'
  const scoreLabel = s => s >= 70 ? 'Strong' : s >= 40 ? 'Moderate' : 'Needs work'

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume Analyzer</h1>
        <p className="text-slate-400 mt-1 text-sm">Upload your PDF resume to get ATS score, skill extraction, and analysis</p>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onClick={() => !loading && fileRef.current?.click()}
        className={`card p-10 text-center cursor-pointer transition-all duration-200 border-dashed
          ${drag ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#2a2a45] hover:border-indigo-500/50 hover:bg-[#1e1e35]'}`}
      >
        <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden"
          onChange={e => upload(e.target.files[0])} />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
            <p className="text-slate-400 text-sm">Analyzing your resume…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <Upload size={24} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-medium">Drop your resume here</p>
              <p className="text-slate-400 text-sm mt-1">or click to browse — PDF or TXT, max 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {resume && (
        <div className="space-y-4 animate-slide-up">
          {/* Score + meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6 flex flex-col items-center justify-center md:col-span-1">
              <ScoreRing score={resume.ats_score} />
              <span className={`mt-3 badge text-xs ${scoreColor(resume.ats_score)} ${scoreBg(resume.ats_score)}`}>
                {scoreLabel(resume.ats_score)}
              </span>
            </div>
            <div className="card p-5 md:col-span-2 space-y-3">
              <h3 className="font-semibold text-white text-sm">Resume Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'File',         value: resume.filename || 'Uploaded file', icon: FileText },
                  { label: 'Experience',   value: `${resume.experience_years}+ years`, icon: Clock },
                  { label: 'Skills Found', value: `${resume.skills?.length || 0} skills`, icon: Zap },
                  { label: 'ATS Rating',   value: scoreLabel(resume.ats_score), icon: Award },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-2.5 bg-[#1e1e35] rounded-xl p-3">
                    <Icon size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm text-white font-medium truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          {resume.skills?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-white text-sm mb-3">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map(s => (
                  <span key={s} className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card p-5">
            <h3 className="font-semibold text-white text-sm mb-3">ATS Optimization Tips</h3>
            <div className="space-y-2">
              {[
                resume.ats_score < 50 && 'Add more measurable achievements (e.g. "improved performance by 40%")',
                resume.skills?.length < 8 && 'Include more technical skills relevant to your target role',
                resume.experience_years === 0 && 'Add clear work experience section with dates',
                'Use standard section headings: Experience, Education, Skills, Projects',
                'Avoid tables, graphics, and columns — they confuse ATS parsers',
                'Include keywords from job descriptions you are targeting',
              ].filter(Boolean).map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
