'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppState } from '@/context/AppContext'
import { fmtElapsed, fmtTimeShort, getTimerElapsed } from '@/lib/formatters'

const TWO_HOURS = 2 * 60 * 60 * 1000

function longBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 660
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2)
    osc.start()
    osc.stop(ctx.currentTime + 1.2)
  } catch {}
}

export default function FloatingTimer() {
  const { state, dispatch } = useAppState()
  const timers = state.activeTimers
  const [now, setNow] = useState(Date.now())
  const [, forceRender] = useState(0)
  const autoStoppedRef = useRef<Set<number>>(new Set())
  const descMapRef = useRef<Record<string, string[]>>({})

  useEffect(() => {
    if (timers.length === 0) return
    const id = setInterval(() => {
      setNow(Date.now())
      for (const t of timers) {
        if (autoStoppedRef.current.has(t.entryId)) continue
        const elapsed = getTimerElapsed(t)
        if (elapsed >= TWO_HOURS) {
          autoStoppedRef.current.add(t.entryId)
          longBeep()
          const segs = descMapRef.current[t.entryId] ?? t.segments.map((s) => s.description)
          const lastDesc = segs[segs.length - 1]?.trim()
          dispatch({
            type: 'LOG_TIME',
            payload: {
              entryId: t.entryId,
              log: {
                startedAt: t.segments[0].startedAt,
                duration: TWO_HOURS,
                description: lastDesc || undefined,
              },
            },
          })
        }
      }
    }, 200)
    return () => clearInterval(id)
  }, [timers, dispatch])

  useEffect(() => {
    autoStoppedRef.current = new Set()
  }, [timers.length])

  if (timers.length === 0) return null

  const handlePauseTimer = (entryId: number) => {
    dispatch({ type: 'PAUSE_TIMER', payload: { entryId } })
  }

  const handleResumeTimer = (entryId: number) => {
    dispatch({ type: 'RESUME_TIMER', payload: { entryId } })
  }

  const handleStopTimer = (entryId: number) => {
    const t = timers.find((x) => x.entryId === entryId)
    if (!t) return
    const total = getTimerElapsed(t)
    dispatch({
      type: 'LOG_TIME',
      payload: {
        entryId,
        log: {
          startedAt: t.segments[0].startedAt,
          duration: total,
        },
      },
    })
  }

  const updateDesc = (entryId: number, segIdx: number, val: string) => {
    const key = String(entryId)
    descMapRef.current[key] = descMapRef.current[key] ?? []
    const arr = descMapRef.current[key]
    while (arr.length <= segIdx) arr.push('')
    arr[segIdx] = val
    forceRender((n) => n + 1)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {timers.map((t) => {
        const entry = state.entries.find((e) => e.id === t.entryId)
        const totalElapsed = getTimerElapsed(t)
        const storedDescs = descMapRef.current[t.entryId]
        const isPaused = t.segments.length > 0 && t.segments[t.segments.length - 1].pausedAt !== undefined

        return (
          <div
            key={t.entryId}
            style={{
              width: 360,
              background: '#fff',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Header: entry text + ticking timer */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span
                className={isPaused ? '' : 'animate-pulse-dot'}
                style={{
                  width: 8, height: 8, borderRadius: 99,
                  background: isPaused ? 'var(--color-blue)' : 'var(--color-red)', flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <span
                style={{
                  flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                  color: 'var(--color-text)',
                  wordBreak: 'break-word',
                }}
              >
                {entry ? entry.text : 'Timer running'}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700,
                  letterSpacing: '0.02em', flexShrink: 0, color: 'var(--color-text)',
                  marginTop: -1,
                }}
              >
                {fmtElapsed(totalElapsed)}
              </span>
            </div>

            {/* Segment rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {t.segments.map((seg, si) => {
                const segRunning = seg.pausedAt === undefined
                const storedDesc = storedDescs?.[si] ?? seg.description
                const descEmpty = storedDesc.trim() === ''
                const isLast = si === t.segments.length - 1

                return (
                  <div
                    key={si}
                    style={{
                      display: 'flex', gap: 4, alignItems: 'center',
                      padding: '4px 6px',
                      background: segRunning ? 'var(--color-bg2)' : 'transparent',
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--color-text3)', flexShrink: 0, minWidth: 36 }}>
                      {fmtTimeShort(seg.startedAt)}
                    </span>
                    {seg.pausedAt ? (
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--color-text3)', flexShrink: 0 }}>
                        ▶ {fmtTimeShort(seg.pausedAt)}
                      </span>
                    ) : null}
                    <input
                      value={storedDesc}
                      onChange={(e) => updateDesc(t.entryId, si, e.target.value)}
                      placeholder={segRunning ? 'What are you working on?' : 'Done?'}
                      readOnly={!segRunning}
                      style={{
                        flex: 1, minWidth: 0,
                        background: segRunning ? '#fff' : 'transparent',
                        border: segRunning ? '1px solid var(--color-border)' : 'none',
                        borderRadius: 4, padding: segRunning ? '3px 6px' : '3px 0',
                        fontFamily: 'inherit', fontSize: 11,
                        color: 'var(--color-text)', outline: 'none',
                      }}
                    />
                    {!segRunning && !isLast ? (
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--color-text3)', flexShrink: 0, minWidth: 44, textAlign: 'right' }}>
                        {fmtElapsed(seg.pausedAt! - seg.startedAt)}
                      </span>
                    ) : null}
                    {segRunning && isLast ? (
                      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                        <button
                          onClick={() => handlePauseTimer(t.entryId)}
                          disabled={descEmpty}
                          style={{
                            background: 'var(--color-bg3)',
                            border: '1px solid var(--color-border)', borderRadius: 5, padding: '3px 7px',
                            color: descEmpty ? 'var(--color-text3)' : 'var(--color-text2)',
                            fontFamily: 'inherit', fontSize: 10,
                            fontWeight: 500, cursor: descEmpty ? 'default' : 'pointer',
                          }}
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => handleStopTimer(t.entryId)}
                          style={{
                            background: 'var(--color-accent)',
                            border: 'none', borderRadius: 5, padding: '3px 10px',
                            color: '#fff', fontFamily: 'inherit', fontSize: 10,
                            fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Stop
                        </button>
                      </div>
                    ) : null}
                    {!segRunning && isLast ? (
                      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                        <button
                          onClick={() => handleResumeTimer(t.entryId)}
                          style={{
                            background: 'var(--color-bg3)',
                            border: '1px solid var(--color-border)', borderRadius: 5, padding: '3px 7px',
                            color: 'var(--color-text2)', fontFamily: 'inherit', fontSize: 10,
                            fontWeight: 500, cursor: 'pointer',
                          }}
                        >
                          Resume
                        </button>
                        <button
                          onClick={() => handleStopTimer(t.entryId)}
                          style={{
                            background: 'var(--color-accent)',
                            border: 'none', borderRadius: 5, padding: '3px 10px',
                            color: '#fff', fontFamily: 'inherit', fontSize: 10,
                            fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Stop
                        </button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
