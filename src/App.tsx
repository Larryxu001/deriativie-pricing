import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PricingPage from './pages/PricingPage';
import HistoryPage from './pages/HistoryPage';
import BatchPage from './pages/BatchPage';
import ResearchPage from './pages/ResearchPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing/:productType" element={<PricingPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/batch" element={<BatchPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

