import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SampleAuditPage from './pages/SampleAuditPage';
import OnboardingFlow from './pages/OnboardingFlow';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/sample-audit" element={<SampleAuditPage />} />
    </Routes>
  );
}

export default App;
