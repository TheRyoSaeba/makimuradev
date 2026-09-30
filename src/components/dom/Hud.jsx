import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import * as audio from '../../audio'
import { SITE } from '../../content'

const NAV = [
    ['projects', 'Episodes'],
    ['about', 'Profile'],
    ['xyz', 'XYZ'],
]

const tokyo = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})

function TokyoClock() {
    const [now, setNow] = useState(() => tokyo.format(new Date()))
    useEffect(() => {
        const id = setInterval(() => setNow(tokyo.format(new Date())), 1000)
        return () => clearInterval(id)
    }, [])
    return (
        <div className="clock" title="Local time in Shinjuku">
            <span lang="ja">新宿</span>
            <span className="clock__time">{now}</span>
            <span className="clock__tz">JST</span>
        </div>
    )
}

function Equalizer() {
    const playing = audio.usePlaying()
    const bars = useRef([])
    useEffect(() => {
        const bands = new Float32Array(5)
        let raf
        const tick = () => {
            audio.getBands(bands)
            bars.current.forEach((el, i) => {
                if (el) el.style.transform = `scaleY(${0.12 + bands[i] * 0.95})`
            })
            raf = requestAnimationFrame(tick)
        }
        tick()
        return () => cancelAnimationFrame(raf)
    }, [])

    return (
        <button className="sound" onClick={audio.toggle} aria-pressed={playing} aria-label={playing ? 'Mute soundtrack' : 'Play soundtrack'}>
            <span className="sound__eq" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => <i key={i} ref={(el) => (bars.current[i] = el)} />)}
            </span>
            <span>{playing ? 'Sound on' : 'Sound off'}</span>
        </button>
    )
}

export function Hud({ view, go, onEnding }) {
    return (
        <motion.div className="hud" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.9, duration: 0.8 } }} exit={{ opacity: 0 }}>
            <header className="hud__top">
                <button className="brand" onClick={() => go('main')} aria-label="Home">
                    <span className="brand__mark">M</span>
                    <span className="brand__name">{SITE.name}<em>{SITE.tld}</em></span>
                    <span className="brand__jp" lang="ja">{SITE.kanji}</span>
                </button>
                <nav className="nav" aria-label="Sections">
                    {NAV.map(([key, label], i) => (
                        <button key={key} className="nav__item" aria-current={view === key ? 'page' : undefined} onClick={() => go(key)}>
                            <span className="nav__num">0{i + 1}</span>{label}
                        </button>
                    ))}
                </nav>
                <TokyoClock />
            </header>

            <footer className="hud__bottom">
                <Equalizer />
                <button className="ending-btn" onClick={onEnding}>
                    <span className="ending-btn__dot" />Roll ending
                </button>
            </footer>
        </motion.div>
    )
}
