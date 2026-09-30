import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const ease = [0.77, 0, 0.18, 1]

export function Panel({ title, jp, onClose, children }) {
    const closeRef = useRef()
    useEffect(() => closeRef.current?.focus({ preventScroll: true }), [])

    return (
        <motion.section className="panel" role="dialog" aria-label={title} initial="in" animate="shown" exit="out">
            {/* A red slash crosses the frame, and the content is revealed in its wake. */}
            <motion.div className="panel__slash" aria-hidden="true"
                variants={{
                    in: { x: '-130%', opacity: 1 },
                    shown: { x: '230%', opacity: 0, transition: { duration: 0.8, ease, opacity: { delay: 0.7, duration: 0.1 } } },
                    out: { opacity: 0 },
                }} />
            <motion.div className="panel__inner"
                variants={{
                    in: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
                    shown: { opacity: 1, clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.6, ease, delay: 0.18 } },
                    out: { opacity: 0, x: -30, transition: { duration: 0.25 } },
                }}>
                <header className="panel__head">
                    <div>
                        <span className="panel__jp" lang="ja">{jp}</span>
                        <h2 className="panel__title">{title}</h2>
                    </div>
                    <button ref={closeRef} className="btn btn--ghost btn--sm" onClick={onClose}>
                        Return <kbd>esc</kbd>
                    </button>
                </header>
                <div className="panel__body">{children}</div>
            </motion.div>
        </motion.section>
    )
}
