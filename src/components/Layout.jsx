import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, History, Settings } from 'lucide-react';

const tabs = [
  { path: '/counters', label: 'Counters', icon: Calculator },
  { path: '/history', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings }
];

function Layout() {
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      <main className={`flex-1 overflow-hidden ${isSettingsPage ? 'overflow-y-auto' : ''}`}>
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-black/5 dark:border-white/5 safe-area-bottom z-40">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {tabs.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center w-full h-full gap-1 text-xs
                transition-all duration-300
                ${isActive ? 'text-primary' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
              `}
            >
              {({ isActive }) => (
                <>
                  <tab.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px w-8 h-0.5 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default Layout;