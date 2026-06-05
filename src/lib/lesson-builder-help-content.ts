import { LESSON_BLOCK_TYPES } from './lesson-planning-constants'
import { HELP_IMAGES } from './lesson-builder-help-images'

export type HelpBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'tip'; title?: string; text: string }
  | { type: 'img'; src: string; alt: string; caption?: string }

/** Shorthand for help guide screenshots. */
export function helpImage(src: string, alt: string, caption?: string): HelpBlock {
  return { type: 'img', src, alt, caption }
}

export { HELP_IMAGES }

export interface HelpPage {
  id: string
  title: string
  icon?: string
  blocks: HelpBlock[]
}

export interface HelpSection {
  id: string
  title: string
  pages: HelpPage[]
}

export const LESSON_BUILDER_HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    pages: [
      {
        id: 'welcome',
        title: 'Welcome',
        icon: 'bi-stars',
        blocks: [
          {
            type: 'p',
            text: 'The Lesson Builder is Mark’s studio tool for creating structured drum lessons. You assemble a lesson from blocks — text tutorials that explain, videos that demonstrate, plus sequencer grooves, tempo, tasks, and more — save it as a reusable template in your library, then assign copies to individual students. Students work through assigned lessons in their own practice portal on phone or desktop.',
          },
          {
            type: 'h3',
            text: 'The three layers of a lesson',
          },
          {
            type: 'ul',
            items: [
              'Library template — your master lesson in Lesson Planning. Edit freely; assignments already sent are not affected.',
              'Assigned copy — a snapshot per student. They see this in /student/lessons. You can customize blocks and details for one student without changing the template.',
              'Session notes — separate from lesson content. Log what happened in a live lesson (homework, next focus). Not part of the block canvas.',
            ],
          },
          {
            type: 'h3',
            text: 'Typical workflow',
          },
          {
            type: 'ol',
            items: [
              'Build blocks on the canvas and fill in lesson details (goal, instructions, homework).',
              'Save to your library, then open the Students tab to assign.',
              'Student practices in their portal — checks off tasks, uploads media, marks complete.',
              'You review progress, customize their copy if needed, and log session notes after lessons.',
            ],
          },
          helpImage(
            HELP_IMAGES.helpCopyButton,
            'Lesson Builder Guide header with Copy all for AI button',
            'Click Copy all for AI in the guide header to copy every section as markdown.'
          ),
          {
            type: 'h3',
            text: 'Copy this entire guide',
          },
          {
            type: 'p',
            text: 'Use Copy all for AI in the guide header to copy the full documentation as markdown — every section, block type, canvas layout note, and workflow. Paste into ChatGPT, Claude, or any assistant when planning lessons or troubleshooting.',
          },
          {
            type: 'tip',
            title: 'Quick start',
            text: 'New lesson → choose Stack or Bento layout → click or drag a block from the floating toolbar → click the block header or body to edit inline → Save Lesson → Students tab → Assign students. Use Student preview before assigning to verify layout and formatting.',
          },
        ],
      },
      {
        id: 'first-lesson',
        title: 'Your first lesson',
        icon: 'bi-plus-square',
        blocks: [
          helpImage(
            HELP_IMAGES.emptyCanvas,
            'Empty lesson canvas with block chips and starter templates',
            'Click any block type or choose a starter to begin.'
          ),
          {
            type: 'p',
            text: 'A new lesson opens with an empty canvas: a grid of every block type plus optional starter templates (Groove, Rudiment, Song, etc.) that pre-fill title, goal, and blocks. Starters are starting points — edit everything after applying.',
          },
          {
            type: 'h3',
            text: 'Adding blocks (three ways)',
          },
          {
            type: 'ul',
            items: [
              'Floating toolbar click — the dock at the bottom of the canvas; click a chip to append that block type and select it for editing.',
              'Floating toolbar drag — drag a chip onto a golden drop zone between blocks (Stack) or onto the canvas (Bento) to insert at that position.',
              'Empty canvas grid — same block chips as the toolbar plus optional starter templates; click to add your first block instantly.',
            ],
          },
          helpImage(
            HELP_IMAGES.canvasChromeStack,
            'Stack layout toggle in the canvas chrome bar',
            'Stack mode — vertical lesson flow with numbered student steps.'
          ),
          helpImage(
            HELP_IMAGES.canvasChromeBento,
            'Bento layout toggle in the canvas chrome bar',
            'Bento mode — grid layout; drag blocks to rearrange and resize with the width icon.'
          ),
          {
            type: 'h3',
            text: 'Stack vs Bento (layout toggle)',
          },
          {
            type: 'p',
            text: 'The chrome bar above the canvas has a Stack / Bento toggle. Stack is a vertical step-by-step flow (numbered steps for students). Bento is a responsive grid — drag blocks to swap positions, use the width icon to resize column span, and drop into empty cells while dragging. Your choice is saved with the lesson: Bento writes layout data to each block; Stack strips layout data on save.',
          },
          {
            type: 'h3',
            text: 'Editing a block',
          },
          {
            type: 'p',
            text: 'Click a block card header or body on the canvas to select it. The card border highlights and the body expands into edit mode (fields, uploaders, rich text, sliders). Only one block edits at a time. Click empty canvas padding to deselect. Block title (display title) appears in the sidebar outline and as the label above the block in the student view.',
          },
          {
            type: 'h3',
            text: 'Block header actions',
          },
          {
            type: 'ul',
            items: [
              'Grip (⋮⋮) — drag to reorder on the canvas.',
              'Chevron — collapse/expand the block body without deselecting.',
              'Duplicate — inserts a copy of the block directly below, with new IDs.',
              'Trash — removes the block permanently (until you save).',
            ],
          },
          {
            type: 'h3',
            text: 'Sidebar outline',
          },
          {
            type: 'p',
            text: 'The left panel lists blocks in order with number, icon, and title. Click a row to jump to that block. Drag rows to reorder — same result as dragging on the canvas.',
          },
          {
            type: 'tip',
            title: 'Suggested first lesson structure',
            text: 'Text (written tutorial) → Video (demo) → Sequencer (groove grid) or Image (uploaded chart) → Tempo (BPM goals) → Practice Tasks (homework checklist). Text blocks explain; video blocks demonstrate; Sequencer blocks let you build grooves with sound and a staff preview. Set lesson goal and practice assignment in the right panel so students see framing above the blocks.',
          },
        ],
      },
      {
        id: 'saving-library',
        title: 'Saving & library',
        icon: 'bi-journal-bookmark',
        blocks: [
          {
            type: 'p',
            text: 'Lessons are stored in Lesson Planning (/studio/lesson-planning). Each saved item is a template you can assign many times. The library shows category, level, duration, and assignment stats.',
          },
          {
            type: 'h3',
            text: 'Save behavior',
          },
          {
            type: 'ul',
            items: [
              'Save Lesson — writes title, all lesson details, and every block (type + content JSON) to Supabase. Required before assigning students.',
              'Canvas layout on save — Bento mode persists grid position and column span (canvasLayout) inside each block’s content JSON. Stack mode removes canvasLayout so students see numbered steps.',
              'Re-save after switching layouts — if you change from Stack to Bento (or vice versa), save again so student and preview views match.',
              'Saved indicator — green check when last save succeeded.',
              'Unsaved changes — you have local edits not yet written; navigate away at your own risk.',
              'Title required — save stays disabled until the lesson has a non-empty title.',
              'First save on a new lesson — URL updates to /studio/lesson-planning/lesson/{id} and the Students tab unlocks.',
            ],
          },
          {
            type: 'h3',
            text: 'Students tab (after save)',
          },
          {
            type: 'p',
            text: 'Shows who has this template assigned: status, assigned date, due date, completion date. Filter All / In progress / Completed. Assign students opens a picker; each assignment clones the current template into an assigned_lessons row with its own blocks and progress.',
          },
          {
            type: 'h3',
            text: 'Template vs assigned copy',
          },
          {
            type: 'ul',
            items: [
              'Editing the template does not retroactively change assignments already created.',
              'To adjust one student’s lesson, open their assigned copy (/studio/lesson-planning/assigned/{id}) from the student profile or Students tab.',
              'Students never see the library — only their assigned copies.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace & panels',
    pages: [
      {
        id: 'layout',
        title: 'Builder layout',
        icon: 'bi-layout-three-columns',
        blocks: [
          helpImage(
            HELP_IMAGES.workspaceLayout,
            'Lesson builder workspace with sidebar, canvas, inspector, and floating toolbar',
            'Four zones: header, left outline, center canvas (with docked toolbar), right lesson details.'
          ),
          {
            type: 'p',
            text: 'The builder is a four-zone editor: left sidebar (outline), center canvas + floating toolbar, right inspector (lesson details). On desktop the canvas and inspector share one column with a unified scroll edge; on mobile the sidebar and inspector become slide-over drawers (list and sliders icons in the header).',
          },
          {
            type: 'h3',
            text: 'Header (top bar)',
          },
          {
            type: 'ul',
            items: [
              'Back arrow — return to Lesson Planning library.',
              'Lesson title + meta — title is editable in the inspector; meta shows level · category · duration.',
              'Content / Students tabs — Content = canvas editor; Students = assignment table (requires saved lesson).',
              'Save status + Save Lesson — persist all changes including block layout data.',
              'Student preview — full-screen overlay matching the student practice portal (Stack or Bento layout).',
              'Help — this documentation guide; Copy all for AI copies the entire guide as markdown.',
            ],
          },
          {
            type: 'h3',
            text: 'Canvas chrome bar',
          },
          {
            type: 'p',
            text: 'Fixed strip at the top of the canvas column: Stack / Bento toggle on the left, short layout hint on the right (hints are non-interactive so they never steal clicks). Does not scroll with block content.',
          },
          {
            type: 'h3',
            text: 'Canvas scroll area',
          },
          {
            type: 'ul',
            items: [
              'Scrollable middle — block cards live here; scrollbar sits flush against the inspector border with gold-themed styling.',
              'Click empty padding — deselects the active block without collapsing others.',
              'Floating block toolbar — pinned to the bottom of the canvas column (not the page); stays visible while you scroll blocks. Does not scroll away.',
              'Empty state — dashed drop zone capped to a comfortable width; starter templates and block chips for first block.',
            ],
          },
          {
            type: 'h3',
            text: 'Left sidebar — Lesson blocks',
          },
          {
            type: 'p',
            text: 'Numbered outline of blocks in lesson order (sort_order). Reflects display titles (or auto-generated titles from content). Active block highlighted. Click scrolls canvas into view; drag-to-reorder supported.',
          },
          {
            type: 'h3',
            text: 'Center canvas — Stack mode',
          },
          {
            type: 'p',
            text: 'Vertical stack of block cards (max ~1040px wide, centered). Unselected blocks show a read-only preview (thumbnail, BPM pills, task list snippet, notation preview, etc.). Selected blocks show full inline editors. Golden drop zones appear between blocks when dragging from the toolbar or reordering.',
          },
          {
            type: 'h3',
            text: 'Center canvas — Bento mode',
          },
          {
            type: 'p',
            text: '12-column responsive grid (max ~1200px wide). Each block has a default column span by type (e.g. video/notation wider, tempo narrower). Drag grip to swap with another block; while dragging, empty grid cells highlight for repositioning. Width icon cycles column span (4 → 6 → 8 → 12). Blocks only collapse when you use the chevron — not when deselected.',
          },
          {
            type: 'h3',
            text: 'Right panel — Lesson details',
          },
          {
            type: 'p',
            text: 'Lesson-level metadata and student-facing framing text. Header and tabs stay fixed; field content scrolls with a matching themed scrollbar. Does not replace block content — it wraps the whole lesson in the student hero section above the blocks.',
          },
        ],
      },
      {
        id: 'sidebar-outline',
        title: 'Sidebar outline',
        icon: 'bi-list-ul',
        blocks: [
          helpImage(
            HELP_IMAGES.sidebarOutline,
            'Lesson blocks sidebar with numbered outline items',
            'Click a row to jump to that block; drag to reorder.'
          ),
          {
            type: 'p',
            text: 'The sidebar is a live table of contents for the lesson. It updates as you rename blocks, reorder, add, or delete.',
          },
          {
            type: 'h3',
            text: 'How block titles are chosen',
          },
          {
            type: 'p',
            text: 'Each block has an optional Display title field. If empty, the outline auto-derives a title: video/audio use their media title; text uses the first ~48 characters of body; tempo uses “60 → 90 BPM”; checklist uses the first task label; rudiment uses the rudiment name.',
          },
          {
            type: 'h3',
            text: 'Interactions',
          },
          {
            type: 'ul',
            items: [
              'Click — selects the block, expands it on canvas, scrolls it into view.',
              'Drag row — reorders blocks (same as canvas grip drag).',
              'Active highlight — shows which block you are currently editing.',
            ],
          },
          {
            type: 'tip',
            text: 'Give every block a clear display title before assigning — students see that label above each block in practice view.',
          },
        ],
      },
      {
        id: 'lesson-details',
        title: 'Lesson details panel',
        icon: 'bi-sliders',
        blocks: [
          helpImage(
            HELP_IMAGES.inspectorPanel,
            'Lesson details inspector with title, goal, and student instructions',
            'Open with the sliders icon in the header (mobile) or use the right panel on desktop.'
          ),
          {
            type: 'p',
            text: 'The inspector (right panel) stores lesson-wide settings. Blocks handle step-by-step content; this panel handles the “cover page” and library organization.',
          },
          {
            type: 'h3',
            text: 'Field reference — who sees what',
          },
          {
            type: 'ul',
            items: [
              'Title — student + library. Required. Page heading in student practice view.',
              'Category — library only (Grooves, Rudiments, Songs, Technique, etc.). Helps you organize templates.',
              'Level — library + student badge context (beginner / intermediate / advanced).',
              'Duration (min) — library cards; sets expectation for lesson length.',
              'Short description — library cards only; not shown to students.',
              'Lesson goal — student. Subtitle under the lesson title in practice view.',
              'Tags — library only. Type a tag and press Enter to add; click × to remove.',
              'Student instructions — student. Paragraph in the purple hero area above blocks.',
              'Practice assignment — student. Shown as “Practice goal” in the hero with a divider.',
              'Teacher notes (private) — never shown to students. Your internal reference on the template.',
            ],
          },
          {
            type: 'h3',
            text: 'Assigned-lesson-only fields',
          },
          {
            type: 'p',
            text: 'When editing an assigned copy, the inspector also shows: student name, custom instructions (overrides template student instructions), target/current BPM at lesson level, status dropdown, due date, and private teacher notes for this assignment.',
          },
          {
            type: 'tip',
            title: 'Hero vs blocks',
            text: 'Put “what to do this week” in Practice assignment and “how to approach the lesson” in Student instructions. Put step-by-step material (videos, charts, tasks) in blocks below.',
          },
        ],
      },
      {
        id: 'block-toolbar',
        title: 'Block toolbar & drag-drop',
        icon: 'bi-grip-horizontal',
        blocks: [
          helpImage(
            HELP_IMAGES.floatingToolbar,
            'Floating block picker toolbar at the bottom of the canvas',
            'Click a chip to add that block type; drag onto the canvas or drop zones to insert.'
          ),
          {
            type: 'p',
            text: 'The floating block toolbar (bottom center of the canvas column) is the fastest way to add structure. It stays pinned while you scroll — like a Figma-style dock. Chips are draggable buttons — not a separate palette mode. The same chips appear on the empty canvas grid when the lesson has no blocks yet.',
          },
          {
            type: 'h3',
            text: 'Click behavior',
          },
          {
            type: 'p',
            text: 'Single click adds a new empty block of that type at the bottom of the lesson, selects it, and marks the lesson dirty. Does not fire if you just finished dragging (prevents accidental double-add).',
          },
          {
            type: 'h3',
            text: 'Drag behavior',
          },
          {
            type: 'ol',
            items: [
              'Press and drag a toolbar chip.',
              'Golden drop zones appear between existing blocks and after the last block.',
              'Drop on a zone to insert at that index.',
              'Drop on empty canvas to insert as the first block.',
            ],
          },
          {
            type: 'h3',
            text: 'Reordering existing blocks',
          },
          {
            type: 'ul',
            items: [
              'Stack mode — grip on block header or sidebar outline drag; golden zones between blocks while dragging.',
              'Bento mode — grip swaps grid positions with another block; empty cells appear for drop-into-slot moves.',
              'Sidebar outline — always reflects lesson order (sort_order); reordering updates student step numbers in Stack mode.',
            ],
          },
          {
            type: 'h3',
            text: 'All block types',
          },
          {
            type: 'ul',
            items: LESSON_BLOCK_TYPES.map((bt) => `${bt.label} — ${bt.description}`),
          },
        ],
      },
      {
        id: 'student-preview',
        title: 'Student preview',
        icon: 'bi-eye',
        blocks: [
          helpImage(
            HELP_IMAGES.studentPreview,
            'Student preview showing numbered lesson steps in purple theme',
            'Open from the Student preview button in the builder header.'
          ),
          helpImage(
            HELP_IMAGES.studentBento,
            'Student view with Bento grid layout',
            'When saved in Bento mode, students see the same grid instead of numbered steps.'
          ),
          {
            type: 'p',
            text: 'Student preview is a full-screen overlay that renders the lesson using the same components and purple student styling as /student/lessons/{id}. It respects your current Stack / Bento toggle (even before save) and matches saved layout after you save in Bento mode. Use it to QA formatting, grid layout, and block separation before assigning.',
          },
          {
            type: 'h3',
            text: 'Exactly what is shown',
          },
          {
            type: 'ul',
            items: [
              'Preview banner — “Preview mode — this matches what students see in their lesson portal.”',
              'Author meta — program name, instructor, category / level / duration tags.',
              'Page header with lesson title and lesson goal (or short description).',
              'Status badge (on assigned copies only).',
              'Practice task progress bar when the lesson has checklist blocks.',
              'Hero: due date, student instructions (or custom instructions), practice assignment, lesson-level target BPM.',
              'Stack layout — numbered “Lesson steps” with icon + display title per block, then student-mode renderer.',
              'Bento layout — “Lesson content” heading, 12-column purple grid matching your canvas positions and column spans; no step numbers (spatial layout).',
              'Rich text — headings, lists, callouts, alignment, links, emphasis render with student theme fonts.',
              'Notation / sequencer — staff previews with student-appropriate typography; duplicate block titles hidden where the staff is self-explanatory.',
              'Practice tasks: checkboxes shown disabled in preview; real completion count if previewing an assigned copy with completions.',
              'Tempo blocks: Start and Goal BPM pills; “Your current tempo” only if set on assigned copy.',
            ],
          },
          {
            type: 'h3',
            text: 'What is not shown',
          },
          {
            type: 'ul',
            items: [
              'Private teacher notes (template or assignment).',
              'Lesson notes thread, practice media upload, “Mark lesson complete” button.',
              'Library-only fields: short description, tags, category.',
            ],
          },
          {
            type: 'h3',
            text: 'Preview sources',
          },
          {
            type: 'ul',
            items: [
              'Template builder — previews unsaved canvas state; no task completions or due date unless you set them in details.',
              'Assigned editor — loads real task completions for that student; shows assignment status and due date.',
              'Lesson log — preview opens assigned lesson with student name in the overlay header.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'canvas-layout',
    title: 'Canvas & layout',
    pages: [
      {
        id: 'stack-vs-bento',
        title: 'Stack vs Bento',
        icon: 'bi-grid-3x3-gap',
        blocks: [
          helpImage(
            HELP_IMAGES.stackCanvas,
            'Stack canvas with multiple block cards in a vertical list',
            'Stack — blocks in lesson order, one per row.'
          ),
          helpImage(
            HELP_IMAGES.bentoCanvas,
            'Bento canvas with blocks arranged in a responsive grid',
            'Bento — blocks side by side; video and checklist can share a row.'
          ),
          {
            type: 'p',
            text: 'Every lesson can be authored in one of two canvas layouts. The toggle lives in the canvas chrome bar. Your choice affects how you arrange blocks in the builder and how students see the lesson after save.',
          },
          {
            type: 'h3',
            text: 'Stack layout',
          },
          {
            type: 'ul',
            items: [
              'Vertical list — one block per row, full teaching flow top to bottom.',
              'Students see numbered steps (“Lesson steps”) — step 1, 2, 3 in sort_order.',
              'Best for linear lessons: intro → demo → exercise → homework.',
              'Reorder with grip or sidebar; golden insert zones when dragging new blocks.',
              'On save — any canvasLayout grid data is removed from block JSON so students always get the step view.',
            ],
          },
          {
            type: 'h3',
            text: 'Bento layout',
          },
          {
            type: 'ul',
            items: [
              '12-column grid — place blocks side by side like a dashboard or magazine layout.',
              'Default column spans by block type: video/notation/sequencer/image = 8 cols; text/checklist = 6; tempo/rudiment/audio/link = 4.',
              'Width icon on block header cycles span: 4 → 6 → 8 → 12 (clamped to grid).',
              'Drag grip — swap positions with another block; while dragging, dashed empty cells show valid drop targets.',
              'On save — canvasLayout (gridCol, gridRow, colSpan, rowSpan) is written into each block’s content JSON.',
              'Students see the same grid in their portal (purple theme) after save — responsive: 6 columns on tablet, single column on phone.',
            ],
          },
          {
            type: 'h3',
            text: 'Lesson order vs grid position',
          },
          {
            type: 'p',
            text: 'sort_order (sidebar outline order) still defines lesson sequence for practice tasks, linked blocks, and analytics. Bento only changes visual placement on screen — it does not reorder the underlying block list unless you drag-reorder in the sidebar or stack mode.',
          },
          {
            type: 'tip',
            title: 'Switching layouts',
            text: 'Switching to Bento auto-layouts blocks that lack grid data. Switching back to Stack does not delete grid data until you save — preview uses the active toggle; students use whatever was saved. Always save after picking your final layout.',
          },
        ],
      },
      {
        id: 'canvas-workspace',
        title: 'Canvas interactions',
        icon: 'bi-hand-index',
        blocks: [
          helpImage(
            HELP_IMAGES.blockSelected,
            'Selected text block with inline rich text editor open',
            'Click the block header or body to select; gold border shows edit mode.'
          ),
          helpImage(
            HELP_IMAGES.emptyCanvas,
            'Empty canvas with block type grid and starter templates',
            'New lessons start here — click a chip or apply a starter template.'
          ),
          {
            type: 'p',
            text: 'The canvas column is designed for long lessons: chrome stays fixed, content scrolls, toolbar stays docked, inspector scrolls independently.',
          },
          {
            type: 'h3',
            text: 'Selecting blocks',
          },
          {
            type: 'ul',
            items: [
              'Click block header or body — selects and expands editor (if not already editing another block).',
              'Click sidebar row — selects, expands, scrolls block into view.',
              'Click empty canvas padding — deselects; does not collapse blocks you expanded manually.',
              'Collapse chevron — hides block body without deselecting.',
            ],
          },
          {
            type: 'h3',
            text: 'Block header actions',
          },
          {
            type: 'ul',
            items: [
              'Grip — Stack: reorder; Bento: reposition on grid.',
              'Width icon (Bento only) — cycle column span.',
              'Chevron — collapse / expand preview.',
              'Duplicate — copy block below with new IDs.',
              'Trash — remove block.',
            ],
          },
          {
            type: 'h3',
            text: 'Scrollbars & inspector',
          },
          {
            type: 'p',
            text: 'Canvas scroll and inspector body use matching gold-themed thin scrollbars. A vertical border between canvas and inspector aligns the scrollbar track with the panel edge so the workspace feels like one connected editor column.',
          },
          {
            type: 'h3',
            text: 'Empty canvas',
          },
          {
            type: 'ul',
            items: [
              'Dashed drop target — capped width so it does not stretch awkwardly on wide screens.',
              'Block type grid — click any chip to add first block.',
              'Starter templates — Groove, Rudiment, Song, etc. pre-fill title, goal, category, and blocks.',
              'Drag from toolbar onto empty canvas — inserts as first block.',
            ],
          },
        ],
      },
      {
        id: 'rich-text-editor',
        title: 'Rich text editor',
        icon: 'bi-type',
        blocks: [
          helpImage(
            HELP_IMAGES.richTextToolbar,
            'Rich text editor with grouped formatting toolbar',
            'Toolbar groups: Text, Breaks, Headings, Boxes, Lists, Layout, Emphasis, Link, Edit.'
          ),
          {
            type: 'p',
            text: 'Text blocks use an inline rich text editor with a grouped toolbar. Formatting is sanitized on save and render — students see the same styles in practice view (purple student theme).',
          },
          {
            type: 'h3',
            text: 'Toolbar groups',
          },
          {
            type: 'ul',
            items: [
              'Text — bold, italic, underline, strikethrough, superscript, subscript.',
              'Breaks — line break (Br button or Shift+Enter), vertical spacer, horizontal divider.',
              'Headings — paragraph, H2, H3, H4, H5.',
              'Boxes — Lead paragraph, Note, Tip, Warning, Practice callout (styled blocks).',
              'Lists — bullet list, numbered list, Steps list (ordered with step styling), block quote.',
              'Layout — align left / center / right, increase / decrease indent.',
              'Emphasis — highlight, accent color, muted, small text, inline code, keyboard key style.',
              'Link — insert/edit hyperlink (safe URLs only).',
              'Edit — undo, redo, clear formatting.',
            ],
          },
          {
            type: 'h3',
            text: 'Paste behavior',
          },
          {
            type: 'p',
            text: 'Paste from Word, Google Docs, or web pages is cleaned automatically — unsafe tags stripped, allowed classes preserved. Plain text paste wraps in paragraphs with line breaks preserved.',
          },
          {
            type: 'h3',
            text: 'Student rendering',
          },
          {
            type: 'ul',
            items: [
              'Headings, lists, callouts, alignment, links, and emphasis map to lesson-rich-text--student CSS.',
              'Callout boxes (Note, Tip, Warning, Practice) have distinct left-border colors in student view.',
              'Links open in a new tab with rel=noopener.',
              'Mobile-friendly — avoid walls of text; use headings and short paragraphs.',
            ],
          },
          {
            type: 'tip',
            title: 'Video + text pattern',
            text: 'Use a Text block before and after each Video block: “Before you watch” (setup) → Video → “Focus points” (coaching). Rich headings and bullet lists make mobile practice readable.',
          },
        ],
      },
      {
        id: 'student-bento-layout',
        title: 'Student grid layout',
        icon: 'bi-phone',
        blocks: [
          helpImage(
            HELP_IMAGES.studentBento,
            'Student practice view with Bento grid layout in purple theme',
            'Students see “Lesson content” in a grid when the lesson was saved in Bento mode.'
          ),
          {
            type: 'p',
            text: 'When a lesson is saved in Bento mode, students and student preview see the same grid — not numbered steps. Layout is read from each block’s canvasLayout field in the database.',
          },
          {
            type: 'h3',
            text: 'How students get Bento',
          },
          {
            type: 'ol',
            items: [
              'Author selects Bento in the builder chrome bar.',
              'Author arranges blocks and saves the lesson (template or assigned copy).',
              'save writes canvasLayout into each block’s content JSON.',
              'Student portal and preview detect layout from saved block data and render the 12-column grid.',
            ],
          },
          {
            type: 'h3',
            text: 'Student grid behavior',
          },
          {
            type: 'ul',
            items: [
              'Section title — “Lesson content” instead of “Lesson steps”.',
              'No step numbers — spatial layout conveys grouping (e.g. video beside checklist).',
              'Block cards — same purple styling, icon label, optional display title, then block renderer.',
              'Responsive — 12 cols desktop, 6 cols under ~900px, single column under ~640px (blocks stack full width).',
              'Practice tasks and linked blocks still use sort_order for “Go to …” jumps.',
            ],
          },
          {
            type: 'h3',
            text: 'Assigned copies',
          },
          {
            type: 'p',
            text: 'Customizing an assigned lesson in Bento mode saves grid data to that student’s copy only. The library template is unchanged. Re-save after layout edits so the student’s /student/lessons page updates.',
          },
          {
            type: 'h3',
            text: 'Stack mode on student side',
          },
          {
            type: 'p',
            text: 'Lessons saved in Stack mode (or legacy lessons without canvasLayout) show the classic numbered step list. Students scroll top to bottom — ideal for guided lesson plans.',
          },
        ],
      },
    ],
  },
  {
    id: 'students',
    title: 'Students & assignments',
    pages: [
      {
        id: 'assigning',
        title: 'Assigning lessons',
        icon: 'bi-people',
        blocks: [
          {
            type: 'p',
            text: 'Assignment creates a new assigned_lessons record plus a full copy of all blocks at that moment. The student receives a notification and the lesson appears in their Lessons list.',
          },
          {
            type: 'h3',
            text: 'How to assign',
          },
          {
            type: 'ol',
            items: [
              'Save the template first.',
              'Open the Students tab on the lesson page.',
              'Click Assign students and pick one or more students from your roster.',
              'Optionally set due date or customizations in the attach flow.',
            ],
          },
          {
            type: 'h3',
            text: 'Students tab table columns',
          },
          {
            type: 'ul',
            items: [
              'Student — link to student profile.',
              'Status — not started, in progress, needs review, completed, archived.',
              'Assigned — date you attached the lesson.',
              'Due — due date if set on the assignment.',
              'Completed — date the student marked the lesson complete (if applicable).',
              'Actions — open assigned editor, view student-side lesson.',
            ],
          },
          {
            type: 'h3',
            text: 'After assignment',
          },
          {
            type: 'ul',
            items: [
              'Student status starts as not started; changes to in progress when they open the lesson.',
              'Practice task checkoffs are stored per assignment — you get notified on each completion.',
              'Students can also self-enroll from your published lesson library if enabled.',
            ],
          },
        ],
      },
      {
        id: 'assigned-editor',
        title: 'Assigned lesson editor',
        icon: 'bi-person-badge',
        blocks: [
          {
            type: 'p',
            text: 'Opened from a student profile or the Students tab. Same canvas, Stack/Bento toggle, floating toolbar, and inspector as the template builder, but changes save to that student’s assigned copy only. Header shows student name and an “Assigned” badge in the sidebar. Bento layout saves to this copy’s blocks — not the library template.',
          },
          {
            type: 'h3',
            text: 'Assignment-specific inspector fields',
          },
          {
            type: 'ul',
            items: [
              'Custom instructions for student — replaces template student instructions in the student hero when non-empty.',
              'Target BPM — shown in student hero as “Target tempo: X BPM”.',
              'Current BPM — lesson-level tempo you track for this student (separate from tempo block content).',
              'Status — manually set or updated when student completes lesson.',
              'Due date — calendar date shown as “Due …” in student hero.',
              'Private teacher notes — only on this assignment; never student-visible.',
            ],
          },
          {
            type: 'h3',
            text: 'Lesson notes (below canvas on assigned editor)',
          },
          {
            type: 'p',
            text: 'Thread of notes between you and the student on this assignment. Choose visibility: shared with student or private (only you). Students can add notes on their side too. Separate from session notes and from blocks.',
          },
          {
            type: 'h3',
            text: 'Student-side actions you do not see in preview',
          },
          {
            type: 'ul',
            items: [
              'Check off practice tasks (syncs to you).',
              'Upload practice audio/video (notifies you).',
              'Mark lesson complete (sets status completed).',
              'Message teacher link to studio messages.',
            ],
          },
        ],
      },
      {
        id: 'student-portal',
        title: 'Student practice portal',
        icon: 'bi-mortarboard',
        blocks: [
          helpImage(
            HELP_IMAGES.studentPreview,
            'Student lesson page with hero, progress bar, and numbered blocks',
            'Same layout as Student preview in the builder (Stack mode shown).'
          ),
          {
            type: 'p',
            text: 'Students open assigned lessons at /student/lessons/{id}. The page uses LessonStudentPracticeView — the same component as Student preview in the builder. Purple theme, mobile-friendly, PWA-capable.',
          },
          {
            type: 'h3',
            text: 'Page structure',
          },
          {
            type: 'ul',
            items: [
              'Back link — return to All lessons list.',
              'Author meta — program, instructor name, category / level / duration chips.',
              'Title + lesson goal (or short description subtitle).',
              'Status badge — not started, in progress, needs review, completed.',
              'Practice task progress — bar and count when checklist blocks exist.',
              'Hero card — due date, student instructions, practice assignment, target BPM.',
              'Blocks — Stack (numbered steps) or Bento (grid) depending on how the lesson was saved.',
              'Lesson notes thread — shared / private notes with teacher (assigned lessons).',
              'Mark lesson complete — when student finishes all work.',
              'Practice media upload — audio/video sent to teacher with notification.',
            ],
          },
          {
            type: 'h3',
            text: 'Block rendering (student mode)',
          },
          {
            type: 'ul',
            items: [
              'Text — rich formatted HTML with student callout styles.',
              'Video — YouTube/Vimeo embed or HTML5 player.',
              'Audio — native audio controls.',
              'Sequencer — drum notation staff with playback.',
              'Notation — music staff with playback and speed controls.',
              'Image — responsive chart/photo.',
              'Tempo — Start → Goal BPM pills.',
              'Rudiment — colored R/L/K sticking chips.',
              'Checklist — interactive checkboxes, hints, jump links to linked blocks.',
              'Resource link — external link in new tab.',
            ],
          },
          {
            type: 'h3',
            text: 'Block separation & readability',
          },
          {
            type: 'p',
            text: 'Each block is a distinct card with left accent bar, header (icon + type label + optional title), and body. Bento cards sit in a responsive grid with gap spacing. Text blocks use readable font size and line height for long tutorials on phone.',
          },
          {
            type: 'tip',
            title: 'Preview before assign',
            text: 'Always run Student preview after saving — it is the fastest way to catch layout issues, broken embeds, or text formatting problems before a student opens the lesson.',
          },
        ],
      },
      {
        id: 'session-log',
        title: 'Lesson log & sessions',
        icon: 'bi-journal-text',
        blocks: [
          {
            type: 'p',
            text: 'The lesson log (/studio/lesson-session) is your live teaching workspace: pick a student, see their active assigned lessons, preview as student, and save session notes after the lesson.',
          },
          {
            type: 'h3',
            text: 'Main areas',
          },
          {
            type: 'ul',
            items: [
              'Today’s focus — free-text for your own session planning (not saved to session notes automatically).',
              'Assigned lessons — expandable cards with block previews, Student preview button, and link to customize.',
              'Session notes panel — form saved as a lesson_session_notes record.',
              'Student panel — name, skill level, goals from studio profile.',
            ],
          },
          {
            type: 'h3',
            text: 'Session note fields',
          },
          {
            type: 'ul',
            items: [
              'Related lesson — optional link to an assigned lesson row.',
              'Covered / Improved / Needs work — your internal teaching log (not automatically sent to student).',
              'Student summary — shared with student when saved (triggers notification if filled).',
              'Homework — shared with student when saved (triggers notification if filled).',
              'Next focus — planning note for the following session.',
              'Private notes — collapsed section; never shared with student.',
            ],
          },
          {
            type: 'tip',
            text: 'Open Student preview from the log while teaching to mirror exactly what the student sees on their device — including Bento grid layout if the assigned lesson was saved in Bento mode.',
          },
        ],
      },
    ],
  },
  {
    id: 'blocks',
    title: 'Block types',
    pages: LESSON_BLOCK_TYPES.map((bt) => blockHelpPage(bt.type, bt.label, bt.icon)),
  },
]

function blockHelpPage(type: string, label: string, icon: string): HelpPage {
  const pages: Record<string, HelpPage> = {
    text: {
      id: 'block-text',
      title: label,
      icon,
      blocks: [
        helpImage(
          HELP_IMAGES.richTextToolbar,
          'Text block rich text editor toolbar',
          'Select a Text block on the canvas to open the inline editor and toolbar.'
        ),
        {
          type: 'p',
          text: 'The Text block is your written tutorial layer. Video shows how — text explains why, what to focus on, and how to practice. Use it to turn a demo clip into a structured lesson students can follow on their own between sessions.',
        },
        {
          type: 'h3',
          text: 'The video + text pattern',
        },
        {
          type: 'p',
          text: 'Most lessons alternate explanation and demonstration. A common flow: Text (intro and goals) → Video (demo) → Text (coaching cues or “what to fix”) → Sequencer / Tempo / Tasks. Repeat for each section of the song or exercise.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — e.g. “Before you watch”, “Focus points”, “After the demo”. Shown in the outline and as the label above the block in student view.',
            'Written tutorial — full rich text toolbar (see Rich text editor help page): bold/italic/underline/strike, superscript/subscript; line break (Br or Shift+Enter), spacer, divider; headings P–H5; callout boxes (Lead, Note, Tip, Warning, Practice); bullet/numbered/Steps lists, block quote; align left/center/right, indent; highlight, accent, muted, small, code, keyboard keys; links; undo/redo/clear. Paste from Word/Docs is cleaned automatically.',
            'Plain text paste — automatically wrapped in paragraphs; line breaks preserved.',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'p',
          text: 'Readable tutorial prose in the practice flow — same formatting as you author (headings, lists, quotes, highlights, links). Students scroll through text and video blocks in order, like a mini course. Links open in a new tab. Keep paragraphs short for mobile.',
        },
        {
          type: 'h3',
          text: 'When to use it',
        },
        {
          type: 'ul',
          items: [
            'Before a video — set context, list what to watch for, give setup steps (“Tune to this chart, focus on the hi-hat”).',
            'After a video — recap, common mistakes, “now try it at 70 BPM”.',
            'Between sections — bridge from verse groove to chorus fill without recording another clip.',
            'Standalone reference — technique reminders or reading assignments when no video is needed.',
          ],
        },
        {
          type: 'tip',
          title: 'Example',
          text: 'Block title: “Before you watch” · Tutorial: H4 “What we’re learning” + bullet list of grip checks + highlighted line “Watch the demo twice before attempting the groove.” → next block: Video demo.',
        },
      ],
    },
    sequencer: {
      id: 'block-sequencer',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'Build drum grooves inside the lesson — full kit on a step grid with built-in sound. Click cells to place hits, drag to paint, and press Play groove to hear the pattern. A standard drum staff preview updates live below. Students get the same playback in their practice view.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — e.g. “Verse groove” or “Fill pattern”.',
            'Time signature — 3/4 or 4/4, with 8th- or 16th-note grid resolution.',
            'Grid — crash (Cr), ride (Rd), hi-hat (HH), snare (SN), tom (T1), tom 14", tom 16", kick (BD). Click a cell to place a hit and hear it. Snare cycles: normal → accent → ghost. Hi-hat / ride: closed → open.',
            'Sound — Play groove runs the pattern at the set BPM. Loop repeats all bars until Stop. Speaker icon on each row previews that drum voice.',
            'Presets — Basic rock, Half-time feel, or Empty bar as starting points.',
            'Bars — add multiple measures; clear or remove individual bars.',
            'Staff preview — live rendered notation below the grid.',
            'Caption — optional coaching note under the staff.',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'p',
          text: 'Rendered standard drum-set notation on a 5-line staff: percussion clef, correct positions for crash / hi-hat / ride (×), rack & floor toms, snare on the middle line, kick below the staff, accent (>) and ghost (parentheses) snare strokes, open hi-hat circles, and cymbal beaming. Playback controls included.',
        },
        {
          type: 'h3',
          text: 'Sequencer vs Image block',
        },
        {
          type: 'ul',
          items: [
            'Sequencer block — build grooves in the grid; editable, playable, renders to staff.',
            'Image block — upload a PNG, photo, or PDF from Sibelius, Finale, MuseScore, or a whiteboard photo.',
          ],
        },
        {
          type: 'tip',
          title: 'Example',
          text: 'Block title: “Chorus groove” · Preset: Basic rock · Tweak kick pattern · Caption: “Keep hi-hat even before speeding up.”',
        },
      ],
    },
    notation: {
      id: 'block-notation',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'Write and preview traditional music notation for piano, guitar, bass, voice, or drums. V1 provides a structured placeholder staff and fullscreen editor shell — real note placement and engraving come in a future update.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — e.g. “Verse melody” or “Bass line”.',
            'Instrument — piano, guitar, bass, drums, or voice.',
            'Tempo, time signature, and key signature.',
            'Staff preview — placeholder staff with measure divisions.',
            'Open Notation Editor — fullscreen modal for detailed editing (V1 placeholder tools).',
            'Caption — optional coaching note for the student.',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'p',
          text: 'Staff preview with sans-serif labels, play/stop controls, tempo and time signature, practice speed (50%, 75%, 100%), optional loop toggle, and your caption. Duplicate block title is hidden in student view when the staff preview is the primary content.',
        },
        {
          type: 'h3',
          text: 'Notation vs Sequencer vs Image',
        },
        {
          type: 'ul',
          items: [
            'Notation block — traditional staff notation for any instrument (V1 placeholder).',
            'Sequencer block — drum groove grid with playback and drum staff.',
            'Image block — upload an existing chart or PDF.',
          ],
        },
      ],
    },
    notation_image: {
      id: 'block-image',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'Upload a chart, photo, or PDF when you already have notation as a file — exports from notation software, screenshots, or whiteboard photos. For grooves you build inside Play It Pro, use the Sequencer block instead.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — e.g. “Full song chart” or “Page 12 exercise”.',
            'Upload image — file picker accepts images and PDF. Upload runs through studio media service tied to your user ID.',
            'Caption — optional text under the image in student view (also used as fallback outline title).',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'p',
          text: 'Full-width responsive image (max-width 100%). Caption below in muted text if provided. If no file uploaded, the block renders nothing in student view.',
        },
        {
          type: 'h3',
          text: 'When to use it',
        },
        {
          type: 'ul',
          items: [
            'PDF or PNG exports from Sibelius, MuseScore, or Finale.',
            'Photo of a whiteboard chart from an in-person lesson.',
            'Screenshot of a groove from a DAW or sheet music app.',
            'Full song charts too complex for the built-in sequencer grid.',
          ],
        },
        {
          type: 'tip',
          title: 'Example',
          text: 'Caption: “Bars 1–8, verse — watch hi-hat spacing” so the student knows which section of the chart matters.',
        },
      ],
    },
    video: {
      id: 'block-video',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'Embeds a demonstration video inline in the lesson. Supports YouTube, Vimeo, direct video URLs, or uploaded video files.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — student-facing label (separate from video title field).',
            'Video URL — paste youtube.com, youtu.be, vimeo.com, or a direct .mp4 link.',
            'Or upload — pick a video file from device; stored in studio media and played via native <video> if not embeddable.',
            'Live embed preview — YouTube/Vimeo URLs show inline iframe while editing.',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'ul',
          items: [
            'YouTube/Vimeo — 16:9 embedded player in the lesson (no redirect).',
            'Direct/upload URL — HTML5 video controls.',
            'Unrecognized URL — link button “Open video →” opens in new tab.',
          ],
        },
        {
          type: 'h3',
          text: 'Supported URL patterns',
        },
        {
          type: 'ul',
          items: [
            'youtube.com/watch?v=ID and youtu.be/ID → YouTube embed.',
            'vimeo.com/123456 → Vimeo player embed.',
            'Other URLs — treated as direct links or uploads.',
          ],
        },
        {
          type: 'tip',
          title: 'Example',
          text: 'Pair with a Practice Task “Watch demo video” (type: Watch) so students check it off after viewing.',
        },
      ],
    },
    audio: {
      id: 'block-audio',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'Embeds a playable audio track — play-alongs, click tracks, song references, or recorded demos. Upload only (no URL paste field); file goes to studio media storage.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — label above the player in student view.',
            'Audio file — upload MP3, WAV, or other browser-supported audio.',
            'Preview player shown in editor after upload.',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'p',
          text: 'Standard HTML5 audio bar: play/pause, timeline scrub, volume. Works on mobile with OS media controls.',
        },
        {
          type: 'h3',
          text: 'When to use it',
        },
        {
          type: 'ul',
          items: [
            'Drumless or backing tracks for groove practice.',
            'Slowed-down demo loops.',
            'Metronome recordings at specific tempos.',
          ],
        },
        {
          type: 'tip',
          text: 'Combine with a Tempo block so students know which BPM to practice against the track.',
        },
      ],
    },
    tempo: {
      id: 'block-tempo',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'Communicates a tempo progression: where to start, where to finish, and optional pacing guidance. Visual Start → Goal diagram while editing; compact BPM pills for students.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — e.g. “Groove tempo build” or “Paradiddle speed goal”.',
            'Starting tempo — slider/number 40–300 BPM. Editor shows delta to goal and estimated ~5 BPM steps.',
            'Goal tempo — slider/number; cannot be set below starting tempo (auto-adjusts).',
            'Minutes per step — optional; student sees “Spend ~N min at each step before increasing.”',
            'Focus for this tempo work — free-text notes (technique, metronome advice).',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'ul',
          items: [
            'Two pills: Start (starting BPM) and Goal (target BPM) with arrow between.',
            'Minutes per step line when set.',
            'Your coaching notes as plain text.',
            '“Your current tempo: X BPM” only if current BPM is set on the assigned lesson (lesson-level field, not in block).',
          ],
        },
        {
          type: 'h3',
          text: 'Tempo block vs lesson Target BPM',
        },
        {
          type: 'p',
          text: 'This block is for section-specific tempo goals inside the lesson. The inspector’s Target BPM on assigned lessons is a single headline tempo in the student hero — use both when you want an overall target plus per-exercise builds.',
        },
        {
          type: 'tip',
          title: 'Example',
          text: 'Start 70 → Goal 100, 3 min per step, notes: “Clean doubles before each bump. Use metronome on phone.”',
        },
      ],
    },
    rudiment: {
      id: 'block-rudiment',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'Defines a sticking pattern for rudiments or hand-foot combinations. Visual R / L / K chip builder with presets — students see colored hand chips, not the raw editor.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — optional; rudiment name also drives outline title.',
            'Rudiment name — displayed as heading in student view.',
            'Sticking pattern — tap R (right), L (left), or K (kick/bass) to append strokes; drag chips to reorder; double-click to remove; Clear wipes all.',
            'Presets — one-click patterns: single stroke roll, double stroke roll, paradiddle, double paradiddle, flam tap.',
            'Tempo goal — slider 40–220 BPM shown to student.',
            'Coaching notes — technique reminders below the pattern.',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'ul',
          items: [
            'Rudiment name as heading.',
            'Sticking as colored chips: R, L, K (fallback to text pattern if no chip data).',
            '“Tempo goal: X BPM” when set.',
            'Notes paragraph when filled.',
          ],
        },
        {
          type: 'h3',
          text: 'When to use it',
        },
        {
          type: 'ul',
          items: [
            'Lesson focus on a specific PAS rudiment.',
            'Custom hand-foot patterns (include K strokes).',
            'Visual sticking reference instead of notation image.',
          ],
        },
        {
          type: 'tip',
          title: 'Example',
          text: 'Name: “Paradiddle” · Preset paradiddle · Tempo goal 100 · Notes: “Accent the first note of each four.”',
        },
      ],
    },
    checklist: {
      id: 'block-checklist',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'Interactive homework checklist. Students tick tasks in their portal; completions persist per assigned lesson and notify you. This is the primary accountability block between lessons.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — e.g. “This week’s practice” or “Before next lesson”.',
            'Instructions for student — optional paragraph above the task list.',
            'Per task: Type, Task label, Linked block (video, sequencer, tempo, etc.), Auto-complete when linked block is done, Hint, drag to reorder.',
            'Quick add suggests a linked block when one exists (e.g. Watch → video block).',
            'Add task — blank practice task row.',
          ],
        },
        {
          type: 'h3',
          text: 'Task types',
        },
        {
          type: 'ul',
          items: [
            'Practice — general playing homework (icon: music note).',
            'Watch — view a linked or embedded video in the lesson (icon: play).',
            'Listen — listen to audio block or external reference (icon: headphones).',
            'Record — student records/uploads practice (icon: mic).',
            'Read — review sequencer groove or text (icon: book).',
            'Task — generic checklist item (icon: checkbox).',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'ul',
          items: [
            '“Practice tasks” header with progress bar (X of Y done).',
            'Instructions paragraph if set.',
            'Each task: checkbox, label, hint, “Go to …” jump link when linked to another block.',
            'Watch / listen / sequencer tasks can auto-check when the student engages with the linked block.',
            'All tasks done → lesson status moves to Needs review for Mark.',
            'Activity is logged for analytics (lesson opened, tasks, block views, playback).',
          ],
        },
        {
          type: 'h3',
          text: 'Notifications',
        },
        {
          type: 'p',
          text: 'When a student checks off a task, you receive a studio notification with their name, task label, and lesson title.',
        },
        {
          type: 'tip',
          title: 'Example tasks',
          text: '“Play verse groove at 80 BPM for 5 min” (Practice) · “Watch groove demo twice” (Watch) · “Record full take with metronome” (Record).',
        },
      ],
    },
    resource_link: {
      id: 'block-resource-link',
      title: label,
      icon,
      blocks: [
        {
          type: 'p',
          text: 'A labeled external link — drumless tracks, Google Drive PDFs, Spotify, sheet music sites, or any URL. Opens outside the app in a new browser tab.',
        },
        {
          type: 'h3',
          text: 'What you edit (teacher)',
        },
        {
          type: 'ul',
          items: [
            'Block title — outline/student section label.',
            'Link label — clickable text (defaults to URL if empty).',
            'URL — full https:// address.',
            'Type — organizational label: General link, YouTube, Sheet music / PDF, Drumless track (does not change behavior, helps you categorize).',
          ],
        },
        {
          type: 'h3',
          text: 'What the student sees',
        },
        {
          type: 'p',
          text: 'Single link row with link icon + label. Tapping opens the URL in a new tab (rel=noreferrer). Empty URL hides the block content.',
        },
        {
          type: 'h3',
          text: 'Link block vs Video block',
        },
        {
          type: 'ul',
          items: [
            'Video block — inline player for YouTube/Vimeo/upload; keeps student in the lesson.',
            'Resource link — external navigation; use for drumless on Spotify, Drive folders, purchase links, etc.',
          ],
        },
        {
          type: 'tip',
          title: 'Example',
          text: 'Label: “Drumless track — Song Name” · URL: YouTube drumless · Type: Drumless track.',
        },
      ],
    },
  }

  return (
    pages[type] ?? {
      id: `block-${type}`,
      title: label,
      icon,
      blocks: [{ type: 'p', text: 'Documentation for this block type is coming soon.' }],
    }
  )
}

export const DEFAULT_HELP_PAGE_ID = 'welcome'

export function findHelpPage(pageId: string): HelpPage | undefined {
  for (const section of LESSON_BUILDER_HELP_SECTIONS) {
    const page = section.pages.find((p) => p.id === pageId)
    if (page) return page
  }
  return undefined
}

export function allHelpPages(): HelpPage[] {
  return LESSON_BUILDER_HELP_SECTIONS.flatMap((s) => s.pages)
}

function helpBlockToMarkdown(block: HelpBlock): string {
  switch (block.type) {
    case 'h3':
      return `#### ${block.text}\n`
    case 'p':
      return `${block.text}\n`
    case 'ul':
      return `${block.items.map((item) => `- ${item}`).join('\n')}\n`
    case 'ol':
      return `${block.items.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n`
    case 'tip':
      return block.title
        ? `> **${block.title}:** ${block.text}\n`
        : `> ${block.text}\n`
    case 'img':
      return block.caption
        ? `![${block.alt}](${block.src})\n*${block.caption}*\n`
        : `![${block.alt}](${block.src})\n`
    default:
      return ''
  }
}

/** Full help guide as markdown — for pasting into AI assistants. */
export function exportLessonBuilderHelpForAi(): string {
  const lines: string[] = [
    '# Play It Pro — Lesson Builder Guide',
    '',
    'Complete documentation for Mark’s lesson planning builder: workspace layout, Stack vs Bento canvas, floating block toolbar, rich text editor, all block types, student preview, student grid layout, assignments, session log, and student portal workflow.',
    '',
    'Generated from the in-app Lesson Builder Guide. Includes every help section and page.',
    '',
    'Screenshots are stored at /help/lesson-builder/*.png in the app. Regenerate with: npm run build && npm run capture:help-screenshots',
    '',
  ]

  for (const section of LESSON_BUILDER_HELP_SECTIONS) {
    lines.push(`## ${section.title}`, '')
    for (const page of section.pages) {
      lines.push(`### ${page.title}`, '')
      for (const block of page.blocks) {
        lines.push(helpBlockToMarkdown(block))
      }
      lines.push('')
    }
  }

  return lines.join('\n').trim()
}
