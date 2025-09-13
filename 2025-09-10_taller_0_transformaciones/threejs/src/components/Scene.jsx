import React, { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

export default function Scene() {
  const meshRef = useRef()
  const { clock } = useThree()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // Solo rotación y escalado suave
    meshRef.current.position.x = 0
    meshRef.current.position.y = 0
    meshRef.current.rotation.x += 0.02
    meshRef.current.rotation.y += 0.02
  const scale = 2 + Math.sin(t) * 0.3 // cubo más pequeño y animación suave
  meshRef.current.scale.set(scale, scale, scale)
  })

  return (
    <>
      <OrbitControls />
      <mesh ref={meshRef}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>
    </>
  )
}
