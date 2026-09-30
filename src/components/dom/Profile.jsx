import { motion } from 'framer-motion'
import { PROFILE, SITE } from '../../content'
import { asset } from '../../asset'

const item = (i) => ({
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0, transition: { delay: 0.5 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
})

export function Profile({ go }) {
    return (
        <div className="dossier">
            <motion.figure className="dossier__photo" initial={{ opacity: 0, rotate: -6, y: 30 }}
                animate={{ opacity: 1, rotate: -2.5, y: 0, transition: { delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}>
                <div className="dossier__print">
                    <img src={asset('images/woman.png')} alt="" draggable="false" />
                </div>
                <figcaption>{SITE.kanji} — file {PROFILE.file}</figcaption>
                <span className="dossier__clip" aria-hidden="true" />
            </motion.figure>

            <div className="dossier__sheet">
                <motion.div className="dossier__stamp" aria-hidden="true"
                    initial={{ opacity: 0, scale: 2.2, rotate: -18 }}
                    animate={{ opacity: 0.9, scale: 1, rotate: -12, transition: { delay: 1.1, type: 'spring', stiffness: 400, damping: 18 } }}>
                    <span lang="ja">極秘</span>Confidential
                </motion.div>

                <motion.p className="dossier__case" {...item(0)}>Case file No. {PROFILE.file}</motion.p>
                <motion.h3 className="dossier__name" {...item(1)}>{SITE.name}<span>{SITE.tld}</span></motion.h3>
                <motion.p className="dossier__summary" {...item(2)}>{PROFILE.summary}</motion.p>

                <dl className="dossier__fields">
                    {PROFILE.fields.map(([k, v, to], i) => (
                        <motion.div key={k} {...item(3 + i)}>
                            <dt>{k}</dt>
                            <dd>{to ? <button className="link" onClick={() => go(to)}>{v} →</button> : v}</dd>
                        </motion.div>
                    ))}
                </dl>
            </div>
        </div>
    )
}
