'use client'

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser, Undo2 } from 'lucide-react'

type Point = { x: number; y: number }

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  exportPng: () => Promise<Blob | null>
}

interface SignaturePadProps {
  onChange?: (isEmpty: boolean) => void
  height?: number
  penColor?: string
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ onChange, height = 200, penColor = '#1e293b' }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDrawing = useRef(false)
    const currentStroke = useRef<Point[]>([])
    const strokes = useRef<Point[][]>([])
    const [isEmpty, setIsEmpty] = useState(true)
    const dpr = useRef(1)

    const drawBaseline = useCallback((ctx: CanvasRenderingContext2D, width: number, h: number) => {
      ctx.save()
      ctx.strokeStyle = '#cbd5e1'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      const y = h - 32
      ctx.moveTo(24, y)
      ctx.lineTo(width - 24, y)
      ctx.stroke()
      ctx.restore()
    }, [])

    const redrawAll = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      const width = canvas.width / dpr.current
      const h = canvas.height / dpr.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBaseline(ctx, width, h)

      ctx.strokeStyle = penColor
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (const stroke of strokes.current) {
        if (stroke.length < 2) {
          if (stroke.length === 1) {
            ctx.beginPath()
            ctx.arc(stroke[0].x, stroke[0].y, 1.25, 0, Math.PI * 2)
            ctx.fillStyle = penColor
            ctx.fill()
          }
          continue
        }
        ctx.beginPath()
        ctx.moveTo(stroke[0].x, stroke[0].y)
        for (let i = 1; i < stroke.length - 1; i++) {
          const mid = { x: (stroke[i].x + stroke[i + 1].x) / 2, y: (stroke[i].y + stroke[i + 1].y) / 2 }
          ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mid.x, mid.y)
        }
        ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y)
        ctx.stroke()
      }
    }, [drawBaseline, penColor])

    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      const width = container.clientWidth
      dpr.current = window.devicePixelRatio || 1
      canvas.width = width * dpr.current
      canvas.height = height * dpr.current
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr.current, dpr.current)
      redrawAll()
    }, [height, redrawAll])

    useEffect(() => {
      setupCanvas()
      const handleResize = () => setupCanvas()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function getPos(e: React.PointerEvent<HTMLCanvasElement>): Point {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.setPointerCapture(e.pointerId)
      isDrawing.current = true
      currentStroke.current = [getPos(e)]
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!isDrawing.current) return
      e.preventDefault()
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      const pos = getPos(e)
      currentStroke.current.push(pos)
      const pts = currentStroke.current
      const len = pts.length
      if (len < 3) return

      ctx.strokeStyle = penColor
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const p0 = pts[len - 3]
      const p1 = pts[len - 2]
      const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }
      ctx.beginPath()
      ctx.moveTo(mid.x, mid.y)
      ctx.quadraticCurveTo(p1.x, p1.y, pos.x, pos.y)
      ctx.stroke()
    }

    function finishStroke() {
      if (!isDrawing.current) return
      isDrawing.current = false
      if (currentStroke.current.length > 0) {
        strokes.current.push(currentStroke.current)
        currentStroke.current = []
        setIsEmpty(false)
        onChange?.(false)
      }
    }

    function handleUndo() {
      strokes.current.pop()
      redrawAll()
      const empty = strokes.current.length === 0
      setIsEmpty(empty)
      onChange?.(empty)
    }

    function handleClear() {
      strokes.current = []
      currentStroke.current = []
      redrawAll()
      setIsEmpty(true)
      onChange?.(true)
    }

    useImperativeHandle(ref, () => ({
      clear: handleClear,
      isEmpty: () => strokes.current.length === 0,
      exportPng: () =>
        new Promise((resolve) => {
          const canvas = canvasRef.current
          if (!canvas || strokes.current.length === 0) {
            resolve(null)
            return
          }
          // Export without the dashed baseline guide
          const exportCanvas = document.createElement('canvas')
          exportCanvas.width = canvas.width
          exportCanvas.height = canvas.height
          const exportCtx = exportCanvas.getContext('2d')
          if (!exportCtx) {
            resolve(null)
            return
          }
          exportCtx.scale(dpr.current, dpr.current)
          exportCtx.strokeStyle = penColor
          exportCtx.lineWidth = 2.5
          exportCtx.lineCap = 'round'
          exportCtx.lineJoin = 'round'
          for (const stroke of strokes.current) {
            if (stroke.length < 2) continue
            exportCtx.beginPath()
            exportCtx.moveTo(stroke[0].x, stroke[0].y)
            for (let i = 1; i < stroke.length - 1; i++) {
              const m = { x: (stroke[i].x + stroke[i + 1].x) / 2, y: (stroke[i].y + stroke[i + 1].y) / 2 }
              exportCtx.quadraticCurveTo(stroke[i].x, stroke[i].y, m.x, m.y)
            }
            exportCtx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y)
            exportCtx.stroke()
          }
          exportCanvas.toBlob((blob) => resolve(blob), 'image/png')
        }),
    }))

    return (
      <div className="space-y-3">
        <div ref={containerRef} className="w-full">
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl border-2 border-slate-200 bg-white touch-none cursor-crosshair shadow-sm"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerLeave={finishStroke}
            onPointerCancel={finishStroke}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Sign above the line using your mouse, trackpad, or touchscreen</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={isEmpty}
              className="h-8"
            >
              <Undo2 className="w-3.5 h-3.5 mr-1.5" />
              Undo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isEmpty}
              className="h-8"
            >
              <Eraser className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    )
  }
)
