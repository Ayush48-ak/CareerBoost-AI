import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Plus,
  Briefcase,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  Search,
  Download
} from 'lucide-react'

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted']

const STATUS_COLORS = {
  Applied: 'bg-indigo-500/15 text-indigo-300',
  Interview: 'bg-amber-500/15 text-amber-300',
  Offer: 'bg-emerald-500/15 text-emerald-300',
  Rejected: 'bg-red-500/15 text-red-300',
  Ghosted: 'bg-slate-500/15 text-slate-400',
}

const EMPTY = {
  company: '',
  role: '',
  status: 'Applied',
  applied_date: '',
  notes: '',
  url: '',
  salary: ''
}

function Modal({ title, form, setForm, onSave, onClose, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg card p-6 animate-slide-up">

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">{title}</h2>

          <button
            onClick={onClose}
            className="btn-ghost p-1.5"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">

          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Company *
              </label>

              <input
                className="input text-sm"
                value={form.company}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    company: e.target.value
                  }))
                }
                placeholder="Google"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Role *
              </label>

              <input
                className="input text-sm"
                value={form.role}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    role: e.target.value
                  }))
                }
                placeholder="Software Engineer"
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Status
              </label>

              <select
                className="input text-sm"
                value={form.status}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    status: e.target.value
                  }))
                }
              >
                {STATUSES.map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Applied Date
              </label>

              <input
                type="date"
                className="input text-sm"
                value={form.applied_date}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    applied_date: e.target.value
                  }))
                }
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Salary
              </label>

              <input
                className="input text-sm"
                value={form.salary}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    salary: e.target.value
                  }))
                }
                placeholder="$80k–100k"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Job URL
              </label>

              <input
                className="input text-sm"
                value={form.url}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    url: e.target.value
                  }))
                }
                placeholder="https://..."
              />
            </div>

          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Notes
            </label>

            <textarea
              rows={2}
              className="input text-sm resize-none"
              value={form.notes}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  notes: e.target.value
                }))
              }
              placeholder="Recruiter name, next steps…"
            />
          </div>

        </div>

        <div className="flex gap-3 mt-5">

          <button
            onClick={onClose}
            className="btn-ghost flex-1 justify-center text-sm"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={saving || !form.company || !form.role}
            className="btn-primary flex-1 justify-center text-sm"
          >
            {saving && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}

            Save
          </button>

        </div>

      </div>
    </div>
  )
}

export default function JobTracker() {

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')


  useEffect(() => {

    api
      .get('/api/jobs')
      .then(r => setJobs(r.data))
      .catch(() => {
        toast.error('Failed to load jobs')
      })
      .finally(() => {
        setLoading(false)
      })

  }, [])


  const openAdd = () => {
    setForm(EMPTY)
    setModal('add')
  }


  const openEdit = job => {
    setForm({
      company: job.company || '',
      role: job.role || '',
      status: job.status || 'Applied',
      applied_date: job.applied_date || '',
      notes: job.notes || '',
      url: job.url || '',
      salary: job.salary || ''
    })

    setModal(job)
  }


  const close = () => {
    setModal(null)
  }


  const save = async () => {

    if (!form.company || !form.role) {
      toast.error('Company and role are required')
      return
    }

    setSaving(true)

    try {

      if (modal === 'add') {

        const { data } = await api.post(
          '/api/jobs',
          form
        )

        setJobs(j => [data, ...j])

        toast.success('Job added')

      } else {

        const { data } = await api.put(
          `/api/jobs/${modal.id}`,
          form
        )

        setJobs(j =>
          j.map(x =>
            x.id === data.id ? data : x
          )
        )

        toast.success('Job updated')
      }

      close()

    } catch (error) {

      console.error(error)
      toast.error('Failed to save')

    } finally {

      setSaving(false)

    }
  }


  const del = async id => {

    if (!confirm('Delete this application?')) {
      return
    }

    try {

      await api.delete(`/api/jobs/${id}`)

      setJobs(j =>
        j.filter(x => x.id !== id)
      )

      toast.success('Deleted')

    } catch (error) {

      console.error(error)
      toast.error('Failed to delete')

    }
  }


  // ============================
  // EXPORT CSV
  // ============================
  const exportCSV = async () => {

    setExporting(true)

    try {

      const response = await api.get(
        '/api/export/jobs',
        {
          responseType: 'blob'
        }
      )

      const blob = new Blob(
        [response.data],
        { type: 'text/csv;charset=utf-8;' }
      )

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url
      link.setAttribute(
        'download',
        'careerboost-job-applications.csv'
      )

      document.body.appendChild(link)

      link.click()

      link.remove()

      window.URL.revokeObjectURL(url)

      toast.success('CSV exported successfully')

    } catch (error) {

      console.error('CSV export error:', error)

      toast.error(
        'Failed to export CSV'
      )

    } finally {

      setExporting(false)

    }
  }


  const filtered = jobs.filter(j => {

    const matchStatus =
      filter === 'All' ||
      j.status === filter

    const q = search.toLowerCase()

    const matchSearch =
      !q ||
      j.company.toLowerCase().includes(q) ||
      j.role.toLowerCase().includes(q)

    return matchStatus && matchSearch
  })


  if (loading) {

    return (
      <div className="flex items-center justify-center h-64">

        <div
          className="
            w-8 h-8
            border-2
            border-indigo-500
            border-t-transparent
            rounded-full
            animate-spin
          "
        />

      </div>
    )
  }


  return (

    <div className="space-y-5 animate-slide-up">

      {/* HEADER */}

      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-2xl font-bold text-white">
            Job Tracker
          </h1>

          <p className="text-slate-400 mt-1 text-sm">
            {jobs.length} application
            {jobs.length !== 1 ? 's' : ''} tracked
          </p>

        </div>


        <div className="flex gap-2">

          {/* EXPORT CSV BUTTON */}

          <button
            onClick={exportCSV}
            disabled={exporting}
            className="btn-ghost text-sm"
            title="Export job applications as CSV"
          >

            {exporting ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Download size={16} />
            )}

            {exporting
              ? 'Exporting...'
              : 'Export CSV'
            }

          </button>


          {/* ADD JOB BUTTON */}

          <button
            onClick={openAdd}
            className="btn-primary text-sm"
          >

            <Plus size={16} />

            Add Job

          </button>

        </div>

      </div>


      {/* SEARCH + FILTERS */}

      <div className="flex flex-col sm:flex-row gap-3">

        <div className="relative flex-1">

          <Search
            size={15}
            className="
              absolute
              left-3.5
              top-1/2
              -translate-y-1/2
              text-slate-500
            "
          />

          <input
            className="input pl-10 text-sm"
            placeholder="Search company or role…"
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="flex gap-2 flex-wrap">

          {['All', ...STATUSES].map(s => (

            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`
                px-3
                py-1.5
                rounded-lg
                text-xs
                font-medium
                transition-colors
                ${
                  filter === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#16162a] border border-[#2a2a45] text-slate-400 hover:text-white'
                }
              `}
            >
              {s}
            </button>

          ))}

        </div>

      </div>


      {/* TABLE */}

      {filtered.length === 0 ? (

        <div className="card p-12 text-center">

          <Briefcase
            size={36}
            className="mx-auto text-slate-600 mb-3"
          />

          <p className="text-slate-400 text-sm">
            No applications found
          </p>

          <button
            onClick={openAdd}
            className="btn-primary text-sm mt-4 mx-auto"
          >

            <Plus size={15} />

            Add your first application

          </button>

        </div>

      ) : (

        <div className="card overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-[#2a2a45]">

                  {[
                    'Company',
                    'Role',
                    'Status',
                    'Applied',
                    'Salary',
                    ''
                  ].map(h => (

                    <th
                      key={h}
                      className="
                        text-left
                        px-4
                        py-3
                        text-xs
                        font-medium
                        text-slate-500
                        uppercase
                        tracking-wider
                      "
                    >
                      {h}
                    </th>

                  ))}

                </tr>

              </thead>


              <tbody className="divide-y divide-[#2a2a45]">

                {filtered.map(job => (

                  <tr
                    key={job.id}
                    className="
                      hover:bg-[#1e1e35]
                      transition-colors
                      group
                    "
                  >

                    <td className="px-4 py-3">

                      <div className="flex items-center gap-2.5">

                        <div
                          className="
                            w-7
                            h-7
                            rounded-lg
                            bg-indigo-500/10
                            flex
                            items-center
                            justify-center
                            flex-shrink-0
                          "
                        >

                          <span
                            className="
                              text-indigo-400
                              text-xs
                              font-bold
                            "
                          >
                            {job.company?.[0]?.toUpperCase()}
                          </span>

                        </div>


                        <span className="text-white font-medium">
                          {job.company}
                        </span>


                        {job.url && (

                          <a
                            href={job.url}
                            target="_blank"
                            rel="noreferrer"
                            className="
                              text-slate-600
                              hover:text-indigo-400
                              opacity-0
                              group-hover:opacity-100
                              transition-opacity
                            "
                          >

                            <ExternalLink size={12} />

                          </a>

                        )}

                      </div>

                    </td>


                    <td className="px-4 py-3 text-slate-300">
                      {job.role}
                    </td>


                    <td className="px-4 py-3">

                      <span
                        className={`
                          badge
                          text-xs
                          ${STATUS_COLORS[job.status] || ''}
                        `}
                      >
                        {job.status}
                      </span>

                    </td>


                    <td
                      className="
                        px-4
                        py-3
                        text-slate-400
                        font-mono
                        text-xs
                      "
                    >
                      {job.applied_date || '—'}
                    </td>


                    <td
                      className="
                        px-4
                        py-3
                        text-slate-400
                        text-xs
                      "
                    >
                      {job.salary || '—'}
                    </td>


                    <td className="px-4 py-3">

                      <div
                        className="
                          flex
                          items-center
                          gap-1
                          opacity-0
                          group-hover:opacity-100
                          transition-opacity
                        "
                      >

                        <button
                          onClick={() =>
                            openEdit(job)
                          }
                          className="
                            p-1.5
                            rounded-lg
                            hover:bg-indigo-500/10
                            text-slate-400
                            hover:text-indigo-400
                            transition-colors
                          "
                        >

                          <Pencil size={13} />

                        </button>


                        <button
                          onClick={() =>
                            del(job.id)
                          }
                          className="
                            p-1.5
                            rounded-lg
                            hover:bg-red-500/10
                            text-slate-400
                            hover:text-red-400
                            transition-colors
                          "
                        >

                          <Trash2 size={13} />

                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* MODAL */}

      {modal && (

        <Modal
          title={
            modal === 'add'
              ? 'Add Application'
              : 'Edit Application'
          }
          form={form}
          setForm={setForm}
          onSave={save}
          onClose={close}
          saving={saving}
        />

      )}

    </div>

  )
}