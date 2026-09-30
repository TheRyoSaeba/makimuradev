import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

// Manga focus lines (集中線) that burst from the click point on selection.
function Burst({ x, y }) {
    const lines = useMemo(() => {
        const out = []
        const R = Math.hypot(window.innerWidth, window.innerHeight)
        for (let i = 0; i < 90; i++) {
            const a = (i / 90) * Math.PI * 2 + (Math.random() - 0.5) * 0.05
            const inner = 90 + Math.random() * 160
            const w = 0.004 + Math.random() * 0.012
            const p = (r, da) => `${x + Math.cos(a + da) * r},${y + Math.sin(a + da) * r}`
            out.push(`M${p(inner, 0)} L${p(R, -w)} L${p(R, w)} Z`)
        }
        return out.join(' ')
    }, [x, y])

    return (
        <motion.svg className="speedlines" width="100%" height="100%" aria-hidden="true"
            initial={{ opacity: 0, scale: 1.25 }} animate={{ opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 0.55, times: [0, 0.2, 1], ease: 'easeOut' }}
            style={{ transformOrigin: `${x}px ${y}px` }}>
            <path d={lines} fill="#fff" />
        </motion.svg>
    )
}

export function SpeedLines({ burst }) {
    const [live, setLive] = useState(null)
    useEffect(() => {
        if (!burst) return
        setLive(burst)
        const t = setTimeout(() => setLive(null), 600)
        return () => clearTimeout(t)
    }, [burst])
    return <AnimatePresence>{live && <Burst key={live.id} x={live.x} y={live.y} />}</AnimatePresence>
}
