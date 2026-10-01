import { useTexture, Html } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { passVertex, backgroundFragment } from './shaders'
import { getLevel } from '../../audio'
import { asset } from '../../asset'

const BG_URL = asset('images/bg.png')
// Full-body silhouettes in background space (r = Ryo, g = Kaori), generated
// from the key art by scripts/build_cast_mask.py.
const MASK_URL = asset('images/cast-mask.png')
const DEPTH = -10
const BASE_Z = 5
// Oversize the plate so the camera can drift without revealing an edge.
const OVERSCAN = 1.08
const DRIFT = { x: 0.32, y: 0.18 }
// On narrow screens, keep this point of the art (between the two leads) centred.
const FOCAL_X = 0.44

// `anchor` places each hover callout, in background UV (origin bottom-left).
const CAST = {
    man: { channel: 0, color: '#ff3b4d', label: 'Episodes', jp: '事件簿', view: 'projects', anchor: [0.23, 0.37] },
    woman: { channel: 1, color: '#ff8fb6', label: 'Profile', jp: '調書', view: 'about', anchor: [0.645, 0.67] },
}

const damp = THREE.MathUtils.damp
const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useLayout(bg) {
    const { camera, size } = useThree()
    return useMemo(() => {
        const dist = BASE_Z - DEPTH
        const vH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist
        const vW = vH * (size.width / size.height)
        const imgAspect = bg.image.width / bg.image.height
        let bgW = vW / vH > imgAspect ? vW : vH * imgAspect
        bgW *= OVERSCAN
        const bgH = bgW / imgAspect
        const slack = Math.max(0, (bgW - vW) / 2 - DRIFT.x - 0.05)
        const bgX = THREE.MathUtils.clamp((0.5 - FOCAL_X) * bgW, -slack, slack)
        return { bgW, bgH, bgX, bgY: 0 }
    }, [camera, size, bg])
}

/** Returns uv → 'man' | 'woman' | null, read from the silhouette mask on the CPU. */
function useHitTest(mask) {
    return useMemo(() => {
        const img = mask.image
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, img.width, img.height).data
        return (uv) => {
            if (!uv) return null
            const x = Math.floor(uv.x * img.width)
            const y = Math.floor((1 - uv.y) * img.height)
            if (x < 0 || x >= img.width || y < 0 || y >= img.height) return null
            const i = (y * img.width + x) * 4
            const r = data[i + CAST.man.channel]
            const g = data[i + CAST.woman.channel]
            if (Math.max(r, g) < 128) return null
            return r >= g ? 'man' : 'woman'
        }
    }, [mask])
}

export function CityScene({ entered, view, ending, onSelect, onHover }) {
    const [bg, mask] = useTexture([BG_URL, MASK_URL])
    const layout = useLayout(bg)
    const hitTest = useHitTest(mask)
    const [hovered, setHoveredState] = useState(null)
    const mat = useRef()
    const clock = useRef(0)
    const { camera, gl } = useThree()

    useEffect(() => {
        for (const t of [bg, mask]) {
            t.colorSpace = THREE.NoColorSpace
            t.needsUpdate = true
        }
        bg.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    }, [bg, mask, gl])

    const setHovered = useCallback((who) => {
        setHoveredState(who)
        onHover?.(who)
        document.body.style.cursor = who ? 'pointer' : ''
    }, [onHover])

    const interactive = entered && view === 'main' && !ending
    useEffect(() => {
        if (!interactive) setHovered(null)
    }, [interactive, setHovered])

    const onMove = useCallback((e) => {
        if (!interactive) return
        const who = hitTest(e.uv)
        if (who !== hovered) setHovered(who)
    }, [interactive, hitTest, hovered, setHovered])

    const onOut = useCallback(() => {
        if (hovered) setHovered(null)
    }, [hovered, setHovered])

    const onClick = useCallback((e) => {
        if (!interactive) return
        const who = hitTest(e.uv)
        if (!who) return
        setHovered(null)
        onSelect(CAST[who].view, e.nativeEvent.clientX, e.nativeEvent.clientY)
    }, [interactive, hitTest, onSelect, setHovered])

    const uniforms = useMemo(() => ({
        uMap: { value: bg },
        uMask: { value: mask },
        uPx: { value: new THREE.Vector2() },
        uColorMan: { value: new THREE.Color(CAST.man.color) },
        uColorWoman: { value: new THREE.Color(CAST.woman.color) },
        uTime: { value: 0 },
        uBeat: { value: 0 },
        uFocusMan: { value: 0 },
        uFocusWoman: { value: 0 },
        uPanel: { value: 0 },
        uFreeze: { value: 0 },
        uIntro: { value: 0 },
    }), [bg, mask])

    useFrame((state, dt) => {
        const u = mat.current.uniforms
        const freeze = u.uFreeze.value
        // Our own clock, so the freeze-frame genuinely stops time.
        clock.current += dt * (1 - freeze) * (reducedMotion ? 0.25 : 1)
        u.uTime.value = clock.current
        u.uBeat.value = getLevel() * (1 - freeze)
        u.uFocusMan.value = damp(u.uFocusMan.value, hovered === 'man' ? 1 : 0, 6, dt)
        u.uFocusWoman.value = damp(u.uFocusWoman.value, hovered === 'woman' ? 1 : 0, 6, dt)
        u.uPanel.value = damp(u.uPanel.value, view !== 'main' ? 1 : 0, 5, dt)
        u.uFreeze.value = damp(freeze, ending ? 1 : 0, ending ? 9 : 3, dt)
        u.uIntro.value = damp(u.uIntro.value, entered ? 1 : 0.0, 1.6, dt)

        // One screen pixel in background UV, so the rim keeps a constant
        // on-screen thickness as the camera pushes in and the viewport changes.
        const dist = camera.position.z - DEPTH
        const pxWorld = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist) / state.size.height
        u.uPx.value.set(pxWorld / layout.bgW, pxWorld / layout.bgH)

        // Camera: drift toward the pointer, lean in on focus, creep in on the ending.
        const drift = reducedMotion || ending ? 0 : 1
        const px = state.pointer.x * DRIFT.x * drift
        const py = state.pointer.y * DRIFT.y * drift
        const push = (hovered ? 0.35 : 0) + (view !== 'main' ? 0.6 : 0) + (ending ? 1.1 : 0) + (entered ? 0 : -0.4)
        camera.position.x = damp(camera.position.x, px, 2.2, dt)
        camera.position.y = damp(camera.position.y, py, 2.2, dt)
        camera.position.z = damp(camera.position.z, BASE_Z - push, ending ? 0.35 : 1.8, dt)
        camera.lookAt(camera.position.x * 0.6, camera.position.y * 0.6, DEPTH)
    })

    const callout = hovered && CAST[hovered]

    return (
        <group>
            <mesh position={[layout.bgX, layout.bgY, DEPTH]} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick}>
                <planeGeometry args={[layout.bgW, layout.bgH]} />
                <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={passVertex} fragmentShader={backgroundFragment} />
            </mesh>
            {callout && (
                <Html
                    key={hovered}
                    position={[
                        layout.bgX + (callout.anchor[0] - 0.5) * layout.bgW,
                        layout.bgY + (callout.anchor[1] - 0.5) * layout.bgH,
                        DEPTH + 0.1,
                    ]}
                    center
                    zIndexRange={[20, 10]}
                    style={{ pointerEvents: 'none' }}
                >
                    <div className={`callout callout--${hovered}`}>
                        <span className="callout__jp">{callout.jp}</span>
                        <span className="callout__label">{callout.label}</span>
                    </div>
                </Html>
            )}
        </group>
    )
}
