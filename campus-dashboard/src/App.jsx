import { useState, useEffect, useMemo } from 'react'

// ---------------------------------------------------------------------------
// 1. UTILS & HOOKS
const API_BASE = 'https://campusnews.onrender.com'

function formatFullDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateChip(dateStr) {
  if (!dateStr) return { day: '--', mon: '---' }
  const d = new Date(dateStr)
  if (isNaN(d)) return { day: '--', mon: '---' }
  return {
    day: String(d.getDate()).padStart(2, '0'),
    mon: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
  }
}

// ---------------------------------------------------------------------------
// 2. ISOLATED COMPONENTS (Performance Fixes)
// ---------------------------------------------------------------------------

// ISOLATED CLOCK: Now only this small component re-renders every second!
function LiveClockDisplay() {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-2 self-start rounded-md bg-white/5 px-3 py-1.5 font-mono text-lg tabular-nums tracking-widest text-[#f3c877] sm:self-auto">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </div>
  )
}

function DateChip({ dateStr, tone }) {
  const { day, mon } = formatDateChip(dateStr)
  const toneClasses = tone === 'event'
    ? 'bg-[#12332d] text-[#8fe0cd]'
    : 'bg-[#2a2210] text-[#f3c877]'
  return (
    <div className={`flex flex-col items-center justify-center rounded-md px-2.5 py-1.5 font-mono leading-none ${toneClasses} shrink-0`}>
      <span className="text-lg font-semibold tracking-tight">{day}</span>
      <span className="text-[10px] tracking-widest">{mon}</span>
    </div>
  )
}

function CategoryTag({ category, tone }) {
  const toneClasses = tone === 'event'
    ? 'border-[#2F8F7A]/40 text-[#2F8F7A] bg-[#2F8F7A]/5'
    : 'border-[#E3A23C]/40 text-[#b9791f] bg-[#E3A23C]/10'
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${toneClasses}`}>
      {category || 'General'}
    </span>
  )
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#1B2430]/15 py-14 text-center">
      <span className="font-mono text-xs uppercase tracking-widest text-[#5B6472]">Board clear</span>
      <p className="max-w-[220px] text-sm text-[#5B6472]">No {label} match your search yet. Try a different keyword.</p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-[#1B2430]/10 bg-white/50 p-3">
          <div className="h-11 w-12 animate-pulse rounded-md bg-[#1B2430]/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#1B2430]/10" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#1B2430]/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

function FeedRow({ item, tone, onSelect }) {
  const isEvent = tone === 'event'
  return (
    <button
      onClick={() => onSelect(item)}
      className="group flex w-full items-center gap-3 rounded-lg border border-[#1B2430]/10 bg-white/60 p-3 text-left transition hover:border-[#1B2430]/25 hover:bg-white hover:shadow-sm"
    >
      <DateChip dateStr={isEvent ? item.startTime : item.createdAt} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[#1B2430]">{item.title}</p>
        <p className="mt-0.5 truncate text-sm text-[#5B6472]">
          {isEvent ? (item.venue || 'Venue TBA') : 'Notice'}
        </p>
      </div>
      <CategoryTag category={item.category} tone={tone} />
      <span className="ml-1 text-[#1B2430]/25 transition group-hover:translate-x-0.5 group-hover:text-[#1B2430]/50">
        →
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// 3. SLIDE-OVER DETAIL PANEL (Now with Escape Key Support)
// ---------------------------------------------------------------------------
function DetailPanel({ item, tone, onClose }) {
  // Close on Escape key press
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!item) return null
  const isEvent = tone === 'event'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#1B2430]/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-[#F5F6F4] shadow-2xl animate-[slidein_0.25s_ease-out]">
        <div className="flex items-start justify-between border-b border-[#1B2430]/10 p-5">
          <div>
            <CategoryTag category={item.category} tone={tone} />
            <h2 className="mt-2 text-xl font-bold text-[#1B2430]">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#5B6472] transition hover:bg-[#1B2430]/10 hover:text-[#1B2430]"
            aria-label="Close details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-wrap gap-4 font-mono text-xs text-[#5B6472]">
            {isEvent ? (
              <>
                <span>START · {formatFullDate(item.startTime)}</span>
                <span>END · {formatFullDate(item.endTime)}</span>
                <span>VENUE · {item.venue || 'TBA'}</span>
                {item.organizer && <span>BY · {item.organizer}</span>}
              </>
            ) : (
              <>
                <span>POSTED · {formatFullDate(item.createdAt)}</span>
                {item.postedBy && <span>BY · {item.postedBy.name || item.postedBy}</span>}
              </>
            )}
          </div>
          <p className="whitespace-pre-line leading-relaxed text-[#1B2430]/85">
            {isEvent ? item.description : item.content}
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. MAIN APP DASHBOARD
// ---------------------------------------------------------------------------
function App() {
  const [notices, setNotices] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selected, setSelected] = useState(null) 

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`${API_BASE}/notices`).then(res => res.json()),
      fetch(`${API_BASE}/events`).then(res => res.json()),
    ])
      .then(([noticesData, eventsData]) => {
        setNotices(noticesData)
        setEvents(eventsData)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(load, [])

  const categories = useMemo(() => {
    const set = new Set(['All'])
    notices.forEach(n => n.category && set.add(n.category))
    events.forEach(e => e.category && set.add(e.category))
    return Array.from(set)
  }, [notices, events])

  const matches = (item, fields) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = term === '' || fields.some(f => (item[f] || '').toLowerCase().includes(term))
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  }

  const filteredNotices = notices.filter(n => matches(n, ['title', 'content']))
  const filteredEvents = events.filter(e => matches(e, ['title', 'description']))

  return (
    <div className="min-h-screen bg-[#EEF1F4] text-[#1B2430]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        @keyframes slidein { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* Header */}
      <header className="border-b border-[#1B2430]/10 bg-[#1B2430] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/50">Campus Connect</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The Board
            </h1>
          </div>
          <LiveClockDisplay />
        </div>
      </header>

      {/* Filters */}
      <div className="mx-auto max-w-6xl px-5 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5B6472]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search notices and events…"
              className="w-full rounded-lg border border-[#1B2430]/15 bg-white py-2.5 pl-10 pr-3 text-sm text-[#1B2430] placeholder:text-[#5B6472]/70 focus:border-[#1B2430]/40 focus:outline-none focus:ring-2 focus:ring-[#1B2430]/10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'border-[#1B2430] bg-[#1B2430] text-white'
                    : 'border-[#1B2430]/15 bg-white text-[#5B6472] hover:border-[#1B2430]/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-semibold">Couldn't reach the board.</span> {error}. Check that the API is running, then{' '}
            <button onClick={load} className="underline underline-offset-2">try again</button>.
          </div>
        )}

        {/* Feeds */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Notices</h2>
              <span className="font-mono text-xs text-[#5B6472]">{filteredNotices.length}</span>
            </div>
            {loading ? <Skeleton /> : filteredNotices.length === 0 ? <EmptyState label="notices" /> : (
              <div className="space-y-2">
                {filteredNotices.map(n => <FeedRow key={n.id} item={n} tone="notice" onSelect={item => setSelected({ item, tone: 'notice' })} />)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Events</h2>
              <span className="font-mono text-xs text-[#5B6472]">{filteredEvents.length}</span>
            </div>
            {loading ? <Skeleton /> : filteredEvents.length === 0 ? <EmptyState label="events" /> : (
              <div className="space-y-2">
                {filteredEvents.map(e => <FeedRow key={e.id} item={e} tone="event" onSelect={item => setSelected({ item, tone: 'event' })} />)}
              </div>
            )}
          </section>
        </div>
      </div>

      <DetailPanel item={selected?.item} tone={selected?.tone} onClose={() => setSelected(null)} />
    </div>
  )
}

export default App