import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { EPISODES } from '../../content'

function TitleCard({ ep, index }) {
    const mx = useMotionValue(0.5)
    const my = useMotionValue(0.5)
    const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 20 })
    const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 200, damping: 20 })
    const glare = useTransform([mx, my], ([x, y]) =>
        `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.16), transparent 55%)`)

    const move = (e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width)
        my.set((e.clientY - r.top) / r.height)
    }
    const leave = () => { mx.set(0.5); my.set(0.5) }

    return (
        <motion.a
            className="episode"
            href={ep.url}
            target="_blank"
            rel="noopener noreferrer"
            onPointerMove={move}
            onPointerLeave={leave}
            style={{ rotateX: rx, rotateY: ry }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.45 + index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
        >
            <div className="episode__frame">
                <span className="episode__num" aria-hidden="true">{ep.number}</span>
                <span className="episode__label">Episode {ep.number}</span>
                <span className="episode__jp" lang="ja">{ep.jp}</span>
                <h3 className="episode__title">{ep.title}</h3>
                <motion.span className="episode__glare" style={{ background: glare }} aria-hidden="true" />
            </div>
            <div className="episode__meta">
                {ep.desc && <p>{ep.desc}</p>}
                <div className="episode__foot">
                    <span className="episode__tags">{ep.tags.join(' · ')}</span>
                    <span className="episode__year">{ep.year}</span>
                </div>
            </div>
        </motion.a>
    )
}

export function Episodes() {
    return (
        <div className="episodes">
            {EPISODES.map((ep, i) => <TitleCard key={ep.number} ep={ep} index={i} />)}
        </div>
    )
}
