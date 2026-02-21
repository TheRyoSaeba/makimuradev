import { useTexture, Html } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useBackgroundLayout } from './ImageBackground'

const OUTLINE_VERTEX = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const OUTLINE_FRAGMENT = `
    uniform sampler2D uTexture;
    uniform float uIntensity;
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
        vec4 tex = texture2D(uTexture, vUv);
        float alpha = tex.a;

        if (uIntensity < 0.01) {
            discard;
            return;
        }

        vec2 texelSize = 1.0 / vec2(textureSize(uTexture, 0));
        float edgeSum = 0.0;
        float radius = 3.0;

        for (float x = -3.0; x <= 3.0; x += 1.0) {
            for (float y = -3.0; y <= 3.0; y += 1.0) {
                if (x == 0.0 && y == 0.0) continue;
                float dist = length(vec2(x, y));
                if (dist > radius) continue;
                vec2 offset = vec2(x, y) * texelSize * 2.0;
                float neighbor = texture2D(uTexture, vUv + offset).a;
                edgeSum += abs(alpha - neighbor);
            }
        }

        float edge = smoothstep(0.3, 1.5, edgeSum);

        if (edge > 0.01) {
            float travel = fract(uTime * 0.8 + vUv.x * 2.0 + vUv.y * 1.5);
            float sweep = smoothstep(0.0, 0.4, travel) * smoothstep(1.0, 0.6, travel);
            float pulse = 0.6 + sweep * 0.4;
            float glow = edge * uIntensity * pulse;
            gl_FragColor = vec4(uColor, glow);
        } else if (alpha > 0.5) {
            float brightness = uIntensity * 0.15;
            gl_FragColor = vec4(tex.rgb * brightness, alpha * brightness * 0.3);
        } else {
            discard;
        }
    }
`

function useOutlineShader(texture, color) {
    return useMemo(() => ({
        uniforms: {
            uTexture: { value: texture },
            uIntensity: { value: 0 },
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(color) }
        },
        vertexShader: OUTLINE_VERTEX,
        fragmentShader: OUTLINE_FRAGMENT
    }), [texture, color])
}

function useAlphaMask(texture) {
    const maskRef = useRef(null)
    
    useEffect(() => {
        if (!texture.image) return
        const img = texture.image
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, img.width, img.height).data
        const mask = new Uint8Array(img.width * img.height)
        for (let i = 0; i < mask.length; i++) {
            mask[i] = data[i * 4 + 3] > 25 ? 1 : 0
        }
        maskRef.current = { mask, width: img.width, height: img.height }
    }, [texture])
    
    const checkAlpha = useCallback((uv) => {
        if (!maskRef.current || !uv) return true
        const { mask, width, height } = maskRef.current
        const x = Math.floor(uv.x * width)
        const y = Math.floor((1 - uv.y) * height)
        if (x < 0 || x >= width || y < 0 || y >= height) return false
        return mask[y * width + x] === 1
    }, [])
    
    return checkAlpha
}

export function CharacterOutlines({ manUrl, womanUrl, setView }) {
    const [hoveredMan, setHoveredMan] = useState(false)
    const [hoveredWoman, setHoveredWoman] = useState(false)
    const [dimLevel, setDimLevel] = useState(0)

    const manTexture = useTexture(manUrl)
    const womanTexture = useTexture(womanUrl)
    const bgTexture = useTexture('/images/bg.png')

    const manOutlineRef = useRef()
    const womanOutlineRef = useRef()

    const { camera, size } = useThree()
    const layout = useBackgroundLayout(bgTexture, camera, size)

    const manShader = useOutlineShader(manTexture, '#ffffff')
    const womanShader = useOutlineShader(womanTexture, '#ffffff')
    
    const checkManAlpha = useAlphaMask(manTexture)
    const checkWomanAlpha = useAlphaMask(womanTexture)

    const charDepth = layout.depth + 0.1

    const manLayout = useMemo(() => {
        const bgImgW = bgTexture.image.width
        const bgImgH = bgTexture.image.height
        const cutW = manTexture.image.width
        const cutH = manTexture.image.height

        const scaleH = layout.bgH
        const scaleW = scaleH * (cutW / cutH)

        const normX = 0.173
        const normY = 0.0

        const posX = layout.bgX - layout.bgW / 2 + normX * layout.bgW + scaleW / 2
        const posY = layout.bgY

        return { width: scaleW, height: scaleH, x: posX, y: posY }
    }, [layout, bgTexture, manTexture])

    const womanLayout = useMemo(() => {
        const cutW = womanTexture.image.width
        const cutH = womanTexture.image.height

        const scaleH = layout.bgH
        const scaleW = scaleH * (cutW / cutH)

        const normX = 0.476
        const normY = 0.0

        const posX = layout.bgX - layout.bgW / 2 + normX * layout.bgW + scaleW / 2
        const posY = layout.bgY

        return { width: scaleW, height: scaleH, x: posX, y: posY }
    }, [layout, bgTexture, womanTexture])

    const onManMove = useCallback((e) => {
        e.stopPropagation()
        const isOverCharacter = checkManAlpha(e.uv)
        if (isOverCharacter && !hoveredMan) {
            setHoveredMan(true)
            document.body.style.cursor = 'pointer'
        } else if (!isOverCharacter && hoveredMan) {
            setHoveredMan(false)
            document.body.style.cursor = 'auto'
        }
    }, [checkManAlpha, hoveredMan])

    const onManOut = useCallback((e) => {
        e.stopPropagation()
        setHoveredMan(false)
        document.body.style.cursor = 'auto'
    }, [])

    const onManClick = useCallback((e) => {
        e.stopPropagation()
        if (!checkManAlpha(e.uv)) return
        setView('projects')
    }, [checkManAlpha, setView])

    const onWomanMove = useCallback((e) => {
        e.stopPropagation()
        const isOverCharacter = checkWomanAlpha(e.uv)
        if (isOverCharacter && !hoveredWoman) {
            setHoveredWoman(true)
            document.body.style.cursor = 'pointer'
        } else if (!isOverCharacter && hoveredWoman) {
            setHoveredWoman(false)
            document.body.style.cursor = 'auto'
        }
    }, [checkWomanAlpha, hoveredWoman])

    const onWomanOut = useCallback((e) => {
        e.stopPropagation()
        setHoveredWoman(false)
        document.body.style.cursor = 'auto'
    }, [])

    const onWomanClick = useCallback((e) => {
        e.stopPropagation()
        if (!checkWomanAlpha(e.uv)) return
        setView('about')
    }, [checkWomanAlpha, setView])

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime
        const targetDim = (hoveredMan || hoveredWoman) ? 0.7 : 0
        setDimLevel(prev => THREE.MathUtils.lerp(prev, targetDim, delta * 4))

        if (manOutlineRef.current) {
            const target = hoveredMan ? 1 : 0
            manOutlineRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
                manOutlineRef.current.uniforms.uIntensity.value, target, delta * 6
            )
            manOutlineRef.current.uniforms.uTime.value = t
        }
        if (womanOutlineRef.current) {
            const target = hoveredWoman ? 1 : 0
            womanOutlineRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
                womanOutlineRef.current.uniforms.uIntensity.value, target, delta * 6
            )
            womanOutlineRef.current.uniforms.uTime.value = t
        }
    })

    const labelStyle = {
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'Anton, sans-serif',
        letterSpacing: '4px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap'
    }

    return (
        <group>
            {dimLevel > 0.01 && (
                <mesh position={[0, 0, layout.depth + 0.05]}>
                    <planeGeometry args={[layout.vWidth * 2, layout.vHeight * 2]} />
                    <meshBasicMaterial color="#000" transparent opacity={dimLevel} depthWrite={false} />
                </mesh>
            )}

            <mesh
                position={[manLayout.x, manLayout.y, charDepth - 0.01]}
                onClick={onManClick}
                onPointerMove={onManMove}
                onPointerOut={onManOut}
            >
                <planeGeometry args={[manLayout.width, manLayout.height]} />
                <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
            </mesh>

            <mesh position={[manLayout.x, manLayout.y, charDepth]}>
                <planeGeometry args={[manLayout.width, manLayout.height]} />
                <shaderMaterial
                    ref={manOutlineRef}
                    {...manShader}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {hoveredMan && (
                <Html
                    position={[
                        manLayout.x - manLayout.width * 0.315,
                        manLayout.y - manLayout.height * 0.137,
                        charDepth + 0.1
                    ]}
                    center
                    distanceFactor={8}
                    style={labelStyle}
                >
                    <div style={{
                        color: '#fff',
                        fontSize: '2.2rem',
                        textShadow: '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(221,0,0,0.6), 3px 3px 0px #000',
                        animation: 'labelFadeIn 0.3s ease-out'
                    }}>
                        PROJECTS
                    </div>
                </Html>
            )}

            <mesh
                position={[womanLayout.x, womanLayout.y, charDepth - 0.01]}
                onClick={onWomanClick}
                onPointerMove={onWomanMove}
                onPointerOut={onWomanOut}
            >
                <planeGeometry args={[womanLayout.width, womanLayout.height]} />
                <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
            </mesh>

            <mesh position={[womanLayout.x, womanLayout.y, charDepth]}>
                <planeGeometry args={[womanLayout.width, womanLayout.height]} />
                <shaderMaterial
                    ref={womanOutlineRef}
                    {...womanShader}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {hoveredWoman && (
                <Html
                    position={[
                        womanLayout.x + womanLayout.width * 0.342,
                        womanLayout.y + womanLayout.height * 0.171,
                        charDepth + 0.1
                    ]}
                    center
                    distanceFactor={8}
                    style={labelStyle}
                >
                    <div style={{
                        color: '#fff',
                        fontSize: '2.2rem',
                        textShadow: '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(221,0,0,0.6), 3px 3px 0px #000',
                        animation: 'labelFadeIn 0.3s ease-out'
                    }}>
                        ABOUT
                    </div>
                </Html>
            )}
        </group>
    )
}
