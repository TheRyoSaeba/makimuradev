import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'
import { CityScene } from './CityScene'

export default function Scene(props) {
    return (
        <Canvas
            className="scene"
            dpr={[1, 1.75]}
            gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
            flat
        >
            <color attach="background" args={['#05061a']} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            <Suspense fallback={null}>
                <CityScene {...props} />
            </Suspense>
        </Canvas>
    )
}
