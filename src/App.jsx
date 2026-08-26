import React, { useState, useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Static from './pages/Static';
import Customization from './pages/Customization';
import Gifting from './pages/Gifting';
import { fetchProducts, fetchCoupons, fetchUserProfile } from './store/slices/watchSlice';
import ResetPassword from './pages/ResetPassword';



function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCoupons());
    dispatch(fetchUserProfile());
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
      {renderPage()}
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

