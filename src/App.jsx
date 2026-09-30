import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Scene from './components/canvas/Scene'
import { Intro } from './components/dom/Intro'
import { Hud } from './components/dom/Hud'
import { Hero } from './components/dom/Hero'
import { Panel } from './components/dom/Panel'
import { Episodes } from './components/dom/Episodes'
import { Profile } from './components/dom/Profile'
import { MessageBoard } from './components/dom/MessageBoard'
import { Ending } from './components/dom/Ending'
import { SpeedLines } from './components/dom/SpeedLines'
import { ChalkDefs } from './components/dom/Chalk'
import * as audio from './audio'

const PANELS = {
    projects: { title: 'Episodes', jp: '事件簿', Body: Episodes },
    about: { title: 'Case File', jp: '調書', Body: Profile },
    xyz: { title: 'Message Board', jp: '伝言板', Body: MessageBoard },
}

export default function App() {
    const [entered, setEntered] = useState(false)
    const [view, setView] = useState('main')
    const [ending, setEnding] = useState(false)
    const [hovered, setHovered] = useState(null)
    const [burst, setBurst] = useState(null)

    const enter = useCallback((withSound) => {
        if (withSound) audio.play()
        setEntered(true)
    }, [])

    const go = useCallback((next, x, y) => {
        if (x != null) setBurst({ x, y, id: performance.now() })
        setEnding(false)
        setView(next)
    }, [])

    const roll = useCallback(() => {
        setView('main')
        setEnding(true)
        if (!audio.isPlaying()) audio.play()
    }, [])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return
            setEnding(false)
            setView('main')
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const panel = PANELS[view]

    return (
        <>
            <ChalkDefs />
            <Scene entered={entered} view={view} ending={ending} onSelect={go} onHover={setHovered} />

            <div className="ui">
                <AnimatePresence>
                    {entered && !ending && (
                        <Hud key="hud" view={view} go={go} onEnding={roll} />
                    )}
                    {entered && view === 'main' && !ending && <Hero key="hero" hovered={hovered} go={go} />}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {panel && (
                        <Panel key={view} title={panel.title} jp={panel.jp} onClose={() => setView('main')}>
                            <panel.Body go={go} />
                        </Panel>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {ending && <Ending key="ending" onClose={() => setEnding(false)} />}
                </AnimatePresence>

                <SpeedLines burst={burst} />

                <AnimatePresence>{!entered && <Intro key="intro" onEnter={enter} />}</AnimatePresence>
            </div>

            <div className="film" aria-hidden="true" />
        </>
    )
}
