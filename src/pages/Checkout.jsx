import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createRazorpayOrder, verifyRazorpayPayment, validateCoupon, selectCurrentCurrency, formatPrice, getDiscountedPrice } from '../store/slices/watchSlice';
import { handleImageError } from '../utils/imageUtils';
import { getExpectedDeliveryDate } from '../utils/deliveryUtils';

import confetti from 'canvas-confetti';
import { CheckCircle2, CreditCard, Landmark, ArrowRight, ArrowLeft, ShieldCheck, Gift, Check, Tag, X, Loader2 } from 'lucide-react';
import BackButton from '../components/BackButton';

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
  const [shippingForm, setShippingForm] = useState({
    fullName: currentUser?.name || '',
    streetAddress: currentUser?.shippingAddress?.streetAddress || '',
    city: currentUser?.shippingAddress?.city || '',
    state: currentUser?.shippingAddress?.state || '',
    zipCode: currentUser?.shippingAddress?.postalCode || '',
    country: currentUser?.shippingAddress?.country || 'India'
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    document.title = 'Secure Checkout | KHRONIQ';
  }, []);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [giftPackage, setGiftPackage] = useState('standard'); // standard | gift-box | luxury
  const [giftNote, setGiftNote] = useState('');
  const [giftOccasion, setGiftOccasion] = useState('birthday'); // anniversary | birthday | retirement | other
  const [packagingType, setPackagingType] = useState('single'); // single | couple
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
        localAddress: prev.localAddress || currentUser.shippingAddress?.localAddress || '',
        city: prev.city || currentUser.shippingAddress?.city || '',
        zipCode: prev.zipCode || currentUser.shippingAddress?.postalCode || '',
        country: (prev.country === 'India' || !prev.country) && currentUser.shippingAddress?.country
          ? currentUser.shippingAddress.country
          : prev.country
      }));
    }
  }, [currentUser]);

  // Compute prices
  const cartItemsWithDetails = cart.map(item => {
    const itemProdId = (item.productId?._id || item.productId)?.toString();
    const product = products.find(p => (p.id && p.id.toString() === itemProdId) || (p._id && p._id.toString() === itemProdId));
    const itemPrice = item.price !== undefined ? item.price : getDiscountedPrice(product);
    return { ...item, product, itemPrice };
  }).filter(item => item.product !== undefined);

  const subtotal = cartItemsWithDetails.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  const discount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.discountPercent / 100)) : 0;
  const gst = Math.round(subtotal * 0.18);
  const total = Math.max(0, subtotal - discount + gst);

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!shippingForm.fullName || !shippingForm.streetAddress || !shippingForm.city || !shippingForm.zipCode) {
      alert('Please fill out all shipping details.');
      return;
    }
    setStep(3);
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
      couponCode: appliedCoupon?.code || null
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
      note: giftNote,
      packaging: packagingType
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
          shippingDetails: shippingForm,
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
    doc.text(shipping.localAddress || '-', marginX, y);
    doc.text(`Payment: Razorpay`, pageWidth / 2 + 5, y);
    y += 5;
    doc.text(`${shipping.city || ''}${shipping.city ? ', ' : ''}${shipping.zipCode || ''}`, marginX, y);
    if (orderReceipt.paymentDetails?.last4) {
      doc.text(`Ref: •••• ${orderReceipt.paymentDetails.last4}`, pageWidth / 2 + 5, y);
    }
    y += 5;
    if (shipping.country) doc.text(shipping.country, marginX, y);

    y += 12;

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

    const orderGst = Math.round(Number(orderReceipt.subtotal) * 0.18);
    doc.text('GST (18%)', totalsX, y);
    doc.text(`Rs. ${orderGst.toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
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
      <div className="flex items-center justify-center space-x-4 border-b border-white/5 pb-6">
        {isGiftingJourney ? (
          <>
            <div className="flex items-center space-x-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-luxury-gold text-luxury-dark' : 'bg-luxury-gray text-gray-500'
                }`}>1</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step >= 1 ? 'text-white' : 'text-gray-500'}`}>Gifting</span>
            </div>
            <div className="w-12 h-[1px] bg-white/10" />
            <div className="flex items-center space-x-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-luxury-gold text-luxury-dark' : 'bg-luxury-gray text-gray-500'
                }`}>2</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step >= 2 ? 'text-white' : 'text-gray-500'}`}>Shipping</span>
            </div>
            <div className="w-12 h-[1px] bg-white/10" />
            <div className="flex items-center space-x-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-luxury-gold text-luxury-dark' : 'bg-luxury-gray text-gray-500'
                }`}>3</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step >= 3 ? 'text-white' : 'text-gray-500'}`}>Payment</span>
            </div>
            <div className="w-12 h-[1px] bg-white/10" />
            <div className="flex items-center space-x-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-luxury-gold text-luxury-dark' : 'bg-luxury-gray text-gray-500'
                }`}>4</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 4 ? 'text-white' : 'text-gray-500'}`}>Receipt</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-luxury-gold text-luxury-dark' : 'bg-luxury-gray text-gray-500'
                }`}>1</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step >= 2 ? 'text-white' : 'text-gray-500'}`}>Shipping</span>
            </div>
            <div className="w-12 h-[1px] bg-white/10" />
            <div className="flex items-center space-x-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-luxury-gold text-luxury-dark' : 'bg-luxury-gray text-gray-500'
                }`}>2</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step >= 3 ? 'text-white' : 'text-gray-500'}`}>Payment</span>
            </div>
            <div className="w-12 h-[1px] bg-white/10" />
            <div className="flex items-center space-x-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-luxury-gold text-luxury-dark' : 'bg-luxury-gray text-gray-500'
                }`}>3</span>
              <span className={`text-xs font-bold tracking-wider uppercase ${step === 4 ? 'text-white' : 'text-gray-500'}`}>Receipt</span>
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
                    className={`relative p-4 rounded border text-center transition-all duration-200 cursor-pointer ${
                      giftOccasion === occ.id
                        ? 'border-black bg-gray-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    {giftOccasion === occ.id && (
                      <Check size={12} className="absolute top-2 right-2 text-black" strokeWidth={3} />
                    )}
                    <span className="text-xl block mb-1">{occ.emoji}</span>
                    <p className={`text-[10px] font-bold tracking-wide uppercase ${
                      giftOccasion === occ.id ? 'text-black' : 'text-gray-500'
                    }`}>{occ.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Gift Packaging (Single vs Couple options only) */}
            <div className="bg-luxury-gray border border-white/5 p-5 rounded-md space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Gift size={13} className="text-luxury-gold" />
                <h3 className="text-xs font-bold tracking-widest text-white uppercase">Standard Gift Packaging</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'single', label: 'Single Packaging', desc: 'Includes 1 watch, a custom gift card, and single packaging.' },
                  { id: 'couple', label: 'Couple Packaging', desc: 'Includes 2 watches, a custom gift card, and couple packaging.' },
                ].map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setPackagingType(pkg.id)}
                    className={`relative p-4 rounded border text-left transition-all duration-200 cursor-pointer ${
                      packagingType === pkg.id
                        ? 'border-black bg-gray-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    {packagingType === pkg.id && (
                      <Check size={12} className="absolute top-2 right-2 text-black" strokeWidth={3} />
                    )}
                    <p className={`text-xs font-bold tracking-wide uppercase ${
                      packagingType === pkg.id ? 'text-black' : 'text-gray-600'
                    }`}>{pkg.label}</p>
                    <p className={`text-[10px] mt-1 leading-normal ${
                      packagingType === pkg.id ? 'text-gray-700' : 'text-gray-400'
                    }`}>{pkg.desc}</p>
                  </button>
                ))}
              </div>

              {/* Gift Note Input field */}
              <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
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
            <CheckoutSummary cartItems={cartItemsWithDetails} subtotal={subtotal} discount={discount} gst={gst} total={total} zipCode={shippingForm.zipCode} />
          </div>
        </div>
      )}

      {/* Step 2: Shipping Address Form */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7 bg-luxury-gray border border-white/5 p-6 sm:p-8 rounded-md space-y-6">
            <h2 className="text-sm font-bold tracking-widest text-white uppercase border-b border-white/5 pb-3">Delivery Information</h2>
            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={shippingForm.fullName}
                  onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Local Address</label>
                <input
                  type="text"
                  required
                  value={shippingForm.streetAddress}
                  onChange={(e) => setShippingForm({ ...shippingForm, streetAddress: e.target.value })}
                  placeholder="120 Luxury Avenue, Suite 4B"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-black font-bold uppercase tracking-widest block">City</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    placeholder="New York"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.zipCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, zipCode: e.target.value })}
                    placeholder="10001"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-black font-bold uppercase tracking-widest block">State</label>
                <input
                  type="text"
                  required
                  value={shippingForm.state}
                  onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                  placeholder="e.g. Maharashtra, Delhi, Karnataka"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-black font-bold uppercase tracking-widest block">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingForm.state}
                    onChange={(e) =>
                      setShippingForm({ ...shippingForm, state: e.target.value })
                    }
                    placeholder="Uttar Pradesh"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-black font-bold uppercase tracking-widest block">
                    Country
                  </label>
                  <select
                    value={shippingForm.country}
                    onChange={(e) =>
                      setShippingForm({ ...shippingForm, country: e.target.value })
                    }
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-[10px] text-black font-bold uppercase tracking-widest flex items-center gap-1.5 pt-3">
                  <Tag size={11} className="text-luxury-gold" />
                  Coupon Code
                </label>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded p-3">
                    <div>
                      <p className="text-emerald-400 text-xs font-bold tracking-wide">{appliedCoupon.code}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{appliedCoupon.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-black hover:text-black transition p-1 cursor-pointer"
                      aria-label="Remove coupon"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Enter code"
                      className="flex-1 bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="px-5 border border-black text-black font-bold text-xs tracking-widest uppercase hover:bg-luxury-gold hover:text-black transition flex items-center justify-center cursor-pointer disabled:opacity-50 rounded"
                    >
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-400 text-[10px] pt-1">{couponError}</p>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (isGiftingJourney) {
                      setStep(1);
                    } else {
                      onPageChange('cart');
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="py-4 px-6 bg-white border border-black text-black font-bold text-xs tracking-widest uppercase hover:bg-neutral-50 transition w-1/3 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-white text-luxury-dark font-bold text-xs tracking-widest uppercase hover:bg-luxury-gold hover:text-luxury-dark transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-5 space-y-6">
            <CheckoutSummary cartItems={cartItemsWithDetails} subtotal={subtotal} discount={discount} gst={gst} total={total} zipCode={shippingForm.zipCode} />
          </div>
        </div>
      )}

      {/* Step 3: Payment via Razorpay */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-luxury-gray border border-white/5 p-6 sm:p-8 rounded-md space-y-6">
            <h2 className="text-sm font-bold tracking-widest text-white uppercase border-b border-white/5 pb-3">Payment Portal</h2>

            <div className="border border-white/5 rounded-md p-6 bg-luxury-dark text-center space-y-4">
              <ShieldCheck className="mx-auto text-luxury-gold" size={32} />
              <p className="text-gray-300 text-xs max-w-sm mx-auto font-light leading-relaxed">
                You will be redirected to our secure payment gateway to complete your purchase via Card, UPI, Netbanking, or Wallet.
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Powered by Razorpay
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={processingPayment}
                className="py-4 px-6 border border-white/10 text-black font-bold text-xs tracking-widest uppercase hover:border-black transition w-1/3 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} className="text-black" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={processingPayment}
                className="flex-1 py-4 bg-luxury-red hover:bg-red-700 text-white font-bold text-xs tracking-widest uppercase transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                <span>{processingPayment ? 'Processing...' : `Pay ${formatPrice(total, currentCurrency)}`}</span>
              </button>
            </div>
          </div>


          {/* Right Summary */}
          <div className="lg:col-span-5 space-y-6">
            <CheckoutSummary cartItems={cartItemsWithDetails} subtotal={subtotal} discount={discount} gst={gst} total={total} zipCode={shippingForm.zipCode} />
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
              <p><span className="font-semibold text-white">Deliver to:</span> {orderReceipt.shippingDetails.fullName}</p>
              <p><span className="font-semibold text-white">Address:</span> {orderReceipt.shippingDetails.streetAddress}, {orderReceipt.shippingDetails.city}, {orderReceipt.shippingDetails.zipCode}</p>
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
  function CheckoutSummary({ cartItems, subtotal, discount, gst, total, zipCode }) {
    const currentCurrency = useSelector(selectCurrentCurrency);
    const deliveryDate = getExpectedDeliveryDate(zipCode);
    return (
      <div className="bg-luxury-gray border border-white/5 rounded-md p-6 space-y-4">
        <h3 className="text-xs font-bold tracking-widest text-white uppercase border-b border-white/5 pb-3">Bag Review</h3>

        {/* Expected Delivery Date Alert Box */}
        {deliveryDate && (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded text-xs">
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-450 block mb-0.5">Expected Delivery</span>
            <p className="text-white font-semibold">{deliveryDate}</p>
            <p className="text-[9px] text-gray-500 font-light mt-0.5">Calculated based on shipping pincode: {zipCode}</p>
          </div>
        )}

        {/* Items list */}
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {cartItems.map((item) => {
            const itemPrice = item.price !== undefined ? item.price : getDiscountedPrice(item.product);
            return (
              <div key={item.productId} className="flex items-center space-x-3 pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                <div className="h-12 w-12 bg-luxury-dark rounded border border-white/5 flex-shrink-0 flex items-center justify-center p-0 overflow-hidden">
                  <img src={item.product.image} alt={item.product.name} onError={(e) => handleImageError(e)} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-xs font-semibold truncate uppercase tracking-wide">{item.product.name}</h4>
                  <p className="text-[10px] text-gray-500">Qty: {item.quantity} × {formatPrice(itemPrice, currentCurrency)}</p>
                </div>
                <span className="text-white text-xs font-bold">{formatPrice(itemPrice * item.quantity, currentCurrency)}</span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-gray-300">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, currentCurrency)}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>GST (18%)</span>
            <span>{formatPrice(gst, currentCurrency)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Coupon Discount</span>
              <span>-{formatPrice(discount, currentCurrency)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-300">
            <span>Courier Delivery</span>
            <span className="text-emerald-400 uppercase tracking-widest text-[9px] font-bold">Free</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-white border-t border-white/5 pt-3">
            <span className="uppercase tracking-widest text-[10px]">Grand Total</span>
            <span className="text-base text-luxury-text font-extrabold">{formatPrice(total, currentCurrency)}</span>
          </div>
        </div>
      </div>
    );
  }
}