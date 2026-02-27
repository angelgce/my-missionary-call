import { Routes, Route } from 'react-router-dom';

import Home from '@/modules/home/Home';
import PredictPage from '@/modules/predict/PredictPage';
import RevelationPage from '@/modules/revelation/RevelationPage';
import AdvicePage from '@/modules/advice/AdvicePage';
import AdminAdvicePage from '@/modules/advice/AdminAdvicePage';
import AdminLoginPage from '@/modules/admin/AdminLoginPage';
import AdminDashboardPage from '@/modules/admin/AdminDashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/predict" element={<PredictPage />} />
      <Route path="/advice" element={<AdvicePage />} />
      <Route path="/revelation" element={<RevelationPage />} />
      <Route path="/consejos" element={<AdminAdvicePage />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
    </Routes>
  );
}

export default App;
