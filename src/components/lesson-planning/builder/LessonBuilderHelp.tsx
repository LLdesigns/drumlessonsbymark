import { useEffect, useState } from 'react'
import {
  DEFAULT_HELP_PAGE_ID,
  exportLessonBuilderHelpForAi,
  findHelpPage,
  LESSON_BUILDER_HELP_SECTIONS,
} from '../../../lib/lesson-builder-help-content'
import { BUILDER_ONBOARDING_KEY } from '../../../lib/lesson-builder-utils'
import LessonBuilderHelpPage from './LessonBuilderHelpPage'

interface LessonBuilderHelpProps {
  onClose: () => void
  initialPageId?: string
  isFirstVisit?: boolean
}

export default function LessonBuilderHelp({
  onClose,
  initialPageId = DEFAULT_HELP_PAGE_ID,
  isFirstVisit = false,
}: LessonBuilderHelpProps) {
  const [activePageId, setActivePageId] = useState(initialPageId)
  const [copied, setCopied] = useState(false)

  const handleCopyForAi = async () => {
    try {
      await navigator.clipboard.writeText(exportLessonBuilderHelpForAi())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const section of LESSON_BUILDER_HELP_SECTIONS) {
      if (section.pages.some((p) => p.id === initialPageId)) {
        initial.add(section.id)
      }
    }
    return initial.size > 0 ? initial : new Set([LESSON_BUILDER_HELP_SECTIONS[0].id])
  })

  const activePage = findHelpPage(activePageId)

  useEffect(() => {
    setActivePageId(initialPageId)
  }, [initialPageId])

  const handleClose = () => {
    if (isFirstVisit) {
      localStorage.setItem(BUILDER_ONBOARDING_KEY, '1')
    }
    onClose()
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const selectPage = (pageId: string, sectionId: string) => {
    setActivePageId(pageId)
    setExpandedSections((prev) => new Set(prev).add(sectionId))
  }

  return (
    <div className="builder-help" role="dialog" aria-modal="true" aria-label="Lesson builder help">
      <header className="builder-help__header">
        <div className="builder-help__header-title">
          <i className="bi bi-book" aria-hidden />
          <span>Lesson Builder Guide</span>
        </div>
        <div className="builder-help__header-actions">
          <button
            type="button"
            className="builder-help__copy-ai lesson-builder__btn lesson-builder__btn--primary"
            onClick={handleCopyForAi}
            title="Copy the full guide as markdown for AI assistants"
          >
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`} aria-hidden />
            {copied ? 'Copied' : 'Copy all for AI'}
          </button>
          <button
            type="button"
            className={`lesson-builder__btn${isFirstVisit ? ' lesson-builder__btn--primary' : ''}`}
            onClick={handleClose}
          >
            <i className="bi bi-x-lg" /> {isFirstVisit ? 'Get started' : 'Close'}
          </button>
        </div>
      </header>

      <div className="builder-help__body">
        <nav className="builder-help__nav" aria-label="Help topics">
          {LESSON_BUILDER_HELP_SECTIONS.map((section) => {
            const isExpanded = expandedSections.has(section.id)
            return (
              <div key={section.id} className="builder-help__nav-section">
                <button
                  type="button"
                  className="builder-help__nav-section-head"
                  aria-expanded={isExpanded}
                  onClick={() => toggleSection(section.id)}
                >
                  <span>{section.title}</span>
                  <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} aria-hidden />
                </button>
                {isExpanded ? (
                  <ul className="builder-help__nav-list">
                    {section.pages.map((page) => (
                      <li key={page.id}>
                        <button
                          type="button"
                          className={`builder-help__nav-link${activePageId === page.id ? ' builder-help__nav-link--active' : ''}`}
                          onClick={() => selectPage(page.id, section.id)}
                        >
                          {page.icon ? <i className={`bi ${page.icon}`} aria-hidden /> : null}
                          <span>{page.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="builder-help__content">
          {activePage ? (
            <LessonBuilderHelpPage
              title={activePage.title}
              icon={activePage.icon}
              blocks={activePage.blocks}
            />
          ) : (
            <p className="builder-help__p">Select a topic from the menu.</p>
          )}
        </div>
      </div>
    </div>
  )
}
