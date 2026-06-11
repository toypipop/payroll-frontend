import { useState } from 'react'
import { HELP_ARTICLES, HELP_CATEGORIES } from './helpContent'
import type { HelpArticle, HelpCategory } from './helpContent'
import HelpModal from './HelpModal'

export default function HelpPage() {
  const [lang, setLang] = useState<'th' | 'en'>('th')
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)

  const categoryArticles = selectedCategory
    ? HELP_ARTICLES.filter((a) => a.category === selectedCategory)
    : []

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a3c34' }}>
            📚 Help Center / คู่มือการใช้งาน
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            {lang === 'th' ? 'เลือกหมวดหมู่ที่ต้องการ' : 'Select a category'}
          </div>
        </div>
        {/* Language toggle */}
        <div style={{ background: '#f0f0f0', borderRadius: '20px', padding: '4px 8px', display: 'flex', gap: '4px' }}>
          {(['th', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                background: lang === l ? '#1a3c34' : 'transparent',
                color: lang === l ? 'white' : '#666',
                border: 'none', borderRadius: '14px', padding: '2px 10px',
                cursor: 'pointer', fontSize: '12px', fontWeight: lang === l ? 600 : 400,
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {selectedCategory === null ? (
        /* Category grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {HELP_CATEGORIES.map((cat) => {
            const count = HELP_ARTICLES.filter((a) => a.category === cat.id).length
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px',
                  padding: '16px', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{cat.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a3c34', marginBottom: '4px' }}>
                  {lang === 'th' ? cat.titleTH : cat.titleEN}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {cat.titleEN} · {count} {lang === 'th' ? 'บทความ' : 'articles'}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Module cards */
        <div>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              background: 'none', border: 'none', color: '#1a3c34', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600, padding: '0 0 16px 0', display: 'block',
            }}
          >
            {lang === 'th' ? '← กลับ' : '← Back'}
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {categoryArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                style={{
                  background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px',
                  padding: '16px', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{article.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a3c34' }}>
                  {lang === 'th' ? article.titleTH : article.titleEN}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedArticle && (
        <HelpModal
          article={selectedArticle}
          lang={lang}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  )
}
