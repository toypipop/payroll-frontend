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
    <div className="p-[24px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-[24px]">
        <div>
          <div className="text-[20px] font-bold text-[color:var(--ink-deep)]">
            {lang === 'en' ? 'Help Center' : 'คู่มือการใช้งาน'}
          </div>
          <div className="text-[12px] text-[#888] mt-[4px]">
            {lang === 'th' ? 'เลือกหมวดหมู่ที่ต้องการ' : 'Select a category'}
          </div>
        </div>
        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'en' ? 'th' : 'en')}
          className="bg-[#f0f0f0] border-none rounded-[20px] p-[4px_8px] flex gap-[4px] cursor-pointer"
        >
          {(['en', 'th'] as const).map((l) => (
            <span
              key={l}
              style={{
                background: lang === l ? 'var(--ink-deep)' : 'transparent',
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
      <div className="mb-[20px] relative">
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
          <div className="text-[12px] text-[#888] mb-[12px]">
            {lang === 'th'
              ? `พบ ${searchResults.length} ผลลัพธ์`
              : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
          </div>
          {searchResults.length === 0 ? (
            <div className="text-center text-[#aaa] p-[40px_0] text-[14px]">
              {lang === 'th' ? 'ไม่พบผลลัพธ์' : 'No results found'}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
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
                    <div className="font-semibold text-[13px] text-[color:var(--ink-deep)] mb-[4px]">
                      {lang === 'th' ? article.titleTH : article.titleEN}
                    </div>
                    <div className="text-[11px] text-[#888]">
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
            ['overview', 'employees', 'attendance', 'payroll', 'reports', 'settings', 'payroll-config'].includes(c.id)
          )
          const scenarioCategories = HELP_CATEGORIES.filter(c =>
            !['overview', 'employees', 'attendance', 'payroll', 'reports', 'settings', 'payroll-config'].includes(c.id)
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
                <div className="font-semibold text-[14px] text-[color:var(--ink-deep)] mb-[4px]">
                  {lang === 'th' ? cat.titleTH : cat.titleEN}
                </div>
                <div className="text-[11px] text-[#888]">
                  {cat.titleEN} · {count} {lang === 'th' ? 'บทความ' : 'articles'}
                </div>
              </div>
            )
          }
          return (
            <div>
              <div className="grid grid-cols-3 gap-3">
                {scenarioCategories.map(renderCategoryCard)}
              </div>
              <hr className="border-none border-t border-t-[#e0e0e0] m-[20px_0]" />
              <div className="grid grid-cols-3 gap-3">
                {moduleCategories.map(renderCategoryCard)}
              </div>
            </div>
          )
        })()
      ) : (
        /* Module cards */
        <div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="bg-none border-none text-[color:var(--ink-deep)] cursor-pointer text-[14px] font-semibold p-[0_0_16px_0] block"
          >
            {lang === 'th' ? '← กลับ' : '← Back'}
          </button>
          <div className="grid grid-cols-3 gap-3">
            {categoryArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                style={{
                  background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px',
                  padding: '16px', cursor: 'pointer',
                }}
              >
                <div className="font-semibold text-[13px] text-[color:var(--ink-deep)]">
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
