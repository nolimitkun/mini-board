import React from 'react';
import Header from './Header';

const Layout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {title && (
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[1.75rem] leading-9 font-display font-normal text-gray-800">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center space-x-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;
