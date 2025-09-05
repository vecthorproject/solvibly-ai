import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'

import DashboardPage from './pages/Dashboard.jsx';

import HelpPage from './pages/Help.jsx';
import PricingPage from './pages/Pricing.jsx';

import InsertYourDataPage from './pages/InsertYourData.jsx';

import ResultsPage from './pages/Results.jsx';


function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/insert-data" element={<InsertYourDataPage />} />
          <Route path="/results" element={<ResultsPage />} />
          {/* Here add other Route(s) */}
        </Routes>
      </main>
      <Footer />
    </Router>
  )
}

export default App;