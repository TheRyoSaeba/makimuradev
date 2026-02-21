import { useState } from 'react'
import Scene from './components/canvas/Scene'
import { Menu } from './components/dom/Menu'
import './index.css'

function App() {
    const [view, setView] = useState('main')

    return (
        <>
            <Scene setView={setView} />
            <Menu view={view} setView={setView} />
        </>
    )
}

export default App
