import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { Menu, X, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  isDark,
  onToggleDark
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Section 6.3 & 10.3: Nav hides on scroll down (250ms), shows on scroll up. Gains blur background + border after 8px scroll.
  React.useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 8);

      if (mobileMenuOpen) {
        setIsVisible(true);
        return;
      }

      if (currentScrollY > 64 && currentScrollY > lastScrollY) {
        // Scrolling down past header height
        setIsVisible(false);
      } else {
        // Scrolling up or at top
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'How it works', path: '/how-it-works' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Safety', path: '/safety' },
    { label: 'Become a helper', path: '/become-a-helper' },
    { label: 'FAQ', path: '/faq' },
  ];

  return (
    <header
      className={`sticky top-0 z-[200] w-full h-16 transition-all duration-250 ease-standard ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled
          ? 'bg-white/90 dark:bg-neutral-dark-page/90 backdrop-blur-md border-b border-neutral-border dark:border-neutral-dark-border shadow-sm'
          : 'bg-white/70 dark:bg-neutral-dark-page/70 backdrop-blur-none border-b border-transparent'
      }`}
    >
      <div className="max-w-hero mx-auto h-full px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate('/')}
          className="hover:opacity-90 transition-opacity focus:outline-none"
          aria-label="NEEDIT Home"
        >
          <Logo size="md" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`text-sm font-medium transition-colors hover:text-brand-indigo dark:hover:text-brand-indigo-darkmode ${
                currentPath === link.path
                  ? 'text-brand-indigo dark:text-brand-indigo-darkmode font-semibold'
                  : 'text-neutral-secondary dark:text-neutral-dark-secondary'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDark}
            className="w-9 h-9 rounded-btn flex items-center justify-center text-neutral-secondary dark:text-neutral-dark-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Log in button */}
          <button
            onClick={() => onNavigate('/login')}
            className="hidden sm:inline-flex h-10 px-4 items-center justify-center rounded-btn text-sm font-medium text-neutral-body dark:text-neutral-dark-text hover:bg-neutral-surface-alt dark:hover:bg-slate-800 transition-colors"
          >
            Log in
          </button>

          {/* Get started primary CTA */}
          <button
            onClick={() => onNavigate('/register')}
            className="h-10 px-4 sm:px-5 inline-flex items-center justify-center rounded-btn bg-brand-indigo hover:bg-brand-indigo-dark text-white text-sm font-medium shadow-sm transition-colors"
          >
            Get started
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-btn flex items-center justify-center text-neutral-secondary dark:text-neutral-dark-secondary hover:bg-neutral-surface-alt dark:hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-border dark:border-neutral-dark-border bg-white dark:bg-neutral-dark-card px-4 pt-3 pb-6 shadow-e2 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  onNavigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2.5 px-3 rounded-input text-sm font-medium transition-colors ${
                  currentPath === link.path
                    ? 'bg-brand-indigo-light text-brand-indigo dark:bg-brand-indigo/20 dark:text-brand-indigo-darkmode'
                    : 'text-neutral-body dark:text-neutral-dark-text hover:bg-neutral-surface-alt dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-neutral-border dark:border-slate-700 flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigate('/login');
                setMobileMenuOpen(false);
              }}
              className="w-full h-11 rounded-btn border border-neutral-border dark:border-slate-700 text-sm font-medium text-neutral-body dark:text-neutral-dark-text hover:bg-neutral-surface-alt"
            >
              Log in
            </button>
            <button
              onClick={() => {
                onNavigate('/register');
                setMobileMenuOpen(false);
              }}
              className="w-full h-11 rounded-btn bg-brand-indigo text-white text-sm font-medium hover:bg-brand-indigo-dark"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
