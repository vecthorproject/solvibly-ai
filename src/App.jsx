import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Header from './components/header-comp/header.jsx'
import Footer from './components/footer-comp/footer.jsx'

import DashboardPage from './pages/dashboard.jsx';
import HelpPage from './pages/help.jsx';


function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/help" element={<HelpPage />} />
          {/* Here add other Route(s) */}
        </Routes>
      </main>
      <Footer />
    </Router>
  )
}

export default App;
