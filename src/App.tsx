import { useEffect, useRef, useState } from 'react'
import { CHARACTERS, DOINGS, TWISTS } from './data'

const LABELS = ['Characters', 'Doing', 'Twist']
const DEFAULTS = [CHARACTERS, DOINGS, TWISTS]

const pick = (arr: string[], prev = '') => {
  const rest = arr.filter((x) => x !== prev)
  const pool = rest.length ? rest : arr
  return pool[Math.floor(Math.random() * pool.length)]
}

// v2 = the 100-item lists. Older saves get merged in once so the user's own additions survive.
function load(): string[][] {
  try {
    const v2 = JSON.parse(localStorage.getItem('lists-v2') ?? 'null')
    if (Array.isArray(v2) && v2.length === 3) return v2
    const old = JSON.parse(localStorage.getItem('lists') ?? 'null')
    if (Array.isArray(old)) return DEFAULTS.map((d, i) => [...new Set([...(old[i] ?? []), ...d])])
  } catch { /* first visit or blocked storage */ }
  return DEFAULTS
}

function List({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState('')
  const add = () => {
    const v = text.trim()
    if (v && !items.includes(v)) onChange([...items, v])
    setText('')
  }
  return (
    <div className="list">
      <label>{label}<span>{items.length}</span></label>
      <div className="chips">
        {items.map((it) => (
          <button key={it} className="chip" title="Remove" onClick={() => onChange(items.filter((x) => x !== it))}>
            {it} <span aria-hidden>×</span>
          </button>
        ))}
      </div>
      <input
        value={text}
        placeholder="Add and press Enter"
        aria-label={`Add ${label}`}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        onBlur={add}
      />
    </div>
  )
}

export default function App() {
  const [lists, setLists] = useState(load)
  const [twist, setTwist] = useState(true)
  const [idea, setIdea] = useState<string[]>([])
  const [rolling, setRolling] = useState(false)
  const [round, setRound] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    try { localStorage.setItem('lists-v2', JSON.stringify(lists)) } catch { /* storage unavailable */ }
  }, [lists])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const used = twist ? lists : lists.slice(0, 2)
  const ready = used.every((l) => l.length > 0)

  function generate() {
    if (rolling || !ready) return
    const next = used.map((l, i) => pick(l, idea[i]))
    setRolling(true)
    const iv = window.setInterval(() => setIdea(used.map((l) => pick(l))), 70)
    timers.current.push(iv, window.setTimeout(() => {
      clearInterval(iv)
      setIdea(next)
      setRound((r) => r + 1)
      setRolling(false)
    }, 1000))
  }

  return (
    <main>
      <header>
        <span className="mark" aria-hidden />
        <span>Concept Generator</span>
      </header>

      <section className="hero">
        <p className="eyebrow">Today's prompt</p>
        <h1 key={rolling ? undefined : round} className={rolling ? 'rolling' : 'landed'}>
          {idea.length === 0 ? (
            <span className="empty">Press generate to get a drawing idea.</span>
          ) : (
            idea.map((part, i) => [i > 0 && ' ', <span key={i} className={`p${i}`}>{part}</span>])
          )}
        </h1>

        <div className="controls">
          <button className="generate" onClick={generate} disabled={rolling || !ready}>
            {rolling ? 'Generating…' : 'Generate'}
          </button>
          <label className="switch">
            <input type="checkbox" checked={twist} onChange={(e) => setTwist(e.target.checked)} disabled={rolling} />
            <span className="track" />
            Add a twist
          </label>
        </div>
        {!ready && <p className="warn">Each list needs at least one entry.</p>}
      </section>

      <section className="lists">
        {lists.map((items, i) => (
          <div key={LABELS[i]} className={i === 2 && !twist ? 'off' : ''}>
            <List
              label={LABELS[i]}
              items={items}
              onChange={(v) => setLists((ls) => ls.map((l, j) => (j === i ? v : l)))}
            />
          </div>
        ))}
      </section>
    </main>
  )
}
