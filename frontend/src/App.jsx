import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Layout from './components/Layout.jsx';
import Dashboard from './components/Dashboard.jsx';
import CreateRFP from './components/CreateRFP.jsx';
import VendorManagement from './components/VendorManagement.jsx';
import RFPDetail from './components/RFPDetail.jsx';
import ProposalComparison from './components/ProposalComparison.jsx';
import EmailManagement from './components/EmailManagement.jsx';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#18181b',
            color: '#fafafa',
            borderRadius: '0.75rem',
          },
          success: {
            iconTheme: {
              primary: '#14b8a6',
              secondary: '#fafafa',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#fafafa',
            },
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-rfp" element={<CreateRFP />} />
          <Route path="/vendors" element={<VendorManagement />} />
          <Route path="/emails" element={<EmailManagement />} />
          <Route path="/rfp/:id" element={<RFPDetail />} />
          <Route path="/rfp/:id/compare" element={<ProposalComparison />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;