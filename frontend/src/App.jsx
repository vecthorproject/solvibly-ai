import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'

import AuthProvider from './auth/AuthProvider.jsx';
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'

import DashboardPage from './pages/Dashboard.jsx';

import HelpPage from './pages/Help.jsx';
import PricingPage from './pages/Pricing.jsx';

import InsertYourDataPage from './pages/InsertYourData.jsx';
import UploadYourDocsPage from './pages/UploadYourDocs.jsx';

import ResultsPage from './pages/Results.jsx';

import LoginPage from './pages/Login.jsx';
import ClientsPage from './pages/Clients.jsx';
import ClientDetailPage from './pages/ClientDetail.jsx';
import SavedAnalysisPage from './pages/SavedAnalysis.jsx';

import PrivacyPage from './pages/Privacy.jsx';
import TermsPage from './pages/Terms.jsx';
import NotFoundPage from './pages/NotFound.jsx';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/insert-data" element={<InsertYourDataPage />} />
            <Route path="/upload-docs" element={<UploadYourDocsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/accedi" element={<LoginPage />} />
            <Route path="/clienti" element={<ClientsPage />} />
            <Route path="/clienti/:id" element={<ClientDetailPage />} />
            <Route path="/analisi/:id" element={<SavedAnalysisPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/termini" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </Router>
  )
}

export default App;
