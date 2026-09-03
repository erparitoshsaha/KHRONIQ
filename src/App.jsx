import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Login from './pages/Login';
import { fetchProducts, fetchCoupons, fetchUserProfile, fetchFilters, fetchFooterSections, fetchContentSections } from './store/slices/watchSlice';

// Lazy-load secondary / heavy routes to split bundles cleanly
const Checkout = lazy(() => import('./pages/Checkout'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const Static = lazy(() => import('./pages/Static'));
const Customization = lazy(() => import('./pages/Customization'));
const Gifting = lazy(() => import('./pages/Gifting'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-luxury-gold">
      <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught runtime exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="p-4 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold">
            <span className="font-serif text-2xl font-bold">K</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-white uppercase tracking-wider">
            Notice: Temporary Interface Interruption
          </h2>
          <p className="text-xs text-gray-400 max-w-md">
            An unexpected error occurred while loading this view. You can return to the boutique home or reload the page.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
                else window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-luxury-gold text-black text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition hover:bg-luxury-gold/90"
              style={{ backgroundColor: '#c8a96a', color: '#0a0a0a' }}
            >
              Return to Homepage
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCoupons());
    dispatch(fetchUserProfile());
    dispatch(fetchFilters());
    dispatch(fetchFooterSections());
    dispatch(fetchContentSections());
  }, [dispatch]);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/reset-password\/(.+)$/);
    if (match) {
      setCurrentPage('reset-password');
      setPageParams({ token: match[1] });
    }
  }, []);

  const handlePageChange = (page, params = null) => {
    if (page === 'home') {
      localStorage.setItem('khroniq_is_gifting_journey', 'false');
    }
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onPageChange={handlePageChange} />;
      case 'shop':
        return <Shop onPageChange={handlePageChange} filterParams={pageParams} />;
      case 'product-detail':
        return <ProductDetail params={pageParams} onPageChange={handlePageChange} />;
      case 'cart':
        return <CartPage onPageChange={handlePageChange} />;
      case 'checkout':
        return <Checkout params={pageParams} onPageChange={handlePageChange} />;
      case 'profile':
        return <Profile params={pageParams} onPageChange={handlePageChange} />;
      case 'login':
        return <Login params={pageParams} onPageChange={handlePageChange} />;
      case 'admin':
        return <Admin onPageChange={handlePageChange} />;
      case 'static':
        return <Static params={pageParams} onPageChange={handlePageChange} />;
      case 'reset-password':
        return <ResetPassword params={pageParams} onPageChange={handlePageChange} />;
      case 'customization':
        return <Customization onPageChange={handlePageChange} params={pageParams} />;
      case 'gifting':
        return <Gifting onPageChange={handlePageChange} />;
      default:
        return <Home onPageChange={handlePageChange} />;
    }
  };

  return (
    <MainLayout onPageChange={handlePageChange} currentPage={currentPage}>
      <ErrorBoundary onReset={() => handlePageChange('home')}>
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </ErrorBoundary>
    </MainLayout>
  );

}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

