import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import { parseRouteFromPath, getProductIdentifier, findProductInList, incrementNavCount } from './utils/productRouting';
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

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
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
            An unexpected error occurred while loading this view. You can return to the homepage or reload the page.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
                else window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition shadow-xs"
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              Return to Homepage
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 border border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition shadow-xs"
              style={{ borderColor: '#d4d4d4', color: '#111111', backgroundColor: '#ffffff' }}
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
  const initialRoute = parseRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [pageParams, setPageParams] = useState(initialRoute.params);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const dispatch = useDispatch();
  const products = useSelector(state => state.watch.products);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCoupons());
    dispatch(fetchUserProfile());
    dispatch(fetchFilters());
    dispatch(fetchFooterSections());
    dispatch(fetchContentSections());
  }, [dispatch]);

  // Synchronize history state on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingNavIdx = window.history.state?.navIdx;
      window.history.replaceState(
        {
          page: initialRoute.page,
          params: initialRoute.params,
          navIdx: typeof existingNavIdx === 'number' ? existingNavIdx : 0
        },
        '',
        window.location.pathname + window.location.search
      );
    }
  }, []);

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        setPageParams(event.state.params || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const route = parseRouteFromPath(window.location.pathname);
        setCurrentPage(route.page);
        setPageParams(route.params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePageChange = (page, params = null, options = {}) => {
    if (page === 'home') {
      localStorage.setItem('khroniq_is_gifting_journey', 'false');
    }
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!options.skipHistory && typeof window !== 'undefined') {
      incrementNavCount();
      const currentNavIdx = typeof window.history.state?.navIdx === 'number' ? window.history.state.navIdx : 0;
      const nextNavIdx = currentNavIdx + 1;

      let targetPath = '/';
      if (page === 'product-detail') {
        let identifier = params?.id || params?.slug || '';
        // If product object was passed or found in store, generate canonical identifier
        if (params?.product) {
          identifier = getProductIdentifier(params.product, products);
        } else if (identifier) {
          const found = findProductInList(products, identifier);
          if (found) {
            identifier = getProductIdentifier(found, products);
          }
        }
        targetPath = identifier ? `/product/${identifier}` : '/shop';
      } else if (page === 'shop') {
        targetPath = '/shop';
      } else if (page === 'cart') {
        targetPath = '/cart';
      } else if (page === 'checkout') {
        targetPath = '/checkout';
      } else if (page === 'profile') {
        targetPath = '/profile';
      } else if (page === 'login') {
        targetPath = '/login';
      } else if (page === 'admin') {
        targetPath = '/admin';
      } else if (page === 'customization') {
        targetPath = '/customization';
      } else if (page === 'gifting') {
        targetPath = '/gifting';
      } else if (page === 'reset-password') {
        targetPath = `/reset-password/${params?.token || ''}`;
      } else if (page === 'static') {
        targetPath = '/';
      }

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page, params, navIdx: nextNavIdx }, '', targetPath);
      } else {
        window.history.replaceState({ page, params, navIdx: currentNavIdx }, '', targetPath);
      }
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            onPageChange={handlePageChange}
            onUpdatesOpen={() => setUpdatesOpen(true)}
            onUpdatesClose={() => setUpdatesOpen(false)}
            updatesOpen={updatesOpen}
          />
        );
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
        return <Gifting onPageChange={handlePageChange} params={pageParams} />;
      default:
        return (
          <Home
            onPageChange={handlePageChange}
            onUpdatesOpen={() => setUpdatesOpen(true)}
            onUpdatesClose={() => setUpdatesOpen(false)}
            updatesOpen={updatesOpen}
          />
        );
    }
  };

  return (
    <MainLayout
      onPageChange={handlePageChange}
      currentPage={currentPage}
      updatesOpen={updatesOpen}
      onUpdatesOpen={() => setUpdatesOpen(true)}
      onUpdatesClose={() => setUpdatesOpen(false)}
    >
      <ErrorBoundary resetKey={currentPage} onReset={() => handlePageChange('home')}>
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

