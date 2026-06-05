-- Allow the new interactive notation block type alongside existing blocks

ALTER TABLE lesson_template_blocks
  DROP CONSTRAINT IF EXISTS lesson_template_blocks_block_type_check;

ALTER TABLE lesson_template_blocks
  ADD CONSTRAINT lesson_template_blocks_block_type_check
  CHECK (block_type IN (
    'text', 'notation_image', 'notation', 'video', 'audio', 'tempo', 'rudiment', 'checklist', 'resource_link'
  ));

ALTER TABLE assigned_lesson_blocks
  DROP CONSTRAINT IF EXISTS assigned_lesson_blocks_block_type_check;

ALTER TABLE assigned_lesson_blocks
  ADD CONSTRAINT assigned_lesson_blocks_block_type_check
  CHECK (block_type IN (
    'text', 'notation_image', 'notation', 'video', 'audio', 'tempo', 'rudiment', 'checklist', 'resource_link'
  ));
