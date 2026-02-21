import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

export function ImageBackground({ url }) {
    const texture = useTexture(url)
    const { camera, size } = useThree()

    useEffect(() => {
        if (texture) {
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            texture.colorSpace = THREE.SRGBColorSpace
        }
    }, [texture])

    const { scaleX, scaleY, depth } = useMemo(() => {
        const d = -10
        const distance = Math.abs(camera.position.z - d)
        const vHeight = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * distance
        const vWidth = vHeight * (size.width / size.height)

        const imageAspect = texture.image ? texture.image.width / texture.image.height : 16 / 9
        const screenAspect = vWidth / vHeight

        let sx, sy
        if (screenAspect > imageAspect) {
            sx = vWidth
            sy = vWidth / imageAspect
        } else {
            sy = vHeight
            sx = vHeight * imageAspect
        }

        return { scaleX: sx, scaleY: sy, depth: d }
    }, [camera, size, texture])

    return (
        <mesh position={[0, 0, depth]}>
            <planeGeometry args={[scaleX, scaleY]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    )
}

export function useBackgroundLayout(texture, camera, size) {
    return useMemo(() => {
        const depth = -10
        const distance = Math.abs(camera.position.z - depth)
        const vHeight = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * distance
        const vWidth = vHeight * (size.width / size.height)

        const imageAspect = texture.image ? texture.image.width / texture.image.height : 16 / 9
        const screenAspect = vWidth / vHeight

        let bgW, bgH
        if (screenAspect > imageAspect) {
            bgW = vWidth
            bgH = vWidth / imageAspect
        } else {
            bgH = vHeight
            bgW = vHeight * imageAspect
        }

        const bgX = 0
        const bgY = 0

        return { bgW, bgH, bgX, bgY, depth, vWidth, vHeight }
    }, [camera, size, texture])
}
