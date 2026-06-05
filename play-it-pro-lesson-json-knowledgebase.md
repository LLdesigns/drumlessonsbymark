# Play It Pro Lesson Builder JSON Knowledge Base

This document is the source of truth for how Play It Pro lessons are represented as import/export JSON. It defines the lesson schema, valid block types, block content schemas, canvas layout rules, checklist linking, import/export workflow, validation rules, and examples of valid lesson JSON. This file is intended to be used as Knowledge for a Custom GPT that converts lesson topics, lesson plans, objectives, outlines, or teacher notes into Play It Pro lesson JSON.

---

## Product Overview

Play It Pro is a drum education platform with a **lesson builder** where teachers (and admins) author structured lessons from modular **blocks**. Each lesson has metadata (title, category, skill level, goals, notes) and an ordered list of blocks that students interact with in the student portal.

Lessons can be authored manually in the builder or **imported from JSON**. Import applies lesson metadata and blocks to the builder canvas; the author reviews and saves to the database. **Export JSON** produces a portable file from an existing lesson for backup, editing, or round-trip refinement.

The platform supports two canvas layout modes:

| Mode | Description |
|------|-------------|
| `stack` | Blocks stack vertically in a single column |
| `bento` | Blocks placed on a 12-column grid with per-block `canvas_layout` |

Import JSON may specify `canvas_layout` on the lesson object. When using bento, each block should include a `canvas_layout` placement object.

**One JSON file = one lesson.** A multi-lesson course requires one JSON file per lesson.

---

## User Roles

| Role | Lesson builder access | JSON import / export |
|------|----------------------|----------------------|
| **Admin** | Full access | **Import JSON** and **Export JSON** buttons visible in the lesson builder header |
| **Teacher** | Full access | Not available — author manually or receive lessons imported by an admin |
| **Student** | View assigned lessons only | No builder access |

After an admin imports JSON, any teacher with access can review, edit, save, and assign the lesson to students.

---

## Lesson Builder Workflow

1. **Create or open** a lesson template in the lesson builder (`/studio/lesson-planning`).
2. **Set lesson metadata** in the inspector: title, category, skill level, duration, lesson goal, teacher notes, student instructions, practice assignment, tags.
3. **Add blocks** from the block palette (text, video, sequencer, etc.) or import from JSON (admin only).
4. **Arrange content** on the canvas — stack or bento layout; edit block content in the inspector.
5. **Preview** the student view before saving.
6. **Save** the lesson to persist blocks and metadata to the database.
7. **Assign** the lesson to students from the Students tab.

Blocks are stored with type-specific `content` JSON. In bento mode, `canvasLayout` is stored inside each block's `content` object on save.

---

## Import / Export Workflow

### Import (admin only)

1. Open the lesson builder (new or existing template).
2. Click **Import JSON** in the header.
3. Select a `.json` file conforming to schema version 1.
4. Confirm replacement if the lesson already has content.
5. Review imported metadata and blocks on the canvas.
6. Click **Save Lesson**.

The importer: validates JSON, generates new block UUIDs, normalizes text HTML and sequencer/notation content, resolves `linked_block_ref` on checklist items, and applies bento auto-layout when needed.

### Export (admin only)

1. Open a saved or in-progress lesson in the builder.
2. Click **Export JSON**.
3. A `.json` file downloads containing the current lesson state.

Export strips database IDs, converts checklist `linked_block_id` to `linked_block_ref`, and externalizes `canvas_layout` per block.

### Sample file

A reference example lives at:

`play-it-pro-platform/public/lesson-templates/sample-lesson-import.json`

---

## Lesson JSON Document Structure

### Root document

```json
{
  "version": 1,
  "lesson": { },
  "blocks": [ ]
}
```

| Root field | Type | Required | Notes |
|------------|------|----------|-------|
| `version` | integer | **Yes** | Must be `1` (not a string) |
| `lesson` | object | **Yes** | Lesson metadata |
| `blocks` | array | **Yes** | Ordered list of blocks; typical lessons have 6–12 blocks |
| `exported_at` | string | No | ISO timestamp; ignored on import |
| `_documentation` | string | No | Human notes; ignored on import |

---

## Lesson Object Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | **Yes** | Student-facing lesson title |
| `short_description` | string | No | Library card blurb, 1–2 sentences |
| `category` | string | No | See Valid Categories |
| `skill_level` | string | No | `beginner`, `intermediate`, or `advanced` |
| `estimated_duration_minutes` | number | No | Integer; typical range 20–60 |
| `lesson_goal` | string | No | Measurable learning outcome |
| `teacher_notes` | string | No | Instructor-only notes (pedagogy, substitutions) |
| `student_instructions` | string | No | Shown to student at lesson start |
| `practice_assignment` | string | No | Homework between sessions |
| `tags` | string[] | No | Search/filter tags |
| `canvas_layout` | string | No | `stack` or `bento` |

### Brief field mapping

When converting a lesson plan or outline into JSON, external brief fields map to lesson object fields as follows:

| Source material | JSON field |
|-----------------|------------|
| Title / lesson name | `lesson.title` |
| Description / summary | `lesson.short_description` |
| Learning objectives / outcomes | `lesson.lesson_goal` (also drives block selection) |
| Student instructions | `lesson.student_instructions` |
| Homework / between-session practice | `lesson.practice_assignment` |
| Teacher notes / pedagogy notes | `lesson.teacher_notes` |
| Skill level | `lesson.skill_level` |
| Topic area | `lesson.category` |
| Duration | `lesson.estimated_duration_minutes` |
| Keywords | `lesson.tags` |
| Prerequisites | `lesson.teacher_notes` + earlier scaffold blocks |

---

## Block System Overview

Each block in the `blocks` array represents one instructional unit on the lesson canvas.

### Block object schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ref` | string | Strongly recommended | Unique kebab-case identifier for checklist linking (e.g. `"intro"`, `"demo-video"`) |
| `block_type` | string | **Yes** | One of 10 valid types (see below) |
| `display_title` | string | No | Card title in builder and student view |
| `content` | object | No | Type-specific fields; defaults applied on import if omitted |
| `canvas_layout` | object | No | Bento grid placement |

### Valid block types

```
text
video
audio
sequencer
notation
notation_image
tempo
rudiment
checklist
resource_link
```

Do not use any other `block_type` value — import will reject unknown types.

### How the Lesson Builder Thinks About Blocks

Blocks are not decorative content cards. Each block type serves a distinct instructional role in the lesson:

| Block type | Instructional purpose |
|------------|----------------------|
| `text` | **Explains** — objectives, vocabulary, technique, posture, grip, reminders |
| `video` | **Models** — teacher demonstration, visual examples |
| `audio` | **Models / supports ear training** — play-alongs, reference tracks, audiation |
| `sequencer` | **Practice surface** — interactive drum grid for grooves, beats, fills, coordination |
| `notation` | **Develops reading** — traditional staff notation for rhythm or melodic content |
| `notation_image` | **References visual media** — charts, PDFs, sheet music images |
| `tempo` | **Scaffolds deliberate practice** — BPM goals and tempo ladders |
| `rudiment` | **Teaches stickings** — hand patterns and rudiment study |
| `checklist` | **Creates accountability** — student task flow and assessment evidence |
| `resource_link` | **Extends learning** — external articles, apps, PDFs, videos |

A well-designed lesson uses each block type only when its instructional purpose is needed. Avoid adding blocks without a clear role in the learning sequence.

### Recommended Lesson Arc

Most effective lessons follow this narrative order (adapt block types to the topic):

1. **Hook / objective** — `text` with `lesson-text-lead` stating the goal and relevance
2. **Model** — `video` and/or `audio` demonstration
3. **Explain** — `text` (callout, tip, steps) for technique, grip, posture
4. **Guided practice** — `sequencer`, `rudiment`, or `notation` with partial or simplified patterns
5. **Tempo scaffolding** — `tempo` block aligned to skill level
6. **Independent practice** — fuller `sequencer` or `notation`; optional `audio` play-along
7. **Assessment / reflection** — `checklist` with watch → practice → record chain
8. **Extension** (optional) — `resource_link`, advanced `text`, bonus `sequencer`

Skill-level adjustments:

- **Beginner** — more `text`, simpler `sequencer` (quarter/eighth, one measure), lower BPM, shorter checklist
- **Intermediate** — multi-measure `sequencer`, `tempo` ladder, `rudiment`, multi-step checklist
- **Advanced** — `notation`, complex `sequencer` (sixteenth notes, ghost notes), performance-oriented checklist

---

## Valid Categories

The `lesson.category` field must be one of:

```
Rudiments
Grooves
Fills
Songs
Technique
Reading Music
Timing / Metronome
Independence
Ear Training
Drum Setup
Performance Prep
```

If omitted on import, the platform defaults to `Grooves`.

---

## Block Types and Content Schemas

### `text`

Written explanation, objectives, technique notes.

```json
{
  "ref": "intro",
  "block_type": "text",
  "display_title": "Introduction",
  "content": {
    "body": "<p class=\"lesson-text-lead\">Objective text here.</p><p class=\"lesson-text-callout\">Key technique note.</p>"
  }
}
```

**Rich text CSS classes** (apply to `<p>` or `<ul>`):

| Class | Use for |
|-------|---------|
| `lesson-text-lead` | Opening hook / learning objective |
| `lesson-text-callout` | Critical technique or concept |
| `lesson-text-tip` | Optional helpful hint |
| `lesson-text-warning` | Common mistake to avoid |
| `lesson-text-practice` | Specific practice instruction |
| `lesson-text-highlight` | Inline span emphasis |
| `lesson-text-center` | Centered text |
| `lesson-text-steps` | On `<ul>` — procedural step list |

**Allowed HTML tags:** `p`, `h2`, `h5`, `strong`, `em`, `u`, `ul`, `ol`, `li`, `br`, `a` (https only).

Unsupported classes are stripped on import.

---

### `video`

Demonstrations and visual modeling. YouTube and Vimeo URLs auto-embed.

```json
{
  "ref": "demo-video",
  "block_type": "video",
  "display_title": "Watch: Demo groove",
  "content": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "title": "Demo at 80 BPM"
  }
}
```

The `source` field (`youtube`, `vimeo`, `link`) is inferred from the URL on import.

---

### `audio`

Play-along tracks and reference recordings for listening and audiation.

```json
{
  "ref": "playalong",
  "block_type": "audio",
  "display_title": "Play-along track",
  "content": {
    "url": "https://example.com/track.mp3",
    "title": "Rock beat play-along — 90 BPM"
  }
}
```

---

### `sequencer`

Interactive drum grid for grooves, beats, fills, and kit coordination patterns.

```json
{
  "ref": "groove-main",
  "block_type": "sequencer",
  "display_title": "Main groove",
  "content": {
    "beats_per_measure": 4,
    "steps_per_beat": 4,
    "playback_bpm": 80,
    "playback_loop": true,
    "playback_metronome": true,
    "playback_count_in": 1,
    "caption": "Kick on 1 & 3, snare on 2 & 4, eighth-note hats",
    "measures": [
      {
        "steps": [
          { "kick": true, "hihat": true },
          { "hihat": true },
          { "snare": true, "hihat": true },
          { "hihat": true }
        ]
      }
    ]
  }
}
```

| Field | Values |
|-------|--------|
| `beats_per_measure` | `3` or `4` |
| `steps_per_beat` | `2` (eighths) or `4` (sixteenths) |
| `playback_bpm` | 40–240 |
| `playback_count_in` | `0`, `1`, or `2` |

**Drum voice keys** in each step object: `kick`, `snare`, `hihat`, `ride`, `crash`, `tom`, `tom_14`, `tom_16`

**Hit values:** `true` (normal), `"accent"`, `"open"`, `"ghost"` (snare/hihat)

**Steps array length** must equal `beats_per_measure × steps_per_beat` (e.g. 4×4 = 16 steps per measure).

Measure `id` fields are optional — the platform generates them on import if missing.

Prefer `sequencer` for groove and kit-pattern lessons. Use `notation` when the learning goal is staff reading.

---

### `notation`

Traditional music notation for staff reading, rhythm reading, and melodic/instrument notation.

```json
{
  "ref": "reading-exercise",
  "block_type": "notation",
  "display_title": "Reading exercise",
  "content": {
    "title": "Quarter notes on snare",
    "instrument": "drums",
    "tempo": 72,
    "timeSignature": "4/4",
    "keySignature": "C",
    "caption": "Play each note with a relaxed rebound stroke",
    "notationData": {
      "version": 1,
      "tracks": [
        {
          "name": "Snare",
          "instrument": "drums",
          "clef": "percussion",
          "measures": [
            {
              "notes": [
                { "type": "note", "voice": "snare", "duration": "quarter", "startBeat": 1 },
                { "type": "note", "voice": "snare", "duration": "quarter", "startBeat": 2 },
                { "type": "note", "voice": "snare", "duration": "quarter", "startBeat": 3 },
                { "type": "note", "voice": "snare", "duration": "quarter", "startBeat": 4 }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

| Field | Allowed values |
|-------|----------------|
| `instrument` | `piano`, `guitar`, `bass`, `drums`, `voice` |
| `timeSignature` | `4/4`, `3/4`, `6/8` |
| `keySignature` | `C`, `G`, `D`, `A`, `E`, `F`, `Bb`, `Eb` |
| `duration` (notes) | `whole`, `half`, `quarter`, `eighth`, `sixteenth` |
| `pitch` (melodic) | `C4`, `D4`, `E4`, `F4`, `G4`, `A4`, `B4`, `C5` |
| `voice` (drums) | `kick`, `snare`, `hihat`, `tom`, `crash`, `ride` |

Track and measure IDs are optional — normalized on import.

---

### `notation_image`

PDFs, charts, sheet music screenshots, and uploaded worksheets referenced by URL.

```json
{
  "ref": "chart",
  "block_type": "notation_image",
  "display_title": "Groove chart",
  "content": {
    "url": "https://example.com/chart.png",
    "caption": "Figure 1: Rock beat variation"
  }
}
```

---

### `tempo`

BPM goals, metronome work, and deliberate practice tempo ladders.

```json
{
  "ref": "tempo-ladder",
  "block_type": "tempo",
  "display_title": "Tempo goals",
  "content": {
    "starting_bpm": 60,
    "target_bpm": 90,
    "minutes_per_step": 3,
    "notes": "Increase 5 BPM when you can play 4 clean bars without rushing."
  }
}
```

Align `starting_bpm` and `target_bpm` with `skill_level` and any related `sequencer.playback_bpm` values in the same lesson.

---

### `rudiment`

Stickings, hand patterns, and rudiment study.

```json
{
  "ref": "paradiddle-study",
  "block_type": "rudiment",
  "display_title": "Paradiddle",
  "content": {
    "name": "Single paradiddle",
    "sticking_pattern": "R L R R L R L L",
    "sticking_hands": ["R", "L", "R", "R", "L", "R", "L", "L"],
    "tempo_goal": 100,
    "notes": "Keep heights even; accent the first note of each four."
  }
}
```

**Hand values:** `R`, `L`, `K` (kick)

---

### `checklist`

Student assignments, practice flow, assessment tasks, and record tasks.

```json
{
  "ref": "practice-tasks",
  "block_type": "checklist",
  "display_title": "Your practice tasks",
  "content": {
    "instructions": "Complete in order. Check off each task as you go.",
    "items": [
      {
        "label": "Watch the demo video",
        "task_type": "watch",
        "linked_block_ref": "demo-video",
        "auto_complete": true
      },
      {
        "label": "Clap the rhythm before playing",
        "task_type": "practice",
        "linked_block_ref": "intro"
      },
      {
        "label": "Play the main groove at starting tempo",
        "task_type": "practice",
        "linked_block_ref": "groove-main",
        "auto_complete": true
      },
      {
        "label": "Record yourself at target tempo",
        "task_type": "record"
      }
    ]
  }
}
```

**`task_type` values:** `practice`, `watch`, `listen`, `record`, `read`, `custom`

See Checklist Linking Rules for `linked_block_ref` requirements.

---

### `resource_link`

Outside articles, PDFs, apps, videos, or other external references.

```json
{
  "ref": "resources",
  "block_type": "resource_link",
  "display_title": "Extra resources",
  "content": {
    "label": "Metronome app recommendation",
    "url": "https://example.com",
    "link_type": "link"
  }
}
```

**`link_type` examples:** `link`, `pdf`, `video`

---

## Canvas Layout System

Bento mode uses a **12-column grid**. Each block may include a `canvas_layout` object:

```json
{
  "gridCol": 1,
  "gridRow": 1,
  "colSpan": 12,
  "rowSpan": 1
}
```

| Field | Rules |
|-------|-------|
| `gridCol` | Column start, 1–12 (1-based) |
| `gridRow` | Row start, 1 or greater |
| `colSpan` | **Must be** `3`, `4`, `6`, `8`, or `12` only |
| `rowSpan` | Optional: `1` or `2` |

On import, `canvas_layout` on each block is merged into `content.canvasLayout` for bento lessons. Stack layout strips canvas layout data on save.

Set `"canvas_layout": "bento"` on the lesson object when using grid placements. Set `"canvas_layout": "stack"` for vertical-only layout.

**Layout constraints:**

- Do not place two blocks on overlapping grid cells.
- Increment `gridRow` for each new row.
- Prefer `colSpan: 12` for intro text and sequencers.
- Pair video (`colSpan: 8`, `gridCol: 1`) with tempo (`colSpan: 4`, `gridCol: 9`) on the same row when side-by-side.

---

## Checklist Linking Rules

Checklist items can reference other blocks in the same lesson via `linked_block_ref`.

| Rule | Detail |
|------|--------|
| Reference field | Use `linked_block_ref` in import JSON (not `linked_block_id`) |
| Must match | Value must exactly match another block's `ref` in the same document |
| Auto-complete | Set `auto_complete: true` for `watch`, `practice`, and `read` tasks tied to content blocks |
| No item IDs | Do not include `"id"` on checklist items — generated on import |
| Export behavior | Export converts `linked_block_id` back to `linked_block_ref` |

**Typical linked chain:** watch demo video → read technique notes → practice sequencer pattern → record performance.

Each block's `ref` should be unique, kebab-case, and semantically named (e.g. `"demo-video"`, `"groove-main"`, `"practice-tasks"`).

---

## Pedagogical Frameworks and Block Mapping

These frameworks describe how lesson design principles map to Play It Pro block types. They are reference documentation for authors and lesson-plan conversion — not platform enforcement rules.

### Backward design (Wiggins & McTighe)

Start from a measurable `lesson_goal` (what the student can **do** by the end). Align `practice_assignment`, checklist tasks, and tempo targets to that goal. Place enabling knowledge in `text` blocks; place performance evidence in `sequencer`, `rudiment`, `notation`, or `record` checklist items.

### Bloom's Taxonomy

| Level | Typical block usage |
|-------|---------------------|
| Remember | Vocabulary, stickings, note names — `text` (callout/tip), `rudiment` |
| Understand | Explain why a pattern works — `text` (lead/callout), demo `video` |
| Apply | Play patterns at tempo — `sequencer`, `rudiment`, `tempo` |
| Analyze | Compare grooves, identify differences — `text` + dual `sequencer` or `notation_image` |
| Evaluate | Self-assess timing/feel — `checklist` (record task), `text` (practice callout) |
| Create | Variations, fills, own groove — `sequencer`, `checklist` (custom tasks) |

Effective lessons typically escalate cognitive demand across the block sequence.

### Webb's Depth of Knowledge (DOK)

| DOK | Typical lesson character |
|-----|-------------------------|
| DOK 1 — Recall | Terminology focus — short `text`, simple `rudiment`, `read` checklist tasks |
| DOK 2 — Skills/Concepts | Execute a written groove — `sequencer`, `tempo`, `video` follow-along |
| DOK 3 — Strategic thinking | Adapt groove to context — `text` (warning/callout), multi-step `checklist` |
| DOK 4 — Extended thinking | Compose or perform extended material — multi-measure `sequencer`, `record` tasks, longer `practice_assignment` |

Document intended DOK level in `teacher_notes` when relevant.

### Music pedagogy frameworks

| Framework | Block mapping |
|-----------|---------------|
| **Gordon Music Learning Theory (audiation)** | `audio` or `video` before `notation`; `text` prompts to hear pulse before playing |
| **Kodály rhythm syllables** | `text` with ta, ti-ti, tika-tika; `checklist` "speak then play" tasks |
| **Orff-style layering** | Multiple `sequencer` blocks or measures adding one voice at a time; scaffold in `text` steps |
| **Deliberate practice** | `tempo` ladder with `starting_bpm` → `target_bpm`; rep counts in `practice_assignment` |
| **Whole-part-whole** | Block order: demo `video` (whole) → isolated `sequencer`/`rudiment` (part) → full `sequencer` + `record` (whole) |
| **UDL (Universal Design for Learning)** | Multiple representations (`video` + `notation_image` + `text`); multiple actions (`sequencer`, `audio`, `record`) |
| **SMART goals** | `lesson_goal` should be Specific, Measurable, Achievable, Relevant, Time-bound |

---

## Lesson Plan Conversion Guide

When converting a lesson plan, outline, objectives list, or teacher notes into Play It Pro JSON, map source content to block types as follows:

| Source content | Block type |
|----------------|------------|
| Concepts, explanations, vocabulary, posture, grip, technique reminders | `text` |
| Demonstrations, teacher modeling, visual examples | `video` |
| Listening, audiation, play-alongs, reference tracks | `audio` |
| Grooves, beats, fills, kit coordination, drum patterns | `sequencer` |
| Traditional staff reading, rhythm reading, melodic/instrument notation | `notation` |
| PDFs, charts, sheet music screenshots, uploaded worksheets | `notation_image` |
| BPM goals, metronome work, deliberate practice ladders | `tempo` |
| Stickings, hand patterns, rudiments | `rudiment` |
| Assignments, assessment, student practice flow, record tasks | `checklist` |
| Outside articles, PDFs, apps, videos, or references | `resource_link` |

### Conversion workflow

1. **Extract lesson metadata** — title, objectives → `lesson` object fields.
2. **Identify the lesson arc** — order blocks following the Recommended Lesson Arc.
3. **Assign a unique `ref`** to every block that checklist items will reference.
4. **Choose block types** using the mapping table above — one block per distinct instructional purpose.
5. **Set bento placements** when using `canvas_layout: "bento"`.
6. **Build the checklist last** — link each task to the relevant block `ref`.
7. **Validate** against Import Requirements before saving the file.

### Defaults when source material omits fields

| Field | Default |
|-------|---------|
| `skill_level` | Infer from objectives language; else `beginner` |
| `category` | Infer from topic; else `Technique` |
| `estimated_duration_minutes` | 25 (beginner), 40 (intermediate), 50 (advanced) |
| `canvas_layout` | `bento` |

---

## Bento Layout Patterns

Common placement patterns on the 12-column grid:

| Row purpose | Layout |
|-------------|--------|
| Title / intro | `colSpan: 12` |
| Video + tempo side-by-side | video: `gridCol: 1, colSpan: 8` + tempo: `gridCol: 9, colSpan: 4` |
| Full-width sequencer | `colSpan: 12` |
| Checklist + resource | checklist: `colSpan: 6` + resource: `colSpan: 6` |
| Two text columns | each `colSpan: 6` |

Increment `gridRow` for each new row. Verify no two blocks occupy overlapping cells.

---

## Validation Rules and Common Errors

### Import requirements

The import parser enforces the following. JSON that violates these rules will fail import or produce incorrect layout.

| Requirement | Rule |
|-------------|------|
| Version | Root `"version"` must be integer `1` |
| Lesson title | `lesson.title` is required and must be non-empty |
| Blocks array | `blocks` must be an array |
| Block types | Each `block_type` must be one of the 10 valid values |
| Block refs | Each block should have a unique `ref` |
| No database IDs | Do not include block UUIDs from exported database records |
| No checklist item IDs | Omit `"id"` on checklist items — generated on import |
| Checklist linking | `linked_block_ref` must match an existing block `ref` in the same file |
| Sequencer step count | Each measure's `steps.length` must equal `beats_per_measure × steps_per_beat` |
| Sequencer voices | Use only valid drum voice keys and hit values |
| Bento colSpan | Must be `3`, `4`, `6`, `8`, or `12` |
| Bento overlap | Blocks must not occupy overlapping grid cells |
| Rich text classes | Use only documented `lesson-text-*` classes in `text` block HTML |
| Skill level | If present: `beginner`, `intermediate`, or `advanced` |

### Common errors

| Error | Fix |
|-------|-----|
| Missing `version: 1` | Add integer version field at root |
| Missing `lesson.title` | Always include a non-empty title |
| Invalid `block_type` | Use only the 10 allowed types |
| Invalid `colSpan` | Use 3, 4, 6, 8, or 12 |
| Overlapping bento cells | Increment `gridRow` or adjust `colSpan` / `gridCol` |
| Broken `linked_block_ref` | Ensure value matches an existing block `ref` exactly |
| Wrong sequencer step count | Set `steps.length = beats_per_measure × steps_per_beat` |
| Unsupported HTML classes | Use only listed `lesson-text-*` classes |
| Invalid JSON syntax | Validate JSON parses before import |

---

## Complete Valid Example

```json
{
  "version": 1,
  "lesson": {
    "title": "First Rock Groove — Backbeat Foundations",
    "short_description": "Learn the essential rock beat: kick on 1 and 3, snare on 2 and 4.",
    "category": "Grooves",
    "skill_level": "beginner",
    "estimated_duration_minutes": 25,
    "lesson_goal": "Play a steady rock groove at 80 BPM for 4 consecutive bars with consistent timing.",
    "teacher_notes": "Bloom: Apply (perform groove). DOK 2. Whole-part-whole structure. Replace demo-video URL before assigning. Gordon MLT: student claps pulse before playing.",
    "student_instructions": "Watch the demo, follow the tempo ladder, and complete every practice task. Take your time — accuracy before speed.",
    "practice_assignment": "5 minutes daily at 70 BPM. When you can play 4 clean bars, move up 5 BPM. Goal: 80 BPM by next lesson.",
    "tags": ["rock", "groove", "beginner", "backbeat"],
    "canvas_layout": "bento"
  },
  "blocks": [
    {
      "ref": "intro",
      "block_type": "text",
      "display_title": "What you'll learn",
      "canvas_layout": { "gridCol": 1, "gridRow": 1, "colSpan": 12 },
      "content": {
        "body": "<p class=\"lesson-text-lead\">Today you'll play your first <strong>rock backbeat</strong> — the groove behind thousands of songs.</p><p class=\"lesson-text-callout\">Before you play: tap your foot on beats 1, 2, 3, 4. The kick and snare will lock to that pulse.</p>"
      }
    },
    {
      "ref": "demo-video",
      "block_type": "video",
      "display_title": "Demo: Rock groove",
      "canvas_layout": { "gridCol": 1, "gridRow": 2, "colSpan": 8 },
      "content": {
        "url": "https://www.youtube.com/watch?v=PLACEHOLDER",
        "title": "Rock groove at 80 BPM"
      }
    },
    {
      "ref": "tempo-ladder",
      "block_type": "tempo",
      "display_title": "Your tempo path",
      "canvas_layout": { "gridCol": 9, "gridRow": 2, "colSpan": 4 },
      "content": {
        "starting_bpm": 60,
        "target_bpm": 80,
        "minutes_per_step": 3,
        "notes": "Increase 5 BPM only when 4 bars feel easy and even."
      }
    },
    {
      "ref": "technique-notes",
      "block_type": "text",
      "display_title": "Technique checklist",
      "canvas_layout": { "gridCol": 1, "gridRow": 3, "colSpan": 12 },
      "content": {
        "body": "<ul class=\"lesson-text-steps\"><li>Matched grip — relaxed fingers, fulcrum between thumb and index</li><li>Kick: bury the beater slightly, don't lift the whole leg</li><li>Snare: rebound stroke — let the stick come back up</li><li>Hi-hat: loose half-open touch for a clean chick sound</li></ul>"
      }
    },
    {
      "ref": "groove-kick-snare",
      "block_type": "sequencer",
      "display_title": "Step 1: Kick and snare only",
      "canvas_layout": { "gridCol": 1, "gridRow": 4, "colSpan": 12 },
      "content": {
        "beats_per_measure": 4,
        "steps_per_beat": 4,
        "playback_bpm": 60,
        "caption": "Kick on 1 & 3, snare on 2 & 4 — no hi-hat yet",
        "measures": [
          {
            "steps": [
              { "kick": true }, {}, { "snare": true }, {},
              { "kick": true }, {}, { "snare": true }, {},
              {}, {}, {}, {},
              {}, {}, {}, {}
            ]
          }
        ]
      }
    },
    {
      "ref": "groove-full",
      "block_type": "sequencer",
      "display_title": "Step 2: Full groove with hi-hat",
      "canvas_layout": { "gridCol": 1, "gridRow": 5, "colSpan": 12 },
      "content": {
        "beats_per_measure": 4,
        "steps_per_beat": 4,
        "playback_bpm": 70,
        "caption": "Add eighth-note hi-hat on every &",
        "measures": [
          {
            "steps": [
              { "kick": true, "hihat": true }, { "hihat": true },
              { "snare": true, "hihat": true }, { "hihat": true },
              { "kick": true, "hihat": true }, { "hihat": true },
              { "snare": true, "hihat": true }, { "hihat": true },
              { "hihat": true }, { "hihat": true }, { "hihat": true }, { "hihat": true },
              { "hihat": true }, { "hihat": true }, { "hihat": true }, { "hihat": true }
            ]
          }
        ]
      }
    },
    {
      "ref": "practice-tasks",
      "block_type": "checklist",
      "display_title": "Practice tasks",
      "canvas_layout": { "gridCol": 1, "gridRow": 6, "colSpan": 6 },
      "content": {
        "instructions": "Work through each task in order.",
        "items": [
          {
            "label": "Watch the demo video",
            "task_type": "watch",
            "linked_block_ref": "demo-video",
            "auto_complete": true
          },
          {
            "label": "Read the technique checklist",
            "task_type": "read",
            "linked_block_ref": "technique-notes",
            "auto_complete": true
          },
          {
            "label": "Play kick + snare pattern at 60 BPM",
            "task_type": "practice",
            "linked_block_ref": "groove-kick-snare",
            "auto_complete": true
          },
          {
            "label": "Play the full groove at 70 BPM",
            "task_type": "practice",
            "linked_block_ref": "groove-full",
            "auto_complete": true
          },
          {
            "label": "Record yourself at 80 BPM",
            "task_type": "record"
          }
        ]
      }
    },
    {
      "ref": "next-steps",
      "block_type": "resource_link",
      "display_title": "Keep learning",
      "canvas_layout": { "gridCol": 7, "gridRow": 6, "colSpan": 6 },
      "content": {
        "label": "Next lesson: Hi-hat openings and accents",
        "url": "https://example.com/next-lesson",
        "link_type": "link"
      }
    }
  ]
}
```

---

## Import Workflow Notes

- Import is available only to **admin** users in the lesson builder header.
- Import **replaces** the current lesson title, metadata, and all blocks (after user confirmation if content exists).
- The user must click **Save Lesson** after import to persist to the database.
- On import, the platform:
  - Parses and validates JSON
  - Generates new UUIDs for all blocks
  - Normalizes rich text HTML in `text` blocks
  - Normalizes `sequencer` and `notation` content (including measure/note IDs)
  - Resolves `linked_block_ref` → `linked_block_id` on checklist items
  - Applies bento auto-layout when blocks lack placement data
  - Sets canvas view mode from `lesson.canvas_layout`
- Placeholder video URLs (e.g. `PLACEHOLDER`) should be noted in `teacher_notes` for replacement before assigning to students.

---

## Export / Round Trip Notes

- Export is available only to **admin** users.
- Export produces schema version 1 JSON from the current builder state (saved or unsaved).
- Export behavior:
  - Includes all lesson metadata fields
  - Assigns sequential `ref` values (`block-0`, `block-1`, …) unless preserving semantic refs from import
  - Moves `canvasLayout` from block content to top-level `canvas_layout` on each block
  - Converts checklist `linked_block_id` to `linked_block_ref`
  - Omits block database IDs and checklist item IDs
  - Adds optional `exported_at` timestamp and `_documentation` string
- **Round-trip workflow:** Export an existing lesson → edit JSON externally → re-import → review → save.
- Exported files can serve as templates for new lesson authoring.

---

## Appendix: Optional Custom GPT Setup Notes

This appendix is optional configuration guidance for setting up a Custom GPT. It is not part of the core schema documentation.

| Setting | Suggested value |
|---------|-----------------|
| Name | Play It Pro Lesson Architect |
| Description | Converts lesson plans and objectives into import-ready Play It Pro lesson JSON |
| Instructions | Separate from this Knowledge file — define LLM behavior, output format, and interaction rules in the GPT Instructions field |
| Knowledge | Upload this document |
| Capabilities | Web browsing optional; image generation not required |

**Suggested conversation starters:**

1. "Generate import JSON from my lesson brief (I'll paste the fields below)"
2. "Turn these learning objectives into a complete Play It Pro lesson"
3. "Here's my lesson description — output raw JSON only"
4. "Refine the JSON you just generated: [changes]"

---

This Knowledge file defines what Play It Pro lessons can contain. The Custom GPT Instructions define how the LLM should behave when generating or reviewing lesson JSON.
