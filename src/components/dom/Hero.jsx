import { motion } from 'framer-motion'
import { SITE } from '../../content'

const rise = (delay) => ({
    initial: { opacity: 0, y: 30, skewX: -8 },
    animate: { opacity: 1, y: 0, skewX: -8, transition: { delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: 16, transition: { duration: 0.25 } },
})

export function Hero({ hovered, go }) {
    return (
        <section className="hero" aria-label="Title">
            <h1 className="title">
                <motion.span className="title__main" data-text={SITE.name} {...rise(0.7)}>{SITE.name}</motion.span>
                <motion.span className="title__tld" {...rise(0.9)}>{SITE.tld}</motion.span>
            </h1>
            <motion.div className="hero__cast" initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 1.5, duration: 0.7 } }} exit={{ opacity: 0 }}>
                <button className={`cast cast--man ${hovered === 'man' ? 'is-on' : ''}`} onClick={() => go('projects')}>
                    <i />Ryo <span>→ Episodes</span>
                </button>
                <button className={`cast cast--woman ${hovered === 'woman' ? 'is-on' : ''}`} onClick={() => go('about')}>
                    <i />Kaori <span>→ Profile</span>
                </button>
            </motion.div>
        </section>
    )
}
