import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { WebAppProvider, useWebApp } from './context/WebAppContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AppHeader } from './components/layout/AppHeader';
import { AppBottomNav } from './components/layout/AppBottomNav';
import { AppSidebar } from './components/layout/AppSidebar';
import { ConsentBanner } from './components/common/ConsentBanner';

// Public Pages
import { Home } from './pages/public/Home';
import { HowItWorks } from './pages/public/HowItWorks';
import { Pricing } from './pages/public/Pricing';
import { Safety } from './pages/public/Safety';
import { ProhibitedItems } from './pages/public/ProhibitedItems';
import { BecomeAHelper } from './pages/public/BecomeAHelper';
import { FAQ } from './pages/public/FAQ';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';
import { LegalPages } from './pages/public/LegalPages';
import { AuthPages } from './pages/public/AuthPages';

// Onboarding
import { OnboardingFlow } from './pages/onboarding/OnboardingFlow';

// Customer Pages
import { CustomerHome } from './pages/customer/CustomerHome';
import { PostRequest } from './pages/customer/PostRequest';
import { MyOrders } from './pages/customer/MyOrders';
import { OrderDetail } from './pages/customer/OrderDetail';
import { OrderHistory } from './pages/customer/OrderHistory';

// Helper Pages
import { RequestFeed } from './pages/helper/RequestFeed';
import { RequestDetail } from './pages/helper/RequestDetail';
import { MyJobs } from './pages/helper/MyJobs';
import { JobDetail } from './pages/helper/JobDetail';
import { Availability } from './pages/helper/Availability';

// Shared App Pages
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { ProfilePage } from './pages/shared/ProfilePage';
import { ReportProblemPage } from './pages/shared/ReportProblemPage';

// Club Console
import { AdminPortal } from './pages/staff/AdminPortal';

// Special Screens
import { SpecialScreens } from './pages/special/SpecialScreens';

const AppContent: React.FC = () => {
  const { role, setRole, currentUser, isSuperAdmin } = useWebApp();
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname || '/'
  );
  const [isDark, setIsDark] = useState<boolean>(false);

  // Sync dark class on html tag
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle client-side navigation
  const navigate = (path: string) => {
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      window.history.pushState({}, '', path);
    } catch {
      // safe fallback in sandboxed env
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isPublicPage =
    currentPath === '/' ||
    currentPath === '/how-it-works' ||
    currentPath === '/pricing' ||
    currentPath === '/safety' ||
    currentPath === '/prohibited-items' ||
    currentPath === '/become-a-helper' ||
    currentPath === '/faq' ||
    currentPath === '/about' ||
    currentPath === '/contact' ||
    currentPath === '/privacy' ||
    currentPath === '/terms' ||
    currentPath === '/helper-rules' ||
    currentPath === '/login' ||
    currentPath === '/register';

  const isOnboardingPage =
    currentPath.startsWith('/app/verify') ||
    currentPath.startsWith('/app/profile-setup') ||
    currentPath.startsWith('/app/policy') ||
    currentPath.startsWith('/app/role');

  const isAdminPage = currentPath === '/app/admin';
  const isSpecialPage = currentPath === '/404' || currentPath.startsWith('/special/');

  // Determine user initials for avatar
  const userInitials = currentUser.isStaff
    ? 'ST'
    : currentUser.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'AS';

  // Determine which page content to render
  const renderContent = () => {
    // 1. Public Pages
    if (currentPath === '/') return <Home onNavigate={navigate} />;
    if (currentPath === '/how-it-works') return <HowItWorks onNavigate={navigate} />;
    if (currentPath === '/pricing') return <Pricing onNavigate={navigate} />;
    if (currentPath === '/safety') return <Safety onNavigate={navigate} />;
    if (currentPath === '/prohibited-items') return <ProhibitedItems onNavigate={navigate} />;
    if (currentPath === '/become-a-helper') return <BecomeAHelper onNavigate={navigate} />;
    if (currentPath === '/faq') return <FAQ onNavigate={navigate} />;
    if (currentPath === '/about') return <About onNavigate={navigate} />;
    if (currentPath === '/contact') return <Contact onNavigate={navigate} />;
    if (currentPath === '/privacy') return <LegalPages type="privacy" onNavigate={navigate} />;
    if (currentPath === '/terms') return <LegalPages type="terms" onNavigate={navigate} />;
    if (currentPath === '/helper-rules') return <LegalPages type="helper-rules" onNavigate={navigate} />;
    if (currentPath === '/login') {
      return (
        <AuthPages
          onNavigate={navigate}
        />
      );
    }
    if (currentPath === '/register') {
      return (
        <AuthPages
          onNavigate={navigate}
        />
      );
    }

    // 2. Onboarding Flow
    if (currentPath === '/app/verify') return <OnboardingFlow step="verify" onNavigate={navigate} onSetRole={setRole} />;
    if (currentPath === '/app/profile-setup') return <OnboardingFlow step="profile-setup" onNavigate={navigate} onSetRole={setRole} />;
    if (currentPath === '/app/policy') return <OnboardingFlow step="policy" onNavigate={navigate} onSetRole={setRole} />;
    if (currentPath === '/app/role') return <OnboardingFlow step="role" onNavigate={navigate} onSetRole={setRole} />;

    if (currentPath === '/app/admin') return <AdminPortal />;

    // Client checks are UX only; staff API endpoints enforce authorization.
    if (!isSuperAdmin) {
      const isCustomerRoute =
        currentPath === '/app/home' ||
        currentPath === '/app/post' ||
        currentPath.startsWith('/app/orders') ||
        currentPath === '/app/history';
      const isHelperRoute = currentPath.startsWith('/app/helper');
      if (isCustomerRoute && role !== 'customer') {
        return <SpecialScreens type="access-denied" onNavigate={navigate} />;
      }
      if (isHelperRoute && role !== 'helper') {
        return <SpecialScreens type="access-denied" onNavigate={navigate} />;
      }
    }

    // 3. Customer Pages
    if (currentPath === '/app/home') return <CustomerHome onNavigate={navigate} />;
    if (currentPath === '/app/post') return <PostRequest onNavigate={navigate} onPostSuccess={(id) => navigate(`/app/orders/${id}`)} />;
    if (currentPath === '/app/orders') return <MyOrders onNavigate={navigate} />;
    if (currentPath.startsWith('/app/orders/')) {
      const id = currentPath.split('/')[3] || 'ORD-1092';
      return <OrderDetail orderId={id} onNavigate={navigate} />;
    }
    if (currentPath === '/app/history') return <OrderHistory onNavigate={navigate} />;

    // 4. Helper Pages
    if (currentPath === '/app/helper/feed') return <RequestFeed onNavigate={navigate} />;
    if (currentPath.startsWith('/app/helper/feed/')) {
      const id = currentPath.split('/')[4] || 'ORD-1094';
      return <RequestDetail orderId={id} onNavigate={navigate} onAcceptOrder={() => {}} />;
    }
    if (currentPath === '/app/helper/jobs') return <MyJobs onNavigate={navigate} />;
    if (currentPath.startsWith('/app/helper/jobs/')) {
      const id = currentPath.split('/')[4] || 'ORD-1092';
      return <JobDetail orderId={id} onNavigate={navigate} />;
    }
    if (currentPath === '/app/helper/availability') return <Availability onNavigate={navigate} />;
    // Shops are cut for the pilot — anything pointing at the old portal lands
    // on the job list instead of a mock storefront.
    if (currentPath === '/app/helper/shops') return <MyJobs onNavigate={navigate} />;

    // 5. Shared Pages — order chat lives inside each order view; there is no
    // global chat list, so /app/chat lands on the user's order list instead.
    if (currentPath.startsWith('/app/chat')) {
      return role === 'helper' ? <MyJobs onNavigate={navigate} /> : <MyOrders onNavigate={navigate} />;
    }
    if (currentPath === '/app/notifications') return <NotificationsPage onNavigate={navigate} />;
    if (currentPath === '/app/profile') return <ProfilePage role={role} onNavigate={navigate} onLogout={() => navigate('/login')} />;
    if (currentPath === '/app/ask') return role === 'helper' ? <MyJobs onNavigate={navigate} /> : <MyOrders onNavigate={navigate} />;
    if (currentPath === '/app/report') return <ReportProblemPage onNavigate={navigate} />;

    // 6. Special Error Screens
    if (currentPath === '/404') return <SpecialScreens type="404" onNavigate={navigate} />;
    if (currentPath === '/special/access-denied') return <SpecialScreens type="access-denied" onNavigate={navigate} />;
    if (currentPath === '/special/session-expired') return <SpecialScreens type="session-expired" onNavigate={navigate} />;
    if (currentPath === '/special/account-suspended') return <SpecialScreens type="account-suspended" onNavigate={navigate} />;
    if (currentPath === '/special/offline') return <SpecialScreens type="offline" onNavigate={navigate} />;
    if (currentPath === '/special/maintenance') return <SpecialScreens type="maintenance" onNavigate={navigate} />;

    // Default fallback: 404
    return <SpecialScreens type="404" onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-page-bg dark:bg-neutral-dark-page text-neutral-body dark:text-neutral-dark-text transition-colors">
      {/* Dynamic Top Bar */}
      {isPublicPage ? (
        <Header
          currentPath={currentPath}
          onNavigate={navigate}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
        />
      ) : (
        <AppHeader
          role={role}
          onRoleChange={(newRole) => {
            setRole(newRole);
            if (newRole === 'customer') navigate('/app/home');
            else if (newRole === 'helper') navigate('/app/helper/feed');
            else if (newRole === 'club') navigate('/app/admin');
          }}
          onNavigate={navigate}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          userInitials={userInitials}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Main Body with Sidebar (for App/Club views) */}
      <div className="flex-1 flex w-full">
        {!isPublicPage && !isOnboardingPage && !isSpecialPage && !isAdminPage && (
          <AppSidebar
            role={role}
            currentPath={currentPath}
            onNavigate={navigate}
          />
        )}

        <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden">
          <div key={currentPath} className="page-enter">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Public Footer */}
      {isPublicPage && <Footer onNavigate={navigate} />}

      {/* App Mobile Bottom Tab Bar (Customer vs Helper tabs) */}
      {!isPublicPage && !isOnboardingPage && !isAdminPage && !isSpecialPage && (
        <AppBottomNav
          role={role}
          currentPath={currentPath}
          onNavigate={navigate}
          hideOnCurrentScreen={currentPath.includes('/orders/') || currentPath.includes('/jobs/')}
        />
      )}

      {/* India DPDP Privacy & Cookie Banner */}
      <ConsentBanner onNavigate={navigate} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WebAppProvider>
      <AppContent />
    </WebAppProvider>
  );
};

export default App;
