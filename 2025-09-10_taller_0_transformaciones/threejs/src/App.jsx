import { Canvas } from "@react-three/fiber"
import Scene from "./components/Scene"
import "./App.css"

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Scene />
    </Canvas>
  )
}

export default App
