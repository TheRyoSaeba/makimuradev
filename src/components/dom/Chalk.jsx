import { motion } from 'framer-motion'

// One shared SVG filter turns any stroke or text into chalk: rough the edge
// with displacement, then eat holes in it with a second noise field.
export function ChalkDefs() {
    return (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
            <defs>
                <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="rough" />
                    <feDisplacementMap in="SourceGraphic" in2="rough" scale="3.5" result="edge" />
                    <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="3" result="grain" />
                    <feColorMatrix in="grain" type="matrix"
                        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.4 1.75" result="holes" />
                    <feComposite in="edge" in2="holes" operator="in" />
                </filter>
            </defs>
        </svg>
    )
}

const STROKES = [
    'M22 22 Q46 60 80 104',
    'M82 18 Q54 60 18 106',
    'M112 20 Q128 42 142 62',
    'M176 16 Q156 42 142 64',
    'M142 62 Q140 86 136 108',
    'M198 24 Q232 18 266 20 Q232 62 200 104 Q238 98 276 100',
]

/** Hand-lettered "XYZ", drawn stroke by stroke like someone writing it. */
export function XYZ({ delay = 0, speed = 1, className }) {
    return (
        <svg className={className} viewBox="0 0 300 124" role="img" aria-label="XYZ">
            <g filter="url(#chalk)" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
                {STROKES.map((d, i) => (
                    <motion.path
                        key={i}
                        d={d}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                            pathLength: { delay: delay + i * 0.22 * speed, duration: (i === 5 ? 0.7 : 0.26) * speed, ease: [0.6, 0, 0.4, 1] },
                            opacity: { delay: delay + i * 0.22 * speed, duration: 0.01 },
                        }}
                    />
                ))}
            </g>
        </svg>
    )
}
