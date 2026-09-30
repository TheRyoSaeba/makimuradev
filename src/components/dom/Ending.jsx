import { motion } from 'framer-motion'
import { SITE } from '../../content'

const CREDITS = [
    ['Personal site of', SITE.name + SITE.tld],
    ['Code', SITE.handle],
    ['Homage to', 'City Hunter — Tsukasa Hojo'],
    ['', 'Fan site. Not affiliated.'],
]

const ease = [0.77, 0, 0.18, 1]

// The show's signature: the last frame freezes and the ending song kicks in.
export function Ending({ onClose }) {
    return (
        <motion.div className="ending" onClick={onClose} initial="in" animate="shown" exit="out">
            <motion.div className="ending__bar ending__bar--top"
                variants={{ in: { y: '-100%' }, shown: { y: 0, transition: { duration: 0.9, ease } }, out: { y: '-100%', transition: { duration: 0.6, ease } } }} />
            <motion.div className="ending__bar ending__bar--bottom"
                variants={{ in: { y: '100%' }, shown: { y: 0, transition: { duration: 0.9, ease } }, out: { y: '100%', transition: { duration: 0.6, ease } } }} />
            <motion.div className="ending__flash" aria-hidden="true"
                variants={{ in: { opacity: 0.85 }, shown: { opacity: 0, transition: { duration: 0.5 } }, out: { opacity: 0 } }} />

            <motion.div className="ending__roll"
                variants={{ in: { opacity: 0 }, shown: { opacity: 1, transition: { delay: 1.2, duration: 1 } }, out: { opacity: 0, transition: { duration: 0.3 } } }}>
                <div className="ending__track">
                    {CREDITS.map(([role, name], i) => (
                        <div key={i} className="credit">
                            {role && <span className="credit__role">{role}</span>}
                            <span className="credit__name">{name}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.p className="ending__tbc"
                variants={{ in: { opacity: 0, x: 40 }, shown: { opacity: 1, x: 0, transition: { delay: 2.2, duration: 0.8 } }, out: { opacity: 0 } }}>
                To be continued<span>…</span>
            </motion.p>
            <motion.p className="ending__exit"
                variants={{ in: { opacity: 0 }, shown: { opacity: 1, transition: { delay: 3 } }, out: { opacity: 0 } }}>
                click or <kbd>esc</kbd> to return
            </motion.p>
        </motion.div>
    )
}
