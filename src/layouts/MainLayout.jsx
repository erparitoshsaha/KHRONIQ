import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import WarrantyDrawer from '../components/WarrantyDrawer';
import UpdatesDrawer from '../components/UpdatesDrawer';
import ScrollToTop from '../components/ScrollToTop';

export default function MainLayout({ children, onPageChange, currentPage }) {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-luxury-bg flex flex-col font-sans select-none">
      {/* Navigation */}
      <Navbar
        onCartOpen={() => setCartDrawerOpen(true)}
        onPageChange={onPageChange}
        currentPage={currentPage}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onPageChange={onPageChange}
      />

      {/* Warranty Drawer */}
      <WarrantyDrawer
        isOpen={warrantyOpen}
        onClose={() => setWarrantyOpen(false)}
      />

      {/* Updates Drawer */}
      <UpdatesDrawer
        isOpen={updatesOpen}
        onClose={() => setUpdatesOpen(false)}
      />

      <button
        onClick={() => setWarrantyOpen(true)}
        className="fixed right-0 bottom-24 font-extrabold text-[11px] sm:text-[12px] tracking-[0.22em] uppercase py-4 px-2 rounded-l border border-r-0 border-[#047857]/40 shadow-[0_4px_25px_rgba(0,0,0,0.55)] hover:opacity-90 transition-all duration-300 z-40 cursor-pointer"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          background: "linear-gradient(135deg, #047857 0%, #065f46 45%, #022c22 100%)",
          color: "#FFFFFF",
          WebkitTextFillColor: "#FFFFFF",
          textShadow: "0 0 2px rgba(255,255,255,0.8)",
        }}
      >
        WARRANTY
      </button>
      {/* Main Content Area */}
      <main className={['home', 'gifting', 'shop'].includes(currentPage) ? 'flex-1 w-full' : 'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              onUpdatesOpen: () => setUpdatesOpen(true),
              onUpdatesClose: () => setUpdatesOpen(false),
              updatesOpen
            });
          }
          return child;
        })}
      </main>

      {/* Footer */}
      <Footer onPageChange={onPageChange} onWarrantyOpen={() => setWarrantyOpen(true)} />

      {/* Scroll to Top Scroller */}
      <ScrollToTop />
    </div>
  );
}
