import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { HelpArticle } from './helpContent'

type Props = {
  article: HelpArticle
  lang: 'th' | 'en'
  onClose: () => void
}

function getStepsLabel(articleType: string | undefined, lang: 'th' | 'en'): string {
  if (lang === 'th') {
    return articleType === 'checklist' ? 'ขั้นตอน' : 'วิธีใช้งาน'
  }
  return articleType === 'checklist' ? 'Steps' : 'How to use'
}

export default function HelpModal({ article, lang, onClose }: Props) {
  const title = lang === 'th' ? article.titleTH : article.titleEN
  const subtitle = lang === 'th' ? article.titleEN : article.titleTH
  const desc = lang === 'th' ? article.descTH : article.descEN
  const steps = lang === 'th' ? article.stepsTH : article.stepsEN

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'white', borderRadius: '12px', width: '100%', maxWidth: '520px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'var(--ink-deep)', color: 'white', padding: '16px 20px',
            borderRadius: '12px 12px 0 0', display: 'flex',
            justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0,
          }}
        >
          <div>
            <div className="text-[15px] font-bold">
              {title}
            </div>
            <div className="text-[11px] opacity-60 mt-[2px]">
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
        <div className="p-[20px] overflow-y-auto">
          <p className="text-[#444] leading-[1.7] mb-[16px] text-[14px]">
            {desc}
          </p>
          {steps.length > 0 && (
            <>
              <div className="font-semibold text-[color:var(--ink-deep)] mb-[10px] text-[13px]">
                {getStepsLabel(article.articleType, lang)}
              </div>
              <div className="bg-brand-tint border-l-[3px] border-l-[color:var(--ink-deep)] p-[12px_16px] rounded-[4px]">
                {steps.map((step, i) => (
                  <div key={i} className="text-[13px] leading-[2] text-[#333]">
                    {article.articleType === 'checklist'
                      ? <><span className="text-[color:var(--ink-deep)] font-bold mr-[6px]">✓</span>{step}</>
                      : `${i + 1}. ${step}`
                    }
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
