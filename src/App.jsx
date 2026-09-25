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
  const initialRoute = parseRouteFromPath(
    typeof window !== 'undefined' ? window.location.pathname : '/',
    typeof window !== 'undefined' ? window.location.search : ''
  );
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
      const route = parseRouteFromPath(
        window.location.pathname,
        window.location.search
      );
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        setPageParams(event.state.params !== undefined ? event.state.params : route.params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
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

    let effectivePage = page;
    let effectiveParams = params;
    if (page === 'men') {
      effectivePage = 'shop';
      effectiveParams = { gender: 'men', ...(params || {}) };
    } else if (page === 'women') {
      effectivePage = 'shop';
      effectiveParams = { gender: 'women', ...(params || {}) };
    } else if (page === 'shop-all') {
      effectivePage = 'shop';
      effectiveParams = { shopAll: true, ...(params || {}) };
    }

    setCurrentPage(effectivePage);
    setPageParams(effectiveParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!options.skipHistory && typeof window !== 'undefined') {
      incrementNavCount();
      const currentNavIdx = typeof window.history.state?.navIdx === 'number' ? window.history.state.navIdx : 0;
      const nextNavIdx = currentNavIdx + 1;

      let targetPath = '/';
      if (effectivePage === 'product-detail') {
        let identifier = effectiveParams?.id || effectiveParams?.slug || '';
        // If product object was passed or found in store, generate canonical identifier
        if (effectiveParams?.product) {
          identifier = getProductIdentifier(effectiveParams.product, products);
        } else if (identifier) {
          const found = findProductInList(products, identifier);
          if (found) {
            identifier = getProductIdentifier(found, products);
          }
        }
        targetPath = identifier ? `/product/${identifier}` : '/shop';
      } else if (effectivePage === 'shop') {
        if (page === 'men') {
          targetPath = '/men';
        } else if (page === 'women') {
          targetPath = '/women';
        } else if (page === 'shop-all') {
          targetPath = '/shop-all';
        } else if (effectiveParams?.shopAll) {
          targetPath = '/shop';
        } else if (effectiveParams) {
          const queryParams = new URLSearchParams();
          if (effectiveParams.gender) {
            queryParams.set('gender', effectiveParams.gender);
          }
          if (effectiveParams.category) {
            queryParams.set('category', effectiveParams.category);
          }
          if (effectiveParams.search) {
            queryParams.set('search', effectiveParams.search);
          }
          if (effectiveParams.minPrice !== undefined && effectiveParams.minPrice !== null) {
            queryParams.set('minPrice', effectiveParams.minPrice);
          }
          if (effectiveParams.maxPrice !== undefined && effectiveParams.maxPrice !== null) {
            queryParams.set('maxPrice', effectiveParams.maxPrice);
          }
          const qs = queryParams.toString();
          targetPath = qs ? `/shop?${qs}` : '/shop';
        } else {
          targetPath = '/shop';
        }
      } else if (effectivePage === 'cart') {
        targetPath = '/cart';
      } else if (effectivePage === 'checkout') {
        targetPath = '/checkout';
      } else if (effectivePage === 'profile') {
        targetPath = '/profile';
      } else if (effectivePage === 'login') {
        targetPath = '/login';
      } else if (effectivePage === 'admin') {
        targetPath = '/admin';
      } else if (effectivePage === 'customization') {
        targetPath = '/customization';
      } else if (effectivePage === 'gifting') {
        targetPath = '/gifting';
      } else if (effectivePage === 'reset-password') {
        targetPath = `/reset-password/${effectiveParams?.token || ''}`;
      } else if (effectivePage === 'static') {
        const view = effectiveParams?.view || 'about';
        const queryParams = new URLSearchParams();
        if (effectiveParams?.id) queryParams.set('id', effectiveParams.id);
        const qs = queryParams.toString();
        targetPath = qs ? `/${view}?${qs}` : `/${view}`;
      }


      const currentFullUrl = window.location.pathname + window.location.search;
      if (currentFullUrl !== targetPath) {
        window.history.pushState({ page: effectivePage, params: effectiveParams, navIdx: nextNavIdx }, '', targetPath);
      } else {
        window.history.replaceState({ page: effectivePage, params: effectiveParams, navIdx: currentNavIdx }, '', targetPath);
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

