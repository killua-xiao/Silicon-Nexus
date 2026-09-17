import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nProvider';
import { ToastProvider } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { DocsPage } from './pages/DocsPage';
import { ConnectPage } from './pages/ConnectPage';
import { PricingPage } from './pages/PricingPage';
import { ConsoleLayout } from './pages/ConsoleLayout';
import { ConsoleOverviewPage } from './pages/ConsoleOverviewPage';
import { AgentsPage } from './pages/AgentsPage';
import { ConsoleFeedPage } from './pages/ConsoleFeedPage';
import { ConsoleSitesPage } from './pages/ConsoleSitesPage';
import { ConsoleAccountPage } from './pages/ConsoleAccountPage';
import { VerifyPage } from './pages/VerifyPage';
import { ResetPage } from './pages/ResetPage';
import { DirectoryPage } from './pages/DirectoryPage';
import { FeedPage } from './pages/FeedPage';
import { LegalPage } from './pages/LegalPage';

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/connect" element={<ConnectPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy" element={<LegalPage />} />
            <Route path="/terms" element={<LegalPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/reset" element={<ResetPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/feed/:slug" element={<FeedPage />} />
            <Route path="/console" element={<ConsoleLayout />}>
              <Route index element={<ConsoleOverviewPage />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="feed" element={<ConsoleFeedPage />} />
              <Route path="sites" element={<ConsoleSitesPage />} />
              <Route path="account" element={<ConsoleAccountPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </I18nProvider>
  );
}
