import { useCallback, useEffect, useRef, useState, type RefObject, type PointerEvent as RPointerEvent } from 'react'
import { useStore, type DropTarget } from '@/data/store'

/* =====================================================================
   Drag to reorder (canvas and layer lists share this) — Blueprint B1:
   ghost of the dragged block · drop line · auto-scroll near edges · dropping on a locked spot
   explains why and where it can go instead. The rule comes from data attributes rendered from the
   page's lock data (data-role / data-zone / data-reason), not from per-page code (D3).
   ===================================================================== */

export interface Gap { target: DropTarget | null; zoneLabel?: string; reason?: string; allowed?: string; same?: boolean }
interface DragState { id: string; label: string; x: number; y: number; gap: Gap | null; line: { top: number; left: number; width: number } | null }

const zoneName = (z?: string) => z === 'top' ? 'ช่องบน' : z === 'bottom' ? 'ช่องล่าง' : 'เนื้อหาของหน้า'

export function resolveGap(root: HTMLElement, y: number, dragId: string, allowed: string): { gap: Gap; line: DragState['line'] } {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-block]'))
  const rootRect = root.getBoundingClientRect()
  let nextI = els.findIndex(el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 > y })
  if (nextI === -1) nextI = els.length
  const prev = els[nextI - 1], next = els[nextI]
  const insertable = (el?: HTMLElement) => !!el && (el.dataset.role === 'free' || el.dataset.empty === '1')
  const lineTop = next ? next.getBoundingClientRect().top : prev ? prev.getBoundingClientRect().bottom : rootRect.top
  const line = { top: lineTop, left: rootRect.left, width: rootRect.width }
  let gap: Gap
  if (insertable(next)) gap = { target: { zone: next!.dataset.zone!, index: next!.dataset.empty === '1' ? 0 : Number(next!.dataset.index) }, zoneLabel: zoneName(next!.dataset.zone) }
  else if (insertable(prev)) gap = { target: { zone: prev!.dataset.zone!, index: prev!.dataset.empty === '1' ? 0 : Number(prev!.dataset.index) + 1 }, zoneLabel: zoneName(prev!.dataset.zone) }
  else gap = { target: null, reason: next?.dataset.closed ? next.dataset.reason : (next?.dataset.reason || prev?.dataset.reason || 'นอกพื้นที่ของหน้า'), allowed }
  if (gap.target && (next?.dataset.id === dragId || prev?.dataset.id === dragId)) { gap.same = true; gap.zoneLabel = 'ตำแหน่งเดิม' }
  return { gap, line }
}

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  let p = el?.parentElement ?? null
  while (p) { const o = getComputedStyle(p).overflowY; if (o === 'auto' || o === 'scroll') return p; p = p.parentElement }
  return null
}

export function useDrag(rootRef: RefObject<HTMLElement | null>, _selector: string, allowed = 'ช่องสีฟ้า / ระหว่าง Section ที่แก้ได้อิสระ') {
  const [state, setState] = useState<DragState | null>(null)
  const cleanup = useRef<() => void>(() => {})
  useEffect(() => () => cleanup.current(), [])

  const start = useCallback((e: RPointerEvent, id: string, label: string) => {
    e.preventDefault(); e.stopPropagation()
    cleanup.current()
    const pos = { x: e.clientX, y: e.clientY }
    let cur: DragState = { id, label, x: pos.x, y: pos.y, gap: null, line: null }
    let raf = 0
    useStore.getState().select(id)
    document.body.style.cursor = 'grabbing'
    const update = () => {
      const root = rootRef.current; if (!root) return
      const { gap, line } = resolveGap(root, pos.y, id, allowed)
      cur = { ...cur, x: pos.x, y: pos.y, gap, line }
      setState(cur)
    }
    const tick = () => {
      const sp = scrollParent(rootRef.current)
      if (sp) { const r = sp.getBoundingClientRect(); if (pos.y < r.top + 48) { sp.scrollTop -= 10; update() } else if (pos.y > r.bottom - 48) { sp.scrollTop += 10; update() } }
      raf = requestAnimationFrame(tick)
    }
    const move = (ev: PointerEvent) => { pos.x = ev.clientX; pos.y = ev.clientY; update() }
    const finish = (commit: boolean) => {
      cleanup.current()
      if (!commit) return
      const st = useStore.getState()
      if (cur.gap?.target) { if (!cur.gap.same) st.move(id, cur.gap.target) }
      else if (cur.gap) st.showToast(`วางตรงนี้ไม่ได้ — ${cur.gap.reason ?? 'นอกพื้นที่ของหน้า'} · วางได้ที่ ${allowed}`)
    }
    const up = (ev: PointerEvent) => { pos.x = ev.clientX; pos.y = ev.clientY; update(); finish(true) }
    const key = (ev: KeyboardEvent) => { if (ev.key === 'Escape') finish(false) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('keydown', key)
    raf = requestAnimationFrame(tick)
    cleanup.current = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('keydown', key)
      document.body.style.cursor = ''
      setState(null)
      cleanup.current = () => {}
    }
    update()
  }, [rootRef, allowed])

  return { state, start }
}
