import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback, useRef, useEffect } from 'react'

const PROJECTS = [
    {
        number: '01',
        title: 'The Director',
        desc: 'PBBG GAME',
        url: 'https://thedirector.app'
    }
]

export function Menu({ view, setView }) {
    return (
        <div id="menu-container" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', padding: '4rem', boxSizing: 'border-box',
            zIndex: 100
        }}>
            <AnimatePresence mode='wait'>
                {view === 'main' && (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
                    >
                        <h1 style={{
                            color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: '6rem',
                            margin: 0, textShadow: '5px 5px 0px #d00', lineHeight: 0.9,
                            marginBottom: '1rem', textAlign: 'right', letterSpacing: '2px'
                        }}>
                            MAKIMURA<br />
                            <span style={{ color: '#d00', textShadow: '5px 5px 0px #fff' }}>.DEV</span>
                        </h1>
                    </motion.div>
                )}

                {view === 'projects' && (
                    <motion.div
                        key="projects"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{
                            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                            pointerEvents: 'auto'
                        }}
                    >
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '2rem'
                        }}>
                            <h2 style={{
                                color: '#fff', fontFamily: 'Anton, sans-serif',
                                fontSize: '3rem', margin: 0, letterSpacing: '3px',
                                textShadow: '3px 3px 0px #d00'
                            }}>
                                EPISODE LIST
                            </h2>
                            <motion.button
                                whileHover={{ scale: 1.05, borderColor: '#d00' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setView('main')}
                                style={{
                                    background: 'transparent', border: '2px solid rgba(255,255,255,0.5)',
                                    color: 'white', padding: '0.6rem 1.5rem', cursor: 'pointer',
                                    fontFamily: 'Anton, sans-serif', fontSize: '1rem',
                                    letterSpacing: '2px', transition: 'border-color 0.2s'
                                }}
                            >
                                RETURN
                            </motion.button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '2rem'
                        }}>
                            {PROJECTS.map((project) => (
                                <ProjectCard key={project.number} project={project} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {view === 'about' && (
                    <motion.div
                        key="about"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)', textAlign: 'center',
                            pointerEvents: 'auto'
                        }}
                    >
                        <h2 style={{
                            color: '#d00', fontFamily: 'Anton, sans-serif', fontSize: '4rem',
                            margin: '0 0 1rem 0', letterSpacing: '3px'
                        }}>
                            WHO IS MAKIMURA?
                        </h2>
                        <p style={{
                            color: 'white', maxWidth: '600px',
                            fontSize: '1.2rem', lineHeight: 1.6, margin: '0 auto',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                        }}>
                            Hobbyist with a passion for an 80s anime. 
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: '#d00', color: '#fff' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setView('main')}
                            style={{
                                marginTop: '2rem', background: '#fff', color: '#000',
                                border: 'none', padding: '0.8rem 2.5rem', fontWeight: 'bold',
                                cursor: 'pointer', fontFamily: 'Anton, sans-serif',
                                fontSize: '1.1rem', letterSpacing: '2px', transition: 'all 0.2s'
                            }}
                        >
                            BACK
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 10 }}>
                <SoundControl />
            </div>
        </div>
    )
}

function SoundControl() {
    const [playing, setPlaying] = useState(false)
    const checkRef = useRef(null)

    useEffect(() => {
        checkRef.current = setInterval(() => {
            if (window.bgAudio) {
                setPlaying(!window.bgAudio.paused)
            }
        }, 500)
        return () => clearInterval(checkRef.current)
    }, [])

    const toggle = useCallback(() => {
        const audio = window.bgAudio
        if (!audio) return

        if (audio.paused) {
            audio.play()
                .then(() => setPlaying(true))
                .catch(() => {})
        } else {
            audio.pause()
            setPlaying(false)
        }
    }, [])

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggle}
            style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                padding: '0.6rem 1.2rem',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)',
                pointerEvents: 'auto',
                fontFamily: 'Anton, sans-serif',
                fontSize: '1rem',
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backdropFilter: 'blur(4px)'
            }}
        >
            <span style={{ fontSize: '1.2rem' }}>{playing ? '◼' : '▶'}</span>
            <span>{playing ? 'SOUND ON' : 'PLAY SOUND'}</span>
        </motion.button>
    )
}

function ProjectCard({ project }) {
    const { number, title, desc, url } = project

    return (
        <motion.a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -10, boxShadow: '0px 10px 20px rgba(221, 0, 0, 0.3)' }}
            style={{
                background: '#111',
                border: '1px solid #333',
                padding: '0',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'block',
                overflow: 'hidden'
            }}
        >
            <div style={{
                width: '100%', height: '180px', background: '#0a0a0a',
                position: 'relative', overflow: 'hidden'
            }}>
                <iframe
                    src={url}
                    title={title}
                    scrolling="no"
                    style={{
                        width: '200%', height: '200%',
                        transform: 'scale(0.5)', transformOrigin: 'top left',
                        border: 'none', pointerEvents: 'none', overflow: 'hidden'
                    }}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
            <div style={{ padding: '1.2rem 1.5rem' }}>
                <h3 style={{
                    color: '#d00', fontFamily: 'Anton, sans-serif',
                    margin: '0 0 0.5rem 0', letterSpacing: '1px'
                }}>
                    EP.{number} {title.toUpperCase()}
                </h3>
                <p style={{
                    color: '#ccc', margin: 0, fontFamily: 'monospace'
                }}>
                    {desc}
                </p>
            </div>
        </motion.a>
    )
}
