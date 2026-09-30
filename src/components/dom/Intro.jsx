import { motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { useEffect } from 'react'
import { XYZ } from './Chalk'

const ease = [0.77, 0, 0.18, 1]

export function Intro({ onEnter }) {
    const { progress, total } = useProgress()
    const ready = total > 0 && progress >= 100

    useEffect(() => {
        if (!ready) return
        const onKey = (e) => e.key === 'Enter' && onEnter(true)
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [ready, onEnter])

    return (
        <motion.div className="intro" initial="shown" animate="shown" exit="gone">
            <motion.div className="intro__shutter intro__shutter--top"
                variants={{ shown: { y: 0 }, gone: { y: '-100%', transition: { duration: 1.1, ease, delay: 0.25 } } }} />
            <motion.div className="intro__shutter intro__shutter--bottom"
                variants={{ shown: { y: 0 }, gone: { y: '100%', transition: { duration: 1.1, ease, delay: 0.25 } } }} />

            <motion.div className="intro__content"
                variants={{ shown: { opacity: 1, scale: 1 }, gone: { opacity: 0, scale: 1.04, transition: { duration: 0.35 } } }}>
                <motion.div className="board board--intro"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
                    <div className="board__plate">
                        <span lang="ja">伝言板</span>
                    </div>
                    <div className="board__slate">
                        <XYZ className="board__xyz" delay={0.6} />
                    </div>
                </motion.div>

                <motion.div className="intro__actions"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.6 }}>
                    <button className="btn btn--primary" disabled={!ready} onClick={() => onEnter(true)}>
                        {ready ? <>Enter <span className="btn__meta">with sound ♪</span></> : <>Loading <span className="btn__meta">{Math.round(progress)}%</span></>}
                    </button>
                    <button className="btn btn--ghost" disabled={!ready} onClick={() => onEnter(false)}>
                        Enter quietly
                    </button>
                </motion.div>
            </motion.div>
        </motion.div>
    )
}
