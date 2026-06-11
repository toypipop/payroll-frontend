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
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '20px', height: '20px', borderRadius: '50%',
          border: '1.5px solid #1a3c34', background: 'transparent',
          color: '#1a3c34', fontSize: '11px', fontWeight: 700,
          cursor: 'pointer', lineHeight: 1, flexShrink: 0,
        }}
      >
        ?
      </button>
      {open && (
        <HelpModal article={article} lang={lang} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
