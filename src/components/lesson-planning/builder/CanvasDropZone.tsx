interface CanvasDropZoneProps {
  index: number
  active: boolean
  visible: boolean
  onDragEnter: (index: number) => void
  onDragOver: (event: React.DragEvent, index: number) => void
  onDrop: (event: React.DragEvent, index: number) => void
  onDragLeave?: () => void
}

export default function CanvasDropZone({
  index,
  active,
  visible,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragLeave,
}: CanvasDropZoneProps) {
  return (
    <div
      className={`canvas-drop-zone${active ? ' canvas-drop-zone--active' : ''}${visible ? ' canvas-drop-zone--visible' : ''}`}
      onDragEnter={(e) => {
        e.preventDefault()
        onDragEnter(index)
      }}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragLeave={onDragLeave}
      aria-hidden={!visible && !active}
    >
      <span className="canvas-drop-zone__line" />
      {active ? <span className="canvas-drop-zone__label">Drop here</span> : null}
    </div>
  )
}
