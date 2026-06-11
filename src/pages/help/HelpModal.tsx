import { useEffect } from 'react'
import type { HelpArticle } from './helpContent'

type Props = {
  article: HelpArticle
  lang: 'th' | 'en'
  onClose: () => void
}

export default function HelpModal({ article, lang, onClose }: Props) {
  const title = lang === 'th' ? article.titleTH : article.titleEN
  const subtitle = lang === 'th' ? article.titleEN : article.titleTH
  const desc = lang === 'th' ? article.descTH : article.descEN
  const steps = lang === 'th' ? article.stepsTH : article.stepsEN
  const stepsLabel = lang === 'th' ? 'วิธีใช้งาน' : 'How to use'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '12px', width: '100%', maxWidth: '520px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#1a3c34', color: 'white', padding: '16px 20px',
            borderRadius: '12px 12px 0 0', display: 'flex',
            justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>
              {article.emoji} {title}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
              {subtitle}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'white', fontSize: '18px',
              cursor: 'pointer', opacity: 0.7, lineHeight: 1, padding: '0 0 0 12px',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          <p style={{ color: '#444', lineHeight: 1.7, marginBottom: '16px', fontSize: '14px' }}>
            {desc}
          </p>
          <div style={{ fontWeight: 600, color: '#1a3c34', marginBottom: '10px', fontSize: '13px' }}>
            {stepsLabel}
          </div>
          <div
            style={{
              background: '#f8fffe', borderLeft: '3px solid #1a3c34',
              padding: '12px 16px', borderRadius: '4px',
            }}
          >
            {steps.map((step, i) => (
              <div key={i} style={{ fontSize: '13px', lineHeight: 2, color: '#333' }}>
                {i + 1}. {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
