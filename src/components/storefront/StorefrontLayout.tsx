import React from 'react';
import StorefrontHeader from './StorefrontHeader';
import StorefrontFooter from './StorefrontFooter';

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal da vitrine pública.
 * Envolve todas as páginas públicas com Header e Footer.
 */
const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-storefront-cream">
      <StorefrontHeader />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
};

export default StorefrontLayout;
