import { useTexture, Html } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { passVertex, backgroundFragment, outlineFragment } from './shaders'
import { getLevel } from '../../audio'
import { asset } from '../../asset'

const BG_URL = asset('images/bg.png')
const DEPTH = -10
const BASE_Z = 5
// Oversize the plate so the camera can drift without revealing an edge.
const OVERSCAN = 1.08
const DRIFT = { x: 0.32, y: 0.18 }
// On narrow screens, keep this point of the art (between the two leads) centred.
const FOCAL_X = 0.44

// Where each cutout sits inside the key art, as a fraction of its width, and how
// much of each side to feather where the cutout was cropped against the other.
const CAST = {
    man: { url: asset('images/man.png'), x0: 0.173, fade: [0.0, 0.14], color: '#ff3b4d', label: 'Episodes', jp: '事件簿', view: 'projects', anchor: [-0.3, -0.13] },
    woman: { url: asset('images/woman.png'), x0: 0.476, fade: [0.2, 0.0], color: '#ff8fb6', label: 'Profile', jp: '調書', view: 'about', anchor: [0.36, 0.17] },
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
        return { bgW, bgH, bgX, bgY: 0, vH }
    }, [camera, size, bg])
}

function useAlphaMask(texture) {
    return useMemo(() => {
        const img = texture.image
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, img.width, img.height).data
        const mask = new Uint8Array(img.width * img.height)
        for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 25 ? 1 : 0
        return (uv) => {
            if (!uv) return false
            const x = Math.floor(uv.x * img.width)
            const y = Math.floor((1 - uv.y) * img.height)
            if (x < 0 || x >= img.width || y < 0 || y >= img.height) return false
            return mask[y * img.width + x] === 1
        }
    }, [texture])
}

function castRect(who, tex, bg) {
    const w = (tex.image.width / tex.image.height) * (bg.image.height / bg.image.width)
    return new THREE.Vector2(CAST[who].x0, w)
}

function Character({ who, texture, rect, layout, hovered, setHovered, onSelect, enabled }) {
    const cfg = CAST[who]
    const outline = useRef()
    const hits = useAlphaMask(texture)

    const width = rect.y * layout.bgW
    const x = layout.bgX - layout.bgW / 2 + rect.x * layout.bgW + width / 2
    const y = layout.bgY

    const uniforms = useMemo(() => ({
        uTexture: { value: texture },
        uIntensity: { value: 0 },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(cfg.color) },
        uTexelScale: { value: 1 },
        uFade: { value: new THREE.Vector2(...cfg.fade) },
    }), [texture, cfg.color, cfg.fade])

    useFrame((state, dt) => {
        const u = outline.current.uniforms
        u.uIntensity.value = damp(u.uIntensity.value, hovered ? 1 : 0, 7, dt)
        u.uTime.value = state.clock.elapsedTime
        // One ring step ≈ one screen pixel, so the rim stays crisp at any size.
        u.uTexelScale.value = texture.image.height / ((layout.bgH / layout.vH) * state.size.height)
    })

    const over = useCallback((e) => {
        if (!enabled) return
        e.stopPropagation()
        const inside = hits(e.uv)
        if (inside !== hovered) setHovered(inside ? who : null)
    }, [enabled, hits, hovered, setHovered, who])

    const out = useCallback(() => {
        if (hovered) setHovered(null)
    }, [hovered, setHovered])

    const click = useCallback((e) => {
        if (!enabled || !hits(e.uv)) return
        e.stopPropagation()
        setHovered(null)
        onSelect(cfg.view, e.nativeEvent.clientX, e.nativeEvent.clientY)
    }, [enabled, hits, onSelect, cfg.view, setHovered])

    return (
        <group>
            <mesh position={[x, y, DEPTH + 0.02]} onPointerMove={over} onPointerOut={out} onClick={click}>
                <planeGeometry args={[width, layout.bgH]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh position={[x, y, DEPTH + 0.01]} renderOrder={2}>
                <planeGeometry args={[width, layout.bgH]} />
                <shaderMaterial
                    ref={outline}
                    uniforms={uniforms}
                    vertexShader={passVertex}
                    fragmentShader={outlineFragment}
                    transparent
                    depthWrite={false}
                    depthTest={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            {hovered && (
                <Html
                    position={[x + cfg.anchor[0] * width * 1.0, y + cfg.anchor[1] * layout.bgH, DEPTH + 0.1]}
                    center
                    zIndexRange={[20, 10]}
                    style={{ pointerEvents: 'none' }}
                >
                    <div className={`callout callout--${who}`}>
                        <span className="callout__jp">{cfg.jp}</span>
                        <span className="callout__label">{cfg.label}</span>
                    </div>
                </Html>
            )}
        </group>
    )
}

export function CityScene({ entered, view, ending, onSelect, onHover }) {
    const bg = useTexture(BG_URL)
    const man = useTexture(CAST.man.url)
    const woman = useTexture(CAST.woman.url)
    const layout = useLayout(bg)
    const [hovered, setHoveredState] = useState(null)
    const mat = useRef()
    const clock = useRef(0)
    const { camera, gl } = useThree()

    useEffect(() => {
        for (const t of [bg, man, woman]) {
            t.colorSpace = THREE.NoColorSpace
            t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
            t.needsUpdate = true
        }
    }, [bg, man, woman, gl])

    const setHovered = useCallback((who) => {
        setHoveredState(who)
        onHover?.(who)
        document.body.style.cursor = who ? 'pointer' : ''
    }, [onHover])

    const interactive = entered && view === 'main' && !ending
    useEffect(() => {
        if (!interactive) setHovered(null)
    }, [interactive, setHovered])

    const manRect = useMemo(() => castRect('man', man, bg), [man, bg])
    const womanRect = useMemo(() => castRect('woman', woman, bg), [woman, bg])

    const uniforms = useMemo(() => ({
        uMap: { value: bg },
        uMan: { value: man },
        uWoman: { value: woman },
        uManRect: { value: manRect },
        uWomanRect: { value: womanRect },
        uManFade: { value: new THREE.Vector2(...CAST.man.fade) },
        uWomanFade: { value: new THREE.Vector2(...CAST.woman.fade) },
        uTime: { value: 0 },
        uBeat: { value: 0 },
        uFocusMan: { value: 0 },
        uFocusWoman: { value: 0 },
        uPanel: { value: 0 },
        uFreeze: { value: 0 },
        uIntro: { value: 0 },
    }), [bg, man, woman, manRect, womanRect])

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

    return (
        <group>
            <mesh position={[layout.bgX, layout.bgY, DEPTH]}>
                <planeGeometry args={[layout.bgW, layout.bgH]} />
                <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={passVertex} fragmentShader={backgroundFragment} />
            </mesh>
            <Character who="man" texture={man} rect={manRect} layout={layout} hovered={hovered === 'man'}
                setHovered={setHovered} onSelect={onSelect} enabled={interactive} />
            <Character who="woman" texture={woman} rect={womanRect} layout={layout} hovered={hovered === 'woman'}
                setHovered={setHovered} onSelect={onSelect} enabled={interactive} />
        </group>
    )
}
