import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import AttachLessonModal from '../../../components/lesson-planning/AttachLessonModal'
import { LessonMetaBadges } from '../../../components/lesson-planning/LessonBlockRenderer'
import { useAuthStore } from '../../../store/auth'
import { useLessonTemplates, lessonTemplatesQueryKey } from '../../../hooks/useLessonTemplates'
import { LESSON_CATEGORIES, skillLevelLabel } from '../../../lib/lesson-planning-constants'
import LessonPlanningSchemaBanner from '../../../components/lesson-planning/LessonPlanningSchemaBanner'
import {
  archiveLessonTemplate,
  checkLessonPlanningSchema,
  duplicateLessonTemplate,
  formatLessonPlanningError,
} from '../../../lib/lesson-planning-service'
import { fetchTeacherStudents } from '../../../lib/studio-service'
import type { LessonTemplate, LessonTemplateSkillLevel } from '../../../types/lesson-planning'
import '../../../lib/lesson-planning.css'

type LibraryViewMode = 'cards' | 'table'

const LIBRARY_VIEW_STORAGE_KEY = 'lp-library-view-v1'

function readLibraryViewMode(): LibraryViewMode {
  if (typeof localStorage === 'undefined') return 'cards'
  return localStorage.getItem(LIBRARY_VIEW_STORAGE_KEY) === 'table' ? 'table' : 'cards'
}

export default function LessonPlanning() {
  const { user, userRole, userProfile } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [attachTemplate, setAttachTemplate] = useState<LessonTemplate | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<LibraryViewMode>(() => readLibraryViewMode())

  const filters = { search, category: categoryFilter }
  const {
    data: templates = [],
    isLoading: templatesLoading,
    isFetching: templatesFetching,
    error: templatesError,
  } = useLessonTemplates(user?.id, filters)

  const { data: students = [] } = useQuery({
    queryKey: ['teacher-students', user?.id, userRole],
    queryFn: () => fetchTeacherStudents(user!.id, userRole),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  useEffect(() => {
    let cancelled = false
    checkLessonPlanningSchema().then((schema) => {
      if (cancelled) return
      if (!schema.ok) {
        setSchemaError(schema.message ?? 'Lesson planning tables are not set up.')
      } else {
        setSchemaError(null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const loadError = templatesError ? formatLessonPlanningError(templatesError) : null
  const libraryLoading = templatesLoading || (templatesFetching && templates.length === 0)

  const invalidateTemplates = () => {
    if (!user?.id) return
    void queryClient.invalidateQueries({ queryKey: lessonTemplatesQueryKey(user.id, filters) })
  }

  const handleDuplicate = async (id: string) => {
    if (!user?.id) return
    try {
      await duplicateLessonTemplate(user.id, id)
      invalidateTemplates()
    } catch (err) {
      setActionError(formatLessonPlanningError(err))
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveLessonTemplate(id)
      invalidateTemplates()
    } catch (err) {
      setActionError(formatLessonPlanningError(err))
    }
  }

  const handleViewModeChange = (mode: LibraryViewMode) => {
    setViewMode(mode)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LIBRARY_VIEW_STORAGE_KEY, mode)
    }
  }

  const openTemplate = (id: string) => navigate(`/studio/lesson-planning/lesson/${id}`)

  const renderTemplateActions = (t: LessonTemplate, compact = false) => (
    <div className={`lp-card__actions${compact ? ' lp-card__actions--inline' : ''}`}>
      <button type="button" className="lp-btn lp-btn--primary lp-btn--sm" onClick={() => openTemplate(t.id)}>
        Open
      </button>
      <button type="button" className="lp-btn lp-btn--sm" onClick={() => setAttachTemplate(t)}>
        Assign
      </button>
      <button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={() => handleDuplicate(t.id)}>
        Duplicate
      </button>
      <button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={() => handleArchive(t.id)}>
        Archive
      </button>
    </div>
  )

  return (
    <MarkStudioLayout>
      <div className="lp-hub">
        <header className="lp-page-header">
          <div>
            <h1>Lesson Library</h1>
            <p>Reusable drum lessons — open a lesson to edit content, see who completed it, and assign students.</p>
          </div>
          <div className="lp-page-header__actions">
            <Link to="/studio/lesson-planning/lesson/new" className="lp-btn lp-btn--primary">
              <i className="bi bi-plus-lg" /> Create Lesson
            </Link>
          </div>
        </header>

        {schemaError ? <LessonPlanningSchemaBanner message={schemaError} /> : null}
        {loadError && !schemaError ? <LessonPlanningSchemaBanner message={loadError} /> : null}
        {actionError ? <LessonPlanningSchemaBanner message={actionError} /> : null}

        <div className="lp-filter-bar">
          <div className="lp-field">
            <label>Search</label>
            <input placeholder="Search lessons…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="lp-field">
            <label>Category</label>
            <select
              className="studio-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {LESSON_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="lp-field lp-field--view-toggle">
            <label>View</label>
            <div className="lp-view-toggle" role="group" aria-label="Library view">
              <button
                type="button"
                className={`lp-view-toggle__btn${viewMode === 'cards' ? ' lp-view-toggle__btn--active' : ''}`}
                aria-pressed={viewMode === 'cards'}
                onClick={() => handleViewModeChange('cards')}
                title="Card view"
              >
                <i className="bi bi-grid" /> Cards
              </button>
              <button
                type="button"
                className={`lp-view-toggle__btn${viewMode === 'table' ? ' lp-view-toggle__btn--active' : ''}`}
                aria-pressed={viewMode === 'table'}
                onClick={() => handleViewModeChange('table')}
                title="Table view"
              >
                <i className="bi bi-list-ul" /> Table
              </button>
            </div>
          </div>
        </div>

        {libraryLoading ? (
          <p className="studio-subtext">Loading lessons…</p>
        ) : templates.length === 0 ? (
          <div className="lp-empty lp-card">
            <div className="lp-empty__icon">
              <i className="bi bi-journal-richtext" />
            </div>
            <h3>Create your first reusable drum lesson</h3>
            <p>Build a lesson on the teaching canvas, then assign it to students from the lesson page.</p>
            <Link to="/studio/lesson-planning/lesson/new" className="lp-btn lp-btn--primary">
              Create Lesson
            </Link>
          </div>
        ) : viewMode === 'table' ? (
          <div className="lp-table-wrap">
            <table className="lp-table">
              <thead>
                <tr>
                  <th scope="col">Lesson</th>
                  <th scope="col">Category</th>
                  <th scope="col">Level</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Assigned</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <button type="button" className="lp-table__title-link" onClick={() => openTemplate(t.id)}>
                        {t.title}
                      </button>
                      {t.short_description ? (
                        <p className="lp-table__desc">{t.short_description}</p>
                      ) : null}
                    </td>
                    <td>{t.category}</td>
                    <td>{skillLevelLabel(t.skill_level as LessonTemplateSkillLevel)}</td>
                    <td>{t.estimated_duration_minutes ? `${t.estimated_duration_minutes} min` : '—'}</td>
                    <td>
                      {t.assigned_count ?? 0}
                      {(t.completed_count ?? 0) > 0 ? ` · ${t.completed_count} done` : ''}
                    </td>
                    <td>{new Date(t.updated_at).toLocaleDateString()}</td>
                    <td>{renderTemplateActions(t, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lp-card-grid">
            {templates.map((t) => (
              <article
                key={t.id}
                className="lp-card lesson-template-card"
                role="button"
                tabIndex={0}
                onClick={() => openTemplate(t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openTemplate(t.id)
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 className="lp-card__title">{t.title}</h3>
                  <span className="lesson-builder__badge">Template</span>
                </div>
                {t.short_description ? <p className="lp-card__meta">{t.short_description}</p> : null}
                <LessonMetaBadges
                  category={t.category}
                  skillLevel={t.skill_level}
                  duration={t.estimated_duration_minutes}
                />
                <p className="lp-card__meta">
                  {t.assigned_count ?? 0} assigned
                  {(t.completed_count ?? 0) > 0 ? ` · ${t.completed_count} completed` : ''}
                  {' · '}
                  Updated {new Date(t.updated_at).toLocaleDateString()}
                </p>
                <div onClick={(e) => e.stopPropagation()}>{renderTemplateActions(t)}</div>
              </article>
            ))}
          </div>
        )}

        {attachTemplate && user?.id ? (
          <AttachLessonModal
            template={attachTemplate}
            students={students}
            teacherId={user.id}
            teacherProfile={userProfile}
            onClose={() => setAttachTemplate(null)}
            onAttached={invalidateTemplates}
          />
        ) : null}
      </div>
    </MarkStudioLayout>
  )
}
