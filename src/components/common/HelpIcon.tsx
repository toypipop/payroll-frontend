import { useState } from 'react'
import { HELP_ARTICLES } from '../../pages/help/helpContent'
import HelpModal from '../../pages/help/HelpModal'

type Props = {
  articleId: string
  lang?: 'th' | 'en'
}

export default function HelpIcon({ articleId, lang = 'th' }: Props) {
  const [open, setOpen] = useState(false)
  const article = HELP_ARTICLES.find((a) => a.id === articleId)
  if (!article) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={lang === 'th' ? 'ดูคู่มือ' : 'View help'}
        className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[color:var(--ink-deep)] bg-transparent text-[11px] font-bold leading-none text-[color:var(--ink-deep)]"
      >
        ?
      </button>
      {open && (
        <HelpModal article={article} lang={lang} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
