import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { XYZ } from './Chalk'
import { BOARD_LINKS } from '../../content'

// A chalk stroke is a spray of tiny, slightly transparent flecks laid along
// the path — cheap to draw and reads far more like chalk than a clean line.
function chalkSegment(ctx, x0, y0, x1, y1, dpr) {
    const len = Math.hypot(x1 - x0, y1 - y0)
    const steps = Math.max(1, Math.ceil(len / (1.2 * dpr)))
    const r = 2.6 * dpr
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = x0 + (x1 - x0) * t
        const y = y0 + (y1 - y0) * t
        for (let k = 0; k < 5; k++) {
            ctx.globalAlpha = 0.18 + Math.random() * 0.35
            const s = (0.6 + Math.random() * 1.1) * dpr
            ctx.fillRect(x + (Math.random() - 0.5) * r * 2, y + (Math.random() - 0.5) * r * 2, s, s)
        }
    }
}

function Slate({ children }) {
    const canvas = useRef()
    const last = useRef(null)
    const [dirty, setDirty] = useState(false)

    const fit = useCallback(() => {
        const c = canvas.current
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const { width, height } = c.getBoundingClientRect()
        c.width = Math.round(width * dpr)
        c.height = Math.round(height * dpr)
        setDirty(false)
    }, [])

    useEffect(() => {
        fit()
        window.addEventListener('resize', fit)
        return () => window.removeEventListener('resize', fit)
    }, [fit])

    const point = (e) => {
        const r = canvas.current.getBoundingClientRect()
        const dpr = canvas.current.width / r.width
        return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr, dpr]
    }

    const down = (e) => {
        canvas.current.setPointerCapture(e.pointerId)
        last.current = point(e)
    }
    const move = (e) => {
        if (!last.current) return
        const [x, y, dpr] = point(e)
        const ctx = canvas.current.getContext('2d')
        ctx.fillStyle = '#eef0e6'
        chalkSegment(ctx, last.current[0], last.current[1], x, y, dpr)
        last.current = [x, y]
        if (!dirty) setDirty(true)
    }
    const up = () => (last.current = null)

    const erase = () => {
        const c = canvas.current
        c.getContext('2d').clearRect(0, 0, c.width, c.height)
        setDirty(false)
    }

    return (
        <>
            <div className="board__slate">
                {children}
                <canvas ref={canvas} className="board__canvas" aria-label="Chalkboard — draw with your pointer"
                    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
            </div>
            <div className="board__tray">
                <span className="board__chalk" aria-hidden="true" />
                <span className="board__hint" />
                <button className="board__eraser" onClick={erase} disabled={!dirty}>Erase</button>
            </div>
        </>
    )
}

export function MessageBoard() {
    return (
        <div className="xyz">
            <motion.div className="board board--full" initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}>
                <div className="board__plate">
                    <span lang="ja">伝言板</span>
                </div>
                <Slate>
                    <XYZ className="board__xyz board__xyz--corner" delay={0.9} speed={0.8} />
                    <ul className="board__links">
                        {BOARD_LINKS.map((l) => (
                            <li key={l.href}>
                                <a className="chalk-text" href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>
                            </li>
                        ))}
                    </ul>
                </Slate>
            </motion.div>
        </div>
    )
}
