import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { ImageBackground } from './ImageBackground'
import { CharacterOutlines } from './CharacterOutlines'
import { PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'

export default function Scene({ setView }) {
    const audioRef = useRef(null)

    useEffect(() => {
        const audio = new Audio('/audio.mp3')
        audio.loop = true
        audioRef.current = audio
        window.bgAudio = audio

        return () => {
            audio.pause()
            audio.src = ''
            window.bgAudio = null
        }
    }, [])

    return (
        <Canvas
            gl={{ antialias: true, alpha: false }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <Suspense fallback={null}>
                <ImageBackground url="/images/bg.png" />
                <CharacterOutlines
                    manUrl="/images/man.png"
                    womanUrl="/images/woman.png"
                    setView={setView}
                />

                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.9} height={200} intensity={0.2} />
                    <Noise opacity={0.008} />
                    <Vignette eskil={false} offset={0.1} darkness={0.4} />
                </EffectComposer>
            </Suspense>
        </Canvas>
    )
}
