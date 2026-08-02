import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { DealDetail } from "./pages/DealDetail";
import { Onboarding } from "./pages/Onboarding";
import { Landing } from "./pages/Landing";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding/*" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/deals/:dealId" element={<DealDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
