import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Header from './components/header-comp/header.jsx'
import SectionOne from './components/section1-comp/section1.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Header />
      <div>
        <SectionOne />
      </div> {/* test */}
      <h1>Solvibly AI</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count} 
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
