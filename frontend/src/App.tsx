import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from '@/modules/home/Home';

const PredictPage = lazy(() => import('@/modules/predict/PredictPage'));
const RevelationPage = lazy(() => import('@/modules/revelation/RevelationPage'));
const AdvicePage = lazy(() => import('@/modules/advice/AdvicePage'));
const AdminAdvicePage = lazy(() => import('@/modules/advice/AdminAdvicePage'));
const AdminLoginPage = lazy(() => import('@/modules/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/modules/admin/AdminDashboardPage'));
const AdminDiaryPage = lazy(() => import('@/modules/admin/AdminDiaryPage'));
const BlogListPage = lazy(() => import('@/modules/blog/BlogListPage'));
const BlogDetailPage = lazy(() => import('@/modules/blog/BlogDetailPage'));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<PredictPage />} />
        <Route path="/advice" element={<AdvicePage />} />
        <Route path="/revelation" element={<RevelationPage />} />
        <Route path="/consejos" element={<AdminAdvicePage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/diario" element={<AdminDiaryPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
