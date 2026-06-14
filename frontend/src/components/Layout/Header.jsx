import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cloud, BarChart3, Settings, Boxes, Brain } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const navigation = [
    { name: 'VMs', href: '/', icon: Cloud },
    { name: 'Kubernetes', href: '/k8s', icon: Boxes },
    { name: 'LLMs', href: '/llms', icon: Brain },
    { name: 'Statistics', href: '/stats', icon: BarChart3 },
    { name: 'Admin', href: '/admin', icon: Settings },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <h1 className="text-[1.375rem] font-display font-normal text-gray-700">
                  Mini Board
                </h1>
              </div>
              <span className="hidden sm:inline-block text-sm text-gray-500 border-l border-gray-300 pl-3 ml-1">
                Cloud VM Catalog
              </span>
            </Link>
          </div>

          {/* Navigation — Google Cloud tab style */}
          <nav className="hidden md:flex h-full items-stretch space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex items-center space-x-2 px-4 text-sm font-medium transition-colors duration-150 border-b-[3px] ${
                    active
                      ? 'text-primary-700 border-primary-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded text-base font-medium transition-colors duration-150 ${
                  isActive(item.href)
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Header;
