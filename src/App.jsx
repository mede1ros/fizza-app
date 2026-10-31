import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import AppShell from '@/components/AppShell';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MonthProvider } from '@/lib/useMonth';
import Dashboard from '@/pages/Dashboard';
import Expenses from '@/pages/Expenses';
import Goals from '@/pages/Goals';
import Recurring from '@/pages/Recurring';
import Shopping from '@/pages/Shopping';
import Settings from '@/pages/Settings';
import About from '@/pages/About';
import { exportBackup } from '@/lib/backupActions';

function App() {
  return (
    <ErrorBoundary onExport={exportBackup}>
      <QueryClientProvider client={queryClientInstance}>
        <MonthProvider>
          <Router>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/gastos" element={<Expenses />} />
                <Route path="/fixos" element={<Recurring />} />
                <Route path="/metas" element={<Goals />} />
                <Route path="/compras" element={<Shopping />} />
                <Route path="/config" element={<Settings />} />
                <Route path="/sobre" element={<About />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </MonthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
