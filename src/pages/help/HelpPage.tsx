import { useState } from 'react'
import { HELP_ARTICLES, HELP_CATEGORIES } from './helpContent'
import type { HelpArticle, HelpCategory } from './helpContent'
import HelpModal from './HelpModal'

export default function HelpPage() {
  const [lang, setLang] = useState<'th' | 'en'>('en')
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [search, setSearch] = useState('')

  const categoryArticles = selectedCategory
    ? HELP_ARTICLES.filter((a) => a.category === selectedCategory)
    : []

  const searchResults = search.trim().length > 0
    ? HELP_ARTICLES.filter((a) => {
        const q = search.toLowerCase()
        return (
          a.titleTH.toLowerCase().includes(q) ||
          a.titleEN.toLowerCase().includes(q) ||
          a.descTH.toLowerCase().includes(q) ||
          a.descEN.toLowerCase().includes(q)
        )
      })
    : []

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a3c34' }}>
            {lang === 'en' ? 'Help Center' : 'คู่มือการใช้งาน'}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            {lang === 'th' ? 'เลือกหมวดหมู่ที่ต้องการ' : 'Select a category'}
          </div>
        </div>
        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'en' ? 'th' : 'en')}
          style={{
            background: '#f0f0f0', border: 'none', borderRadius: '20px',
            padding: '4px 8px', display: 'flex', gap: '4px', cursor: 'pointer',
          }}
        >
          {(['en', 'th'] as const).map((l) => (
            <span
              key={l}
              style={{
                background: lang === l ? '#1a3c34' : 'transparent',
                color: lang === l ? 'white' : '#666',
                borderRadius: '14px', padding: '2px 10px',
                fontSize: '12px', fontWeight: lang === l ? 600 : 400,
              }}
            >
              {l.toUpperCase()}
            </span>
          ))}
        </button>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'th' ? 'ค้นหาคู่มือ...' : 'Search help articles...'}
          style={{
            width: '100%', padding: '10px 16px', fontSize: '14px',
            border: '1px solid #e0e0e0', borderRadius: '10px',
            outline: 'none', background: 'white', boxSizing: 'border-box',
          }}
        />
      </div>

      {search.trim().length > 0 ? (
        /* Search results */
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
            {lang === 'th'
              ? `พบ ${searchResults.length} ผลลัพธ์`
              : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
          </div>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: '14px' }}>
              {lang === 'th' ? 'ไม่พบผลลัพธ์' : 'No results found'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {searchResults.map((article) => {
                const cat = HELP_CATEGORIES.find((c) => c.id === article.category)
                return (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    style={{
                      background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px',
                      padding: '16px', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a3c34', marginBottom: '4px' }}>
                      {lang === 'th' ? article.titleTH : article.titleEN}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {cat ? (lang === 'th' ? cat.titleTH : cat.titleEN) : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : selectedCategory === null ? (
        /* Category grid */
        (() => {
          const moduleCategories = HELP_CATEGORIES.filter(c =>
            ['employees', 'attendance', 'payroll', 'reports', 'settings', 'payroll-config'].includes(c.id)
          )
          const scenarioCategories = HELP_CATEGORIES.filter(c =>
            !['employees', 'attendance', 'payroll', 'reports', 'settings', 'payroll-config'].includes(c.id)
          )
          const renderCategoryCard = (cat) => {
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
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a3c34', marginBottom: '4px' }}>
                  {lang === 'th' ? cat.titleTH : cat.titleEN}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {cat.titleEN} · {count} {lang === 'th' ? 'บทความ' : 'articles'}
                </div>
              </div>
            )
          }
          return (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {moduleCategories.map(renderCategoryCard)}
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '20px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {scenarioCategories.map(renderCategoryCard)}
              </div>
            </div>
          )
        })()
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
