import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MarkStudioLayout from '../../../components/layout/MarkStudioLayout'
import AttachLessonModal from '../../../components/lesson-planning/AttachLessonModal'
import { LessonMetaBadges } from '../../../components/lesson-planning/LessonBlockRenderer'
import { useAuthStore } from '../../../store/auth'
import { LESSON_CATEGORIES } from '../../../lib/lesson-planning-constants'
import LessonPlanningSchemaBanner from '../../../components/lesson-planning/LessonPlanningSchemaBanner'
import {
  archiveLessonTemplate,
  checkLessonPlanningSchema,
  duplicateLessonTemplate,
  fetchLessonTemplates,
  formatLessonPlanningError,
} from '../../../lib/lesson-planning-service'
import { fetchTeacherStudents } from '../../../lib/studio-service'
import type { LessonTemplate } from '../../../types/lesson-planning'
import type { StudioStudent } from '../../../types/studio'
import '../../../lib/lesson-planning.css'

export default function LessonPlanning() {
  const { user, userRole, userProfile } = useAuthStore()
  const navigate = useNavigate()

  const [templates, setTemplates] = useState<LessonTemplate[]>([])
  const [students, setStudents] = useState<StudioStudent[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [attachTemplate, setAttachTemplate] = useState<LessonTemplate | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = async () => {
    if (!user?.id) return
    setLoadError(null)
    const schema = await checkLessonPlanningSchema()
    if (!schema.ok) {
      setSchemaError(schema.message ?? 'Lesson planning tables are not set up.')
      setTemplates([])
      return
    }
    setSchemaError(null)
    try {
      const [t, s] = await Promise.all([
        fetchLessonTemplates(user.id, {
          status: 'active',
          search: search || undefined,
          category: categoryFilter || undefined,
        }),
        fetchTeacherStudents(user.id, userRole),
      ])
      setTemplates(t)
      setStudents(s)
    } catch (err) {
      setLoadError(formatLessonPlanningError(err))
      setTemplates([])
    }
  }

  useEffect(() => {
    load()
  }, [user?.id, search, categoryFilter])

  const handleDuplicate = async (id: string) => {
    if (!user?.id) return
    try {
      await duplicateLessonTemplate(user.id, id)
      load()
    } catch (err) {
      setLoadError(formatLessonPlanningError(err))
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveLessonTemplate(id)
      load()
    } catch (err) {
      setLoadError(formatLessonPlanningError(err))
    }
  }

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

        <div className="lp-filter-bar">
          <div className="lp-field">
            <label>Search</label>
            <input placeholder="Search lessons…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="lp-field">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {LESSON_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {templates.length === 0 ? (
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
        ) : (
          <div className="lp-card-grid">
            {templates.map((t) => (
              <article
                key={t.id}
                className="lp-card lesson-template-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/studio/lesson-planning/lesson/${t.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/studio/lesson-planning/lesson/${t.id}`)
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
                <div className="lp-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="lp-btn lp-btn--primary lp-btn--sm"
                    onClick={() => navigate(`/studio/lesson-planning/lesson/${t.id}`)}
                  >
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
            onAttached={load}
          />
        ) : null}
      </div>
    </MarkStudioLayout>
  )
}
