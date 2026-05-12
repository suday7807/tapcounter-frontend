import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { I18nProvider } from './context/I18nContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import CounterScreen from './pages/CounterScreen';
import History from './pages/History';
import Settings from './pages/Settings';

function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/counters" replace />} />
            <Route path="counters" element={<Home />} />
            <Route path="counter/:id" element={<CounterScreen />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AppProvider>
    </I18nProvider>
  );
}

//Made in Bharat with ❤️ by Uday

export default App;