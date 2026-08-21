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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[4px]"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[520px] flex-col rounded-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-start justify-between rounded-t-xl bg-[color:var(--ink-deep)] px-5 py-4 text-white"
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
            className="cursor-pointer border-none bg-none pl-3 text-lg leading-none text-white opacity-70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-[20px] overflow-y-auto">
          <p className="text-body leading-[1.7] mb-[16px] text-[14px]">
            {desc}
          </p>
          {steps.length > 0 && (
            <>
              <div className="font-semibold text-[color:var(--ink-deep)] mb-[10px] text-[13px]">
                {getStepsLabel(article.articleType, lang)}
              </div>
              <div className="bg-brand-tint border-l-[3px] border-l-[color:var(--ink-deep)] p-[12px_16px] rounded-[4px]">
                {steps.map((step, i) => (
                  <div key={i} className="text-[13px] leading-[2] text-strong">
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
