import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Header from './components/header-comp/header.jsx'
import SectionOne from './components/section1-comp/section1.jsx'

function App() {
  return (
    <>
    <Header />
      <div>
        <SectionOne />
      </div>
    </>
  )
}

export default App
