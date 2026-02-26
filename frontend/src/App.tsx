import { Routes, Route } from 'react-router-dom';

import Home from '@/modules/home/Home';
import PredictPage from '@/modules/predict/PredictPage';
import RevelationPage from '@/modules/revelation/RevelationPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/predict" element={<PredictPage />} />
      <Route path="/revelation" element={<RevelationPage />} />
    </Routes>
  );
}

export default App;
