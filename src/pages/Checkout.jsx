import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createRazorpayOrder, verifyRazorpayPayment, validateCoupon, selectCurrentCurrency, formatPrice, getDiscountedPrice, getProductMrp, getSellingPrice, updateUserProfile, removeFromCart } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import { getExpectedDeliveryDate } from '../utils/deliveryUtils';

import confetti from 'canvas-confetti';
import { CheckCircle2, CreditCard, Landmark, ArrowRight, ArrowLeft, ShieldCheck, Gift, Check, Tag, X, Loader2, Info, Lock, Truck, RotateCcw, Headphones } from 'lucide-react';
import BackButton from '../components/BackButton';
import CountrySelect from '../components/CountrySelect';
import { INDIAN_STATES } from '../constants/countries';

export default function Checkout({ params, onPageChange }) {
  const dispatch = useDispatch();
  const cart = useSelector(state => state.watch.cart);
  const products = useSelector(state => state.watch.products);
  const currentUser = useSelector(state => state.watch.currentUser);
  const currentCurrency = useSelector(selectCurrentCurrency);

  const [appliedCoupon, setAppliedCoupon] = useState(params?.appliedCoupon || null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const isGiftingJourney = localStorage.getItem('khroniq_is_gifting_journey') === 'true';
  const giftRelation = localStorage.getItem('khroniq_gift_relation') || '';
  const [step, setStep] = useState(isGiftingJourney ? 1 : 2); // 1: Gifting, 2: Shipping, 3: Payment, 4: Success
  const [shippingForm, setShippingForm] = useState(() => {
    let saved = null;
    if (typeof window !== 'undefined') {
      try {
        saved = JSON.parse(localStorage.getItem('khroniq_saved_shipping') || 'null');
      } catch (e) { }
    }
    return {
      fullName: currentUser?.name || saved?.fullName || '',
      phone: currentUser?.phone || currentUser?.shippingAddress?.phone || saved?.phone || '',
      houseNumber: currentUser?.shippingAddress?.houseNumber || saved?.houseNumber || '',
      streetAddress: currentUser?.shippingAddress?.streetAddress || saved?.streetAddress || '',
      landmark: currentUser?.shippingAddress?.landmark || saved?.landmark || '',
      city: currentUser?.shippingAddress?.city || saved?.city || '',
      state: currentUser?.shippingAddress?.state || saved?.state || 'Uttar Pradesh',
      zipCode: currentUser?.shippingAddress?.postalCode || saved?.zipCode || '',
      country: currentUser?.shippingAddress?.country || saved?.country || 'India',
      gstNumber: saved?.gstNumber || ''
    };
  });
  const isIndia = (shippingForm.country || '').trim().toLowerCase() === 'india';
  const [saveAddress, setSaveAddress] = useState(true);
  const [gstInput, setGstInput] = useState('');
  const [gstError, setGstError] = useState('');
  const [appliedGst, setAppliedGst] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('khroniq_saved_shipping') || 'null');
        return saved?.gstNumber || '';
      } catch (e) { }
    }
    return '';
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    document.title = 'Secure Checkout | KHRONIQ';
  }, []);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [giftPackage, setGiftPackage] = useState('standard'); // standard | gift-box | luxury
  const [giftNote, setGiftNote] = useState('');
  const [giftOccasion, setGiftOccasion] = useState('birthday'); // anniversary | birthday | retirement | other
  const [packagingType, setPackagingType] = useState('single'); // single | couple | none
  const [includeGiftCard, setIncludeGiftCard] = useState(true);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: currentUser?.name || ''
  });

  // Auto-set packaging type based on selected occasion (Anniversary -> couple, others -> single)
  useEffect(() => {
    if (giftOccasion === 'anniversary') {
      setPackagingType('couple');
    } else {
      setPackagingType('single');
    }
  }, [giftOccasion]);
  const [orderReceipt, setOrderReceipt] = useState(null);

  // Sync shipping details once current user profile is fetched/loaded
  useEffect(() => {
    if (currentUser) {
      setShippingForm(prev => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || '',
        phone: prev.phone || currentUser.phone || currentUser.shippingAddress?.phone || '',
        houseNumber: prev.houseNumber || currentUser.shippingAddress?.houseNumber || '',
        streetAddress: prev.streetAddress || currentUser.shippingAddress?.streetAddress || '',
        landmark: prev.landmark || currentUser.shippingAddress?.landmark || '',
        city: prev.city || currentUser.shippingAddress?.city || '',
        state: prev.state || currentUser.shippingAddress?.state || 'Uttar Pradesh',
        zipCode: prev.zipCode || currentUser.shippingAddress?.postalCode || '',
        country: (prev.country === 'India' || !prev.country) && currentUser.shippingAddress?.country
          ? currentUser.shippingAddress.country
          : (prev.country || 'India')
      }));
    }
  }, [currentUser]);

  // Indian GSTIN validation (15 characters: 2 state digits + 10 PAN alphanumeric + 1 entity + 1 'Z' + 1 check digit)
  const validateGstNumber = (gst) => {
    if (!gst) return false;
    const clean = gst.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(clean);
  };

  const handleApplyGst = () => {
    const clean = gstInput.trim().toUpperCase();
    if (!clean) {
      setGstError('Please enter a GST number.');
      return;
    }
    if (!validateGstNumber(clean)) {
      setGstError('Please enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5).');
      return;
    }
    setAppliedGst(clean);
    setGstError('');
    setShippingForm(prev => ({ ...prev, gstNumber: clean }));
  };

  const handleRemoveGst = () => {
    setAppliedGst('');
    setGstInput('');
    setGstError('');
    setShippingForm(prev => ({ ...prev, gstNumber: '' }));
  };

  // Compute prices
  const cartItemsWithDetails = cart.map(item => {
    const itemProdId = (item.productId?._id || item.productId)?.toString();
    const product = products.find(p => (p.id && p.id.toString() === itemProdId) || (p._id && p._id.toString() === itemProdId));
    const itemMrp = item.mrp || getProductMrp(product);
    const itemPrice = item.price !== undefined ? item.price : getSellingPrice(product);
    return { ...item, product, itemMrp, itemPrice };
  }).filter(item => item.product !== undefined);

  const getPackagingCost = (type) => {
    if (type === 'couple') return 900;
    if (type === 'single') return 450;
    return 0;
  };
  const packagingCost = isGiftingJourney ? getPackagingCost(packagingType) : 0;
  const giftCardCost = isGiftingJourney && includeGiftCard ? 100 : 0;
  const totalGiftingCost = packagingCost + giftCardCost;
  const mrpTotal = cartItemsWithDetails.reduce((sum, item) => sum + (item.itemMrp * item.quantity), 0);
  const subtotal = cartItemsWithDetails.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  const discount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.discountPercent / 100)) : 0;
  const finalSellingPrice = Math.max(0, subtotal - discount);
  const gst = Math.round(((finalSellingPrice * 18) / 118) * 100) / 100;
  const total = finalSellingPrice + totalGiftingCost;

  const handleShippingSubmit = (e) => {
    if (e) e.preventDefault();
    if (cartItemsWithDetails.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    if (!shippingForm.fullName?.trim() || !shippingForm.streetAddress?.trim() || !shippingForm.city?.trim() || !shippingForm.zipCode?.trim() || !shippingForm.phone?.trim() || !shippingForm.state?.trim()) {
      alert('Please fill out all required shipping details.');
      return;
    }

    // If customer entered text in GST field but forgot to click Apply
    if (gstInput.trim() && !appliedGst) {
      const clean = gstInput.trim().toUpperCase();
      if (!validateGstNumber(clean)) {
        setGstError('Please enter a valid 15-character GSTIN or clear the field to continue.');
        return;
      } else {
        setAppliedGst(clean);
        setShippingForm(prev => ({ ...prev, gstNumber: clean }));
      }
    }

    if (saveAddress && typeof window !== 'undefined') {
      try {
        localStorage.setItem('khroniq_saved_shipping', JSON.stringify({
          ...shippingForm,
          gstNumber: appliedGst || shippingForm.gstNumber || ''
        }));
      } catch (err) {
        console.warn('Could not save address to localStorage', err);
      }

      if (currentUser?.email) {
        dispatch(updateUserProfile(currentUser.name || shippingForm.fullName, currentUser.email, {
          ...(currentUser.shippingAddress || {}),
          houseNumber: shippingForm.houseNumber,
          streetAddress: shippingForm.streetAddress,
          landmark: shippingForm.landmark,
          city: shippingForm.city,
          state: shippingForm.state,
          postalCode: shippingForm.zipCode,
          country: shippingForm.country,
          phone: shippingForm.phone
        })).catch(() => { });
      }
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    const res = await dispatch(validateCoupon(couponInput.trim(), subtotal));
    setCouponLoading(false);
    if (res.success) {
      setAppliedCoupon(res.coupon);
      setCouponInput('');
    } else {
      setCouponError(res.message || 'Invalid coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleRazorpayPayment = async () => {
    if (cartItemsWithDetails.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    setProcessingPayment(true);

    const items = cartItemsWithDetails.map(item => ({
      productId: item.product?._id ? item.product._id.toString() : (item.product?.id || item.productId),
      name: item.product.name,
      price: item.itemPrice,
      quantity: item.quantity,
      image: item.product.image
    }));

    // 1. Create Razorpay order via backend with full items payload
    const orderRes = await dispatch(createRazorpayOrder({
      items,
      couponCode: appliedCoupon?.code || null,
      packagingCost: isGiftingJourney ? totalGiftingCost : 0
    }));

    if (!orderRes.success) {
      alert(orderRes.message || 'Could not initiate payment.');
      setProcessingPayment(false);
      return;
    }

    const { order, key_id } = orderRes;

    const giftingOptions = isGiftingJourney ? {
      isGifting: true,
      occasion: giftOccasion,
      relation: giftRelation,
      note: includeGiftCard ? giftNote : '',
      packaging: packagingType,
      packagingCost: packagingCost,
      includeGiftCard: includeGiftCard,
      giftCardCost: giftCardCost
    } : { isGifting: false };

    // 2. Open Razorpay's official checkout popup
    const options = {
      key: key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'KHRONIQ Watches',
      description: 'Timepiece Purchase',
      order_id: order.id,
      handler: async function (response) {
        // 3. Verify payment on backend, which then creates the real order
        const verifyRes = await dispatch(verifyRazorpayPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          items,
          subtotal,
          discount,
          total,
          shippingDetails: {
            ...shippingForm,
            gstNumber: appliedGst || shippingForm.gstNumber || ''
          },
          giftingOptions,
          couponCode: appliedCoupon?.code || null
        }));

        setProcessingPayment(false);

        if (verifyRes.success) {
          setOrderReceipt(verifyRes.order);
          setStep(4);
          localStorage.setItem('khroniq_is_gifting_journey', 'false');
          localStorage.removeItem('khroniq_gift_relation');

          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#c5a880', '#e10600', '#ffffff', '#1e293b']
          });
        } else {
          alert(verifyRes.message || 'Payment verification failed.');
        }
      },
      modal: {
        ondismiss: function () {
          setProcessingPayment(false);
        }
      },
      prefill: {
        name: shippingForm.fullName,
        email: currentUser?.email || ''
      },
      theme: {
        color: '#c5a880'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function () {
      alert('Payment failed. Please try again.');
      setProcessingPayment(false);
    });
    rzp.open();
  };

  const handleDownloadInvoice = async () => {
    if (!orderReceipt) return;

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 15;
    let y = 0;

    // ---------- Header band ----------
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('KHRONIQ', marginX, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('FINE TIMEPIECES', marginX, 21);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - marginX, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${orderReceipt.id}`, pageWidth - marginX, 21, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    y = 44;

    // ---------- Bill To / Invoice Details (two columns) ----------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BILL TO', marginX, y);
    doc.text('INVOICE DETAILS', pageWidth / 2 + 5, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const shipping = orderReceipt.shippingDetails || {};
    doc.text(shipping.fullName || '-', marginX, y);
    doc.text(`Date: ${new Date(orderReceipt.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2 + 5, y);
    y += 5;
    const fullStreet = [shipping.houseNumber, shipping.streetAddress || shipping.localAddress].filter(Boolean).join(', ');
    doc.text(fullStreet || '-', marginX, y);
    doc.text(`Payment: Razorpay`, pageWidth / 2 + 5, y);
    y += 5;
    if (shipping.landmark) {
      doc.text(`Landmark: ${shipping.landmark}`, marginX, y);
      y += 5;
    }
    doc.text(`${shipping.city || ''}${shipping.city ? ', ' : ''}${shipping.zipCode || ''}`, marginX, y);
    if (orderReceipt.paymentDetails?.last4) {
      doc.text(`Ref: •••• ${orderReceipt.paymentDetails.last4}`, pageWidth / 2 + 5, y);
    }
    y += 5;
    if (shipping.country) {
      doc.text(shipping.country, marginX, y);
      y += 5;
    }
    if (shipping.gstNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${shipping.gstNumber}`, marginX, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
    }

    y += 7;

    // ---------- Items table ----------
    const colX = { idx: marginX, item: marginX + 8, serial: 92, claim: 132, qty: 168, amount: pageWidth - marginX };

    const drawTableHeader = () => {
      doc.setFillColor(240, 240, 240);
      doc.rect(marginX, y - 5, pageWidth - marginX * 2, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('#', colX.idx, y);
      doc.text('ITEM', colX.item, y);
      doc.text('SERIAL NO.', colX.serial, y);
      doc.text('CLAIM CODE', colX.claim, y);
      doc.text('QTY', colX.qty, y);
      doc.text('AMOUNT', colX.amount, y, { align: 'right' });
      y += 8;
    };

    drawTableHeader();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    orderReceipt.items.forEach((item, idx) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
        drawTableHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      doc.text(String(idx + 1), colX.idx, y);
      doc.text(item.name.length > 26 ? item.name.slice(0, 24) + '…' : item.name, colX.item, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(item.serialNumber || '-', colX.serial, y);
      doc.text(item.claimCode || '-', colX.claim, y);
      doc.setFontSize(8);
      doc.text(String(item.quantity), colX.qty, y);
      doc.text(`Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}`, colX.amount, y, { align: 'right' });

      y += 6;
      doc.setDrawColor(230, 230, 230);
      doc.line(marginX, y - 2, pageWidth - marginX, y - 2);
      y += 2;
    });

    y += 6;

    // ---------- Totals box ----------
    const totalsX = pageWidth - marginX - 60;
    doc.setFontSize(9);
    doc.text('Subtotal', totalsX, y);
    doc.text(`Rs. ${Number(orderReceipt.subtotal).toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
    y += 6;

    if (orderReceipt.discount > 0) {
      doc.text('Discount', totalsX, y);
      doc.text(`- Rs. ${Number(orderReceipt.discount).toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
      y += 6;
    }

    const finalSp = Math.max(0, Number(orderReceipt.subtotal) - (Number(orderReceipt.discount) || 0));
    const orderGst = Math.round(((finalSp * 18) / 118) * 100) / 100;
    doc.text('GST (18% included)', totalsX, y);
    doc.text(`Rs. ${orderGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
    y += 6;

    doc.setDrawColor(0, 0, 0);
    doc.line(totalsX, y, pageWidth - marginX, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Paid', totalsX, y);
    doc.text(`Rs. ${Number(orderReceipt.total).toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });

    y += 16;

    // ---------- Warranty note ----------
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Keep this invoice safe — the Serial Number and Claim Code for each item are required to register', marginX, y);
    y += 4;
    doc.text('your warranty at khroniq.com/warranty.', marginX, y);

    // ---------- Footer ----------
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, pageHeight - 18, pageWidth - marginX, pageHeight - 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('KHRONIQ Watches  •  support@khroniq.com  •  Thank you for your purchase', pageWidth / 2, pageHeight - 12, { align: 'center' });

    doc.save(`KHRONIQ-Invoice-${orderReceipt.id}.pdf`);
  };




  if (step < 4 && cartItemsWithDetails.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="flex justify-start">
          <BackButton onPageChange={onPageChange} fallbackPage="shop" label="BACK" />
        </div>
        <div className="w-20 h-20 bg-white border border-neutral-200 rounded-full flex items-center justify-center mx-auto text-neutral-400 shadow-sm">
          <CreditCard size={36} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-serif uppercase tracking-widest text-neutral-900">Your Cart is Empty</h1>
          <p className="text-neutral-500 text-xs leading-relaxed font-light">
            You cannot proceed to checkout with an empty cart. Please add a timepiece from our catalog.
          </p>
        </div>
        <button
          onClick={() => onPageChange('shop')}
          className="px-8 py-3 bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 transition cursor-pointer rounded-sm"
        >
          Explore Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Back Button (Active during checkout steps, omitted on order confirmation) */}
      {step < 4 && (
        <div>
          <BackButton onPageChange={onPageChange} fallbackPage="cart" label="BACK TO CART" />
        </div>
      )}

      {/* Checkout Progress Stepper */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 pb-4">
        {isGiftingJourney ? (
          <>
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-400'
                }`}>1</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 1 ? 'text-black' : 'text-neutral-400'
                }`}>GIFTING</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-400'
                }`}>2</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 2 ? 'text-black' : 'text-neutral-400'
                }`}>SHIPPING</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-400'
                }`}>3</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 3 ? 'text-black' : 'text-neutral-400'
                }`}>PAYMENT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-400'
                }`}>4</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 4 ? 'text-black' : 'text-neutral-400'
                }`}>ORDER REVIEW</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-400'
                }`}>1</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 2 ? 'text-black' : 'text-neutral-400'
                }`}>SHIPPING</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-400'
                }`}>2</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 3 ? 'text-black' : 'text-neutral-400'
                }`}>PAYMENT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-400'
                }`}>3</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 4 ? 'text-black' : 'text-neutral-400'
                }`}>ORDER REVIEW</span>
            </div>
          </>
        )}
      </div>

      {/* Step 1: Gifting Details Form */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Gifting Details */}
          <div className="lg:col-span-7 space-y-5">

            {/* Gift Occasion Selector */}
            <div className="bg-luxury-gray border border-white/5 p-5 rounded-md space-y-3">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Gift size={13} className="text-luxury-gold" />
                <h3 className="text-xs font-bold tracking-widest text-white uppercase">Select Gifting Occasion</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'anniversary', label: 'Anniversary', emoji: '💕' },
                  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
                  { id: 'retirement', label: 'Retirement', emoji: '💼' },
                  { id: 'other', label: 'Other Occasion', emoji: '✨' },
                ].map((occ) => (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setGiftOccasion(occ.id)}
                    className={`relative p-4 rounded border text-center transition-all duration-200 cursor-pointer ${giftOccasion === occ.id
                      ? 'border-black bg-gray-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                      }`}
                  >
                    {giftOccasion === occ.id && (
                      <Check size={12} className="absolute top-2 right-2 text-black" strokeWidth={3} />
                    )}
                    <span className="text-xl block mb-1">{occ.emoji}</span>
                    <p className={`text-[10px] font-bold tracking-wide uppercase ${giftOccasion === occ.id ? 'text-black' : 'text-gray-500'
                      }`}>{occ.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Gift Packaging & Card Options */}
            <div className="bg-luxury-gray border border-white/5 p-5 rounded-md space-y-5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Gift size={13} className="text-luxury-gold" />
                <h3 className="text-xs font-bold tracking-widest text-white uppercase">Gift Packaging & Card Options</h3>
              </div>

              {/* 1. Packaging Box selection */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">1. Select Packaging Box</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'single', label: 'Single Packaging', price: '₹450', desc: 'Luxury single watch box & presentation wrapping.' },
                    { id: 'couple', label: 'Couple Packaging', price: '₹900', desc: 'Luxury couple watch box & presentation wrapping.' },
                  ].map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setPackagingType(pkg.id)}
                      className={`relative p-4 rounded border text-left transition-all duration-200 cursor-pointer ${packagingType === pkg.id
                        ? 'border-black bg-gray-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                        }`}
                    >
                      {packagingType === pkg.id && (
                        <Check size={12} className="absolute top-2 right-2 text-black" strokeWidth={3} />
                      )}
                      <div className="flex items-center justify-between gap-1 pr-4">
                        <p className={`text-xs font-bold tracking-wide uppercase ${packagingType === pkg.id ? 'text-black' : 'text-gray-600'
                          }`}>{pkg.label}</p>
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${pkg.price === 'FREE'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-neutral-900 bg-neutral-100 border-neutral-200'
                          }`}>
                          {pkg.price}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1.5 leading-normal ${packagingType === pkg.id ? 'text-gray-700' : 'text-gray-400'
                        }`}>{pkg.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Custom Gift Card Option */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">2. Personalized Gift Card</p>
                <div
                  onClick={() => setIncludeGiftCard(!includeGiftCard)}
                  className={`p-4 rounded border flex items-center justify-between cursor-pointer transition-all duration-200 ${includeGiftCard
                    ? 'border-black bg-gray-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${includeGiftCard ? 'bg-black border-black text-white' : 'border-gray-400 bg-white'
                      }`}>
                      {includeGiftCard && <Check size={11} strokeWidth={3} />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold tracking-wide uppercase ${includeGiftCard ? 'text-black' : 'text-gray-700'}`}>
                        Add Custom Gift Card
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Printed personalized greeting card on premium cream card stock
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                    ₹100
                  </span>
                </div>

                {includeGiftCard && (
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Write a Gift Note (Optional)</label>
                    <textarea
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value.slice(0, 260))}
                      placeholder={`Dear [Name],\n\nEvery moment you wear this watch, know it carries our love and pride...`}
                      rows={3}
                      className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold resize-none"
                      style={{
                        fontFamily: 'Georgia, serif',
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    />
                    <div className="flex justify-between text-[9px] text-gray-500">
                      <span>{giftNote.length} / 260 characters</span>
                      <span>Placed inside the watch box on premium cream card stock</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 1 navigation buttons */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full py-4 bg-white text-luxury-dark font-bold text-xs tracking-widest uppercase hover:bg-luxury-gold hover:text-luxury-dark transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Continue to Shipping</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-5 space-y-6">
            <CheckoutSummary
              cartItems={cartItemsWithDetails}
              subtotal={subtotal}
              discount={discount}
              gst={gst}
              packagingCost={packagingCost}
              packagingType={packagingType}
              includeGiftCard={includeGiftCard}
              giftCardCost={giftCardCost}
              total={total}
              appliedGst={appliedGst}
              isShippingStep={false}
            />
          </div>
        </div>
      )}

      {/* Step 2: Shipping Address Form */}
      {step === 2 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Delivery Information Form */}
            <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 sm:p-8 rounded-lg shadow-xs space-y-6">
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-bold tracking-wide text-neutral-900 uppercase">
                  DELIVERY INFORMATION
                </h2>
                <p className="text-xs text-neutral-500">
                  Enter your shipping details to receive your order
                </p>
              </div>

              <style>{`
                .shipping-input {
                  border: 1px solid #d4d4d4 !important;
                  background-color: #ffffff !important;
                  color: #171717 !important;
                }
                .shipping-input::placeholder {
                  color: #737373 !important;
                  opacity: 1 !important;
                }
                .shipping-input:focus {
                  border-color: #000000 !important;
                }
              `}</style>

              <form id="shipping-form" onSubmit={handleShippingSubmit} className="space-y-4">
                {/* Country / Region */}
                <div className="space-y-1.5">
                  <label htmlFor="shipping-country" className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                    COUNTRY / REGION
                  </label>
                  <CountrySelect
                    id="shipping-country"
                    name="country"
                    value={shippingForm.country}
                    onChange={(country) => {
                      const isNewIndia = (country || '').trim().toLowerCase() === 'india';
                      const wasIndia = (shippingForm.country || '').trim().toLowerCase() === 'india';
                      let newState = shippingForm.state;
                      if (isNewIndia && !wasIndia) {
                        if (!INDIAN_STATES.includes(shippingForm.state)) {
                          newState = 'Uttar Pradesh';
                        }
                      } else if (!isNewIndia && wasIndia) {
                        if (INDIAN_STATES.includes(shippingForm.state)) {
                          newState = '';
                        }
                      }
                      setShippingForm(prev => ({ ...prev, country, state: newState }));
                    }}
                    className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-black transition shipping-input"
                  />
                </div>

                {/* Full Name (First and Last Name) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                    FULL NAME (FIRST AND LAST NAME)
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingForm.fullName}
                    onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    placeholder="Paritosh"
                    className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black transition shipping-input"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                    MOBILE NUMBER
                  </label>
                  <input
                    type="tel"
                    required
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black transition shipping-input"
                  />
                </div>

                {/* Pincode / Postal Code */}
                <div className="space-y-1.5">
                  <label htmlFor="shipping-zip" className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                    {isIndia ? 'PINCODE' : 'POSTAL / ZIP CODE'}
                  </label>
                  <input
                    id="shipping-zip"
                    type="text"
                    required
                    value={shippingForm.zipCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, zipCode: e.target.value })}
                    placeholder={isIndia ? '6 digits [0-9] PIN code' : 'Enter postal or ZIP code'}
                    className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black transition shipping-input"
                  />
                </div>

                {/* Flat / House / Building / Company / Apartment */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                    FLAT / HOUSE / BUILDING / COMPANY / APARTMENT
                  </label>
                  <input
                    type="text"
                    value={shippingForm.houseNumber}
                    onChange={(e) => setShippingForm({ ...shippingForm, houseNumber: e.target.value })}
                    placeholder="Enter flat, house, company, or apartment details"
                    className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black transition shipping-input"
                  />
                </div>

                {/* Area / Street / Sector / Village */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                    AREA / STREET / SECTOR / VILLAGE
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingForm.streetAddress}
                    onChange={(e) => setShippingForm({ ...shippingForm, streetAddress: e.target.value })}
                    placeholder="Area, street, sector, village"
                    className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black transition shipping-input"
                  />
                </div>

                {/* Landmark */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                    LANDMARK
                  </label>
                  <input
                    type="text"
                    value={shippingForm.landmark}
                    onChange={(e) => setShippingForm({ ...shippingForm, landmark: e.target.value })}
                    placeholder="E.g. near Apollo Hospital"
                    className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black transition shipping-input"
                  />
                </div>

                {/* Town / City and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                      TOWN / CITY
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      placeholder="Gorakhpur"
                      className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black transition shipping-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="shipping-state" className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                      {isIndia ? 'STATE' : 'STATE / PROVINCE / REGION'}
                    </label>
                    {isIndia ? (
                      <select
                        id="shipping-state"
                        required
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-black transition cursor-pointer shipping-input"
                      >
                        <option value="">Select State / UT</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="shipping-state"
                        type="text"
                        required
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        placeholder="Enter state, province or region"
                        className="w-full bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black transition shipping-input"
                      />
                    )}
                  </div>
                </div>

                {/* Save Address Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="rounded border-neutral-300 text-black focus:ring-black h-4 w-4 accent-black"
                  />
                  <span className="text-xs text-neutral-700">Save this address for future orders</span>
                </label>

                {/* Divider */}
                <div className="border-t border-neutral-200 pt-3" />

                {/* GST Details (Optional) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider">
                      GST DETAILS (OPTIONAL)
                    </label>
                    <span title="Goods and Services Tax Identification Number for claiming eligible input tax credit">
                      <Info size={13} className="text-neutral-400 cursor-pointer" />
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Add your GSTIN to claim ITC(Input Tax Credit).
                  </p>

                  {appliedGst ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-neutral-900 tracking-wide">{appliedGst}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">GSTIN added for tax invoice.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveGst}
                        className="text-xs font-semibold text-neutral-500 hover:text-black transition cursor-pointer underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={gstInput}
                        onChange={(e) => {
                          setGstInput(e.target.value.toUpperCase());
                          setGstError('');
                        }}
                        placeholder="Enter GSTIN (e.g. 27ABCDE1234F1Z5)"
                        className="flex-1 bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black uppercase transition shipping-input"
                      />
                      <button
                        type="button"
                        onClick={handleApplyGst}
                        className="px-6 py-2.5 bg-white border border-neutral-300 hover:border-black text-neutral-900 text-xs font-bold uppercase tracking-wider rounded-md transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {gstError && (
                    <p className="text-xs text-red-600 pt-0.5">{gstError}</p>
                  )}

                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 pt-1">
                    <Info size={12} />
                    <span>Your invoice will be generated with the provided GST number.</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-200 pt-3" />

                {/* Coupon Code */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                    COUPON CODE
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Tag size={15} className="text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-neutral-900 tracking-wide">{appliedCoupon.code}</p>
                          <p className="text-[10px] text-emerald-700">{appliedCoupon.description || `${appliedCoupon.discountPercent}% discount`}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-neutral-400 hover:text-neutral-700 transition p-1 cursor-pointer"
                        aria-label="Remove coupon"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        placeholder="Enter coupon code"
                        className="flex-1 bg-white border border-neutral-300 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-black uppercase transition shipping-input"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-md transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-red-600 pt-0.5">{couponError}</p>
                  )}
                </div>
              </form>
            </div>

            {/* Right Summary */}
            <div className="lg:col-span-5">
              <CheckoutSummary
                cartItems={cartItemsWithDetails}
                subtotal={subtotal}
                discount={discount}
                gst={gst}
                packagingCost={packagingCost}
                packagingType={packagingType}
                includeGiftCard={includeGiftCard}
                giftCardCost={giftCardCost}
                total={total}
                appliedGst={appliedGst}
                isShippingStep={true}
                onProceedToPayment={handleShippingSubmit}
                processing={processingPayment}
              />
            </div>
          </div>

          {/* Bottom Trust Features Bar & Branding */}
          <div className="border-t border-neutral-200 pt-8 mt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-neutral-800">
              <div className="flex items-center gap-3">
                <Truck size={24} strokeWidth={1.5} className="text-neutral-800 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Free Shipping</h4>
                  <p className="text-[11px] text-neutral-500">On all orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw size={24} strokeWidth={1.5} className="text-neutral-800 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Easy Returns</h4>
                  <p className="text-[11px] text-neutral-500">7-day return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} strokeWidth={1.5} className="text-neutral-800 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Secure Payment</h4>
                  <p className="text-[11px] text-neutral-500">100% safe & secure</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Headphones size={24} strokeWidth={1.5} className="text-neutral-800 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Need Help?</h4>
                  <p className="text-[11px] text-neutral-500">+91 8003587217</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-10 pt-6 border-t border-neutral-100 space-y-1">
              <div className="flex items-center justify-center gap-4 text-neutral-400">
                <div className="w-12 h-[1px] bg-neutral-200" />
                <span className="text-xs font-serif font-bold tracking-[0.3em] text-neutral-800">K H R O N I Q</span>
                <div className="w-12 h-[1px] bg-neutral-200" />
              </div>
              <p className="text-xs text-neutral-400 italic">Born From The Movement Of Time</p>
            </div>
          </div>
        </>
      )}

      {/* Step 3: Payment via Razorpay */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 sm:p-8 rounded-lg shadow-xs space-y-6">
            <h2 className="text-sm sm:text-base font-bold tracking-wide text-neutral-900 uppercase border-b border-neutral-100 pb-3">
              Payment Portal
            </h2>

            <div className="border border-neutral-200 rounded-lg p-6 bg-neutral-50 text-center space-y-3">
              <ShieldCheck className="mx-auto text-emerald-600" size={36} />
              <p className="text-neutral-600 text-xs max-w-sm mx-auto font-light leading-relaxed">
                You will be redirected to our secure payment gateway to complete your purchase via Card, UPI, Netbanking, or Wallet.
              </p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                Powered by Razorpay
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={processingPayment}
                className="py-3.5 px-6 border border-neutral-300 text-neutral-800 font-bold text-xs tracking-widest uppercase hover:border-black transition w-1/3 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 rounded-md"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={processingPayment}
                className="flex-1 py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs tracking-widest uppercase transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 rounded-md shadow-xs"
              >
                <ShieldCheck size={16} />
                <span>{processingPayment ? 'Processing...' : `Pay ${formatPrice(total, currentCurrency)}`}</span>
              </button>
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-5">
            <CheckoutSummary
              cartItems={cartItemsWithDetails}
              subtotal={subtotal}
              discount={discount}
              gst={gst}
              packagingCost={packagingCost}
              packagingType={packagingType}
              includeGiftCard={includeGiftCard}
              giftCardCost={giftCardCost}
              total={total}
              appliedGst={appliedGst}
              isShippingStep={false}
            />
          </div>
        </div>
      )}




      {/* Step 4: Success Screen */}
      {step === 4 && orderReceipt && (
        <div className="bg-luxury-gray border border-white/5 rounded-md p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-8">

          <div className="h-20 w-20 rounded-full bg-emerald-400/10 border border-emerald-400/35 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={40} />
          </div>

          <div className="space-y-3">
            <span className="text-luxury-gold text-xs font-bold tracking-widest uppercase">CONGRATULATIONS</span>
            <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-wider">Timepiece Secured</h1>
            <p className="text-gray-300 text-xs sm:text-sm max-w-md mx-auto font-light leading-relaxed">
              Your transaction has authorized. A secure courier tracking link and digital certificate of authenticity have been sent to your email.
            </p>
          </div>

          {/* Receipt details */}
          <div className="bg-luxury-dark/40 border border-white/5 p-6 rounded text-left text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-gray-400 uppercase tracking-widest font-bold text-[10px]">Order Reference</span>
              <span className="text-white font-bold text-sm tracking-wide font-mono">{orderReceipt.id}</span>
            </div>

            <div className="space-y-2">
              {orderReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-gray-300">
                  <span className="line-clamp-1">{item.name} (x{item.quantity})</span>
                  <span className="font-semibold text-white">{formatPrice(item.price * item.quantity, currentCurrency)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-3 flex justify-between items-center font-bold text-white">
              <span className="uppercase tracking-widest text-[10px] text-gray-400">Total Charged</span>
              <span className="text-sm font-extrabold text-luxury-gold">{formatPrice(orderReceipt.total, currentCurrency)}</span>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1 font-light text-gray-400">
              <p><span className="font-semibold text-white">Deliver to:</span> {orderReceipt.shippingDetails?.fullName}</p>
              <p><span className="font-semibold text-white">Address:</span> {[orderReceipt.shippingDetails?.houseNumber, orderReceipt.shippingDetails?.streetAddress, orderReceipt.shippingDetails?.landmark ? `Landmark: ${orderReceipt.shippingDetails.landmark}` : ''].filter(Boolean).join(', ')}, {orderReceipt.shippingDetails?.city}, {orderReceipt.shippingDetails?.zipCode}</p>
              <p><span className="font-semibold text-white">Expected Delivery:</span> {getExpectedDeliveryDate(orderReceipt.shippingDetails.zipCode)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <button
              onClick={handleDownloadInvoice}
              className="py-3.5 bg-white text-luxury-dark font-bold text-xs tracking-widest uppercase hover:bg-gray-200 transition cursor-pointer"
            >
              Download Invoice
            </button>
            <button
              onClick={() => onPageChange('profile', { tab: 'orders' })}
              className="py-3.5 bg-white text-luxury-dark font-bold text-xs tracking-widest uppercase hover:bg-gray-200 transition cursor-pointer"
            >
              Track My Order
            </button>
            <button
              onClick={() => onPageChange('home')}
              className="py-3.5 bg-white border border-black text-black font-bold text-xs tracking-widest uppercase hover:bg-neutral-50 transition cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

    </div>
  );

  // Sub-component for Order Summary
  function CheckoutSummary({
    cartItems,
    subtotal,
    discount,
    gst,
    packagingCost = 0,
    packagingType = 'single',
    includeGiftCard = false,
    giftCardCost = 0,
    total,
    appliedGst,
    isShippingStep = false,
    onProceedToPayment,
    processing = false
  }) {
    const currentCurrency = useSelector(selectCurrentCurrency);
    const totalItemQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-baseline gap-1.5 pb-1">
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-neutral-900 uppercase">
            ORDER SUMMARY
          </h3>
          <span className="text-xs text-neutral-400 uppercase font-normal">
            ({totalItemQty} {totalItemQty === 1 ? 'ITEM' : 'ITEMS'})
          </span>
        </div>

        {/* Items list */}
        <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1.5">
          {cartItems.map((item) => {
            const itemPrice = item.price !== undefined ? item.price : getSellingPrice(item.product);
            const itemKey = `${item.productId}-${item.customization ? JSON.stringify(item.customization) : 'std'}`;
            return (
              <div
                key={itemKey}
                className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-14 h-14 bg-neutral-50 rounded border border-neutral-200 flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      onError={(e) => handleImageError(e)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-bold text-neutral-900">
                    {formatPrice(itemPrice * item.quantity, currentCurrency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch(removeFromCart(item.productId, item.customization))}
                    className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:text-black hover:bg-neutral-100 transition cursor-pointer flex-shrink-0"
                    title={`Remove ${item.product.name} from order`}
                    aria-label={`Remove ${item.product.name} from order`}
                  >
                    <X size={14} className="stroke-[2.2]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing rows */}
        <div className="space-y-2.5 pt-4 border-t border-neutral-100 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Order Value</span>
            <span className="font-medium text-neutral-900">{formatPrice(subtotal, currentCurrency)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Coupon Discount</span>
              <span className="font-medium">-{formatPrice(discount, currentCurrency)}</span>
            </div>
          )}

          {packagingCost > 0 && (
            <div className="flex justify-between text-neutral-600 items-center">
              <span className="flex items-center gap-1.5">
                <span>Gift Packaging</span>
                <span className="text-[10px] uppercase font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  {packagingType === 'couple' ? 'Couple' : 'Single'}
                </span>
              </span>
              <span className="font-medium text-neutral-900">{formatPrice(packagingCost, currentCurrency)}</span>
            </div>
          )}

          {includeGiftCard && giftCardCost > 0 && (
            <div className="flex justify-between text-neutral-600 items-center">
              <span className="flex items-center gap-1.5">
                <span>Custom Gift Card</span>
                <span className="text-[10px] uppercase font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  Personalized
                </span>
              </span>
              <span className="font-medium text-neutral-900">{formatPrice(giftCardCost, currentCurrency)}</span>
            </div>
          )}

          <div className="flex justify-between text-neutral-600 items-center">
            <span className="flex items-center gap-1">
              GST (18% included)
              <span title="Goods and Services Tax (18%) is already included in the selling price">
                <Info size={13} className="text-neutral-400 cursor-pointer" />
              </span>
            </span>
            <span className="font-medium text-neutral-900">{formatPrice(gst, currentCurrency, 2)}</span>
          </div>

          <div className="flex justify-between text-neutral-600 items-center">
            <span>Shipping</span>
            <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs">FREE</span>
          </div>
        </div>

        {/* GST Callout Banner */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-md flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-neutral-900">
              {appliedGst ? 'GSTIN added for tax invoice.' : 'Add GSTIN to claim ITC(Input Tax Credit).'}
            </p>
            {appliedGst && (
              <p className="text-[11px] text-neutral-500 mt-0.5">
                GSTIN: {appliedGst}
              </p>
            )}
          </div>
        </div>

        {/* TOTAL row */}
        <div className="border-t border-neutral-200 pt-4 flex justify-between items-baseline">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-neutral-900 block">TOTAL</span>
            <span className="text-[11px] text-neutral-500 font-normal">(Inclusive of all taxes)</span>
          </div>
          <span className="text-xl font-bold text-neutral-900">
            {formatPrice(total, currentCurrency)}
          </span>
        </div>

        {/* Primary CTA button on Shipping Step */}
        {isShippingStep && (
          <>
            <button
              type="submit"
              form="shipping-form"
              onClick={onProceedToPayment}
              disabled={processing}
              className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Lock size={14} />
              <span>{processing ? 'Processing...' : 'Proceed to Payment'}</span>
            </button>

            <div className="text-center pt-1 space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <ShieldCheck size={15} />
                <span>100% Secure Checkout</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Your information is encrypted and safe with us.
              </p>
            </div>
          </>
        )}
      </div>
    );
  }
}