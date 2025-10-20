// @ts-nocheck
import React, { useEffect, useRef } from 'react'

type Props = {
  state?: any
  onChange?: (gs: any) => void
}

const PixiBoard: React.FC<Props> = ({ state, onChange }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // DUELLY: placeholder board while Pixi v7 migration completes.
    // Keeps app rendering & navigation working without TS syntax errors.
    return () => {}
  }, [])

  return (
    <div
      ref={ref}
      id="pixi-board-placeholder"
      className="bg-surface/60 text-fg"
      style={{ width: '100%', height: '100%', minHeight: 240 }}
      aria-label="Backgammon board (placeholder)"
    />
  )
}

export default PixiBoard
