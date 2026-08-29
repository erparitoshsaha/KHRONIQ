import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser, registerUser, checkAdminEmail, requestAdminCode, verifyAdminCode } from '../store/slices/watchSlice';
import { Star, CheckCircle2, ShieldCheck } from 'lucide-react';
import { forgotPassword } from '../store/slices/watchSlice';


export default function Login({ params, onPageChange }) {
  const dispatch = useDispatch();
  
  const redirectPage = params?.redirect || 'profile';
  const appliedCoupon = params?.appliedCoupon || null;

  // Mode state: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState('login');
  
  // Forms states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Status states
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  const [adminStep, setAdminStep] = useState('email'); // 'email' | 'code'
  const [adminCode, setAdminCode] = useState('');

  useEffect(() => {
    document.title = 'Client Authentication | KHRONIQ';
  }, []);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (authMode === 'login') {
      setAdminStep('email');
      setAdminCode('');
      setOtpSentMsg(false);
    }
  };

  const handleEmailBlur = async () => {
    if (authMode !== 'login' || !email.trim()) return;
    const res = await dispatch(checkAdminEmail(email.trim().toLowerCase()));
    setIsAdminEmail(Boolean(res?.isAdmin));
  };

  // Real-time admin email detection as user types or pastes email
  useEffect(() => {
    if (authMode !== 'login') {
      setIsAdminEmail(false);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setIsAdminEmail(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      const res = await dispatch(checkAdminEmail(cleanEmail));
      setIsAdminEmail(Boolean(res?.isAdmin));
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [email, authMode, dispatch]);

  useEffect(() => {
    if (lockoutCountdown <= 0) return;
    setErrorMsg(`Too many failed attempts. Account locked. Please try again in ${lockoutCountdown} seconds.`);
    const timer = setInterval(() => {
      setLockoutCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMsg('');
          return 0;
        }
        const nextVal = prev - 1;
        setErrorMsg(`Too many failed attempts. Account locked. Please try again in ${nextVal} seconds.`);
        return nextVal;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutCountdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccess(false);
    setOtpSentMsg(false);

    if (authMode === 'login') {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        setErrorMsg('Please enter your email address.');
        return;
      }

      setLoading(true);
      try {
        // Check if this email is an admin email on submit
        const checkRes = await dispatch(checkAdminEmail(cleanEmail));
        if (checkRes && checkRes.isAdmin) {
          setIsAdminEmail(true);
          if (adminStep === 'email') {
            const res = await dispatch(requestAdminCode(cleanEmail));
            if (res.success) {
              setAdminStep('code');
              setOtpSentMsg(true);
            } else if (res.message && res.message.includes('60 seconds')) {
              setAdminStep('code');
              setOtpSentMsg(true);
              setErrorMsg('A code was sent recently. Please check your inbox or wait 60s to request a new code.');
            } else {
              setErrorMsg(res.message || 'Failed to send verification code.');
            }
          } else {
            if (!adminCode.trim()) {
              setErrorMsg('Please enter the code sent to your email.');
              setLoading(false);
              return;
            }
            const res = await dispatch(verifyAdminCode(cleanEmail, adminCode.trim()));
            if (res.success) {
              onPageChange('admin');
            } else {
              setErrorMsg(res.message || 'Invalid verification code.');
            }
          }
          setLoading(false);
          return;
        }

        // Regular customer login
        if (!password) {
          setErrorMsg('Please enter your password.');
          setLoading(false);
          return;
        }

        const res = await dispatch(loginUser(cleanEmail, password));
        if (res.success) {
          if (res.role === 'admin') {
            onPageChange('admin');
          } else if (redirectPage === 'checkout') {
            onPageChange('checkout', { appliedCoupon });
          } else if (redirectPage.startsWith('product-detail:')) {
            const pid = redirectPage.split(':')[1];
            onPageChange('product-detail', { id: pid });
          } else {
            onPageChange('profile');
          }
        } else {
          if (res.remainingSeconds) {
            setLockoutCountdown(res.remainingSeconds);
          } else {
            setErrorMsg(res.message || 'Invalid login combination.');
          }
        }
      } catch (err) {
        setErrorMsg('Network or service error. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (authMode === 'forgot') {
  if (!email) {
    setErrorMsg('Please specify your registered email.');
    return;
  }
  const res = await dispatch(forgotPassword(email));
  if (res.success) {
    setForgotSuccess(true);
    setEmail('');
  } else {
    setErrorMsg(res.message || 'Failed to send reset link.');
  }
  return;
}

    if (!email || !password || (authMode === 'register' && !name)) {
      setErrorMsg('Please complete all form inputs.');
      return;
    }

    if (authMode === 'register') {
      // Password complexity check
      const isStrong = password.length >= 8 &&
                       /[A-Z]/.test(password) &&
                       /[a-z]/.test(password) &&
                       /[!@#$%^&*(),.?":{}|<>\-_]/.test(password);

      if (!isStrong) {
        setShowPasswordPopup(true);
        return;
      }

      const res = await dispatch(registerUser(name, email, password));
      if (res.success) {
        // Auto-signed in on success, redirect
        if (redirectPage === 'checkout') {
          onPageChange('checkout', { appliedCoupon });
        } else {
          onPageChange('profile');
        }
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } else {
      const res = await dispatch(loginUser(email, password));
      if (res.success) {
        if (res.role === 'admin') {
          onPageChange('admin');
        } else if (redirectPage === 'checkout') {
          onPageChange('checkout', { appliedCoupon });
        } else if (redirectPage.startsWith('product-detail:')) {
          const pid = redirectPage.split(':')[1];
          onPageChange('product-detail', { id: pid });
        } else {
          onPageChange('profile');
        }
      } else {
        if (res.remainingSeconds) {
          setLockoutCountdown(res.remainingSeconds);
        } else {
          setErrorMsg(res.message || 'Invalid login combination.');
        }
      }
    }
  };


  return (
    <div className="max-w-md mx-auto py-12 space-y-8">
      
      {/* Brand Icon */}
      <div className="text-center space-y-2">
        <Star className="mx-auto text-luxury-gold animate-pulse" size={32} fill="var(--color-luxury-gold)" />
        <h1 className="font-serif text-2xl font-bold uppercase tracking-widest text-white">Security Gateway</h1>
        <p className="text-xs text-gray-400">Secure entry to the Khroniq Horological Portal.</p>
      </div>

      {/* Login Box */}
      <div className="bg-luxury-gray border border-white/5 rounded-md p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Selector Tabs */}
        {authMode !== 'forgot' ? (
          <div className="flex border-b border-white/5">
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setIsAdminEmail(false); setAdminStep('email'); setAdminCode(''); }}
              className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition ${
                authMode === 'login' ? 'border-luxury-text text-luxury-text' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(''); setIsAdminEmail(false); setAdminStep('email'); setAdminCode(''); }}
              className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition ${
                authMode === 'register' ? 'border-luxury-text text-luxury-text' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>
        ) : (
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold text-luxury-gold uppercase tracking-wider text-center">Reset Credentials Key</h2>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-luxury-red/10 border border-luxury-red/30 rounded text-luxury-red text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {forgotSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs font-medium flex items-center space-x-1.5">
            <CheckCircle2 size={14} />
            <span>A secure credential reset key has been dispatched to your email inbox.</span>
          </div>
        )}

        {otpSentMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs font-medium flex items-center space-x-1.5 animate-in fade-in">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>A 6-digit code has been dispatched to {email}. Check your inbox or spam folder.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name (Registration Only) */}
          {authMode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-black font-bold uppercase tracking-widest block">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Username"
                className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
              />
            </div>
          )}

          {/* Email (Always Needed) */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-300 font-bold uppercase tracking-widest block">Email Address</label>
            <input
              type="email"
              required
              disabled={authMode === 'login' && isAdminEmail && adminStep === 'code'}
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="customer@domain.com"
              className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold disabled:opacity-50"
            />
            {authMode === 'login' && isAdminEmail && adminStep === 'email' && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-[9px] text-luxury-gold font-medium uppercase tracking-wider">Admin Account Detected</span>
                <button
                  type="button"
                  onClick={() => { setAdminStep('code'); setErrorMsg(''); setOtpSentMsg(false); }}
                  className="text-[9px] text-gray-400 hover:text-white transition uppercase font-semibold cursor-pointer underline"
                >
                  Already have a code? Enter code
                </button>
              </div>
            )}
          </div>

          {/* Admin Sign-In Code (shown automatically once an admin email is detected and code sent) */}
          {authMode === 'login' && isAdminEmail && adminStep === 'code' && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-300 font-bold uppercase tracking-widest block">Sign-In Code</label>
              <input
                type="text"
                required
                autoFocus
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 tracking-[0.3em] focus:outline-none focus:border-luxury-gold"
              />
              <button
                type="button"
                onClick={() => { setAdminStep('email'); setAdminCode(''); setErrorMsg(''); setOtpSentMsg(false); }}
                className="text-[9px] text-gray-400 hover:text-white transition uppercase font-semibold cursor-pointer"
              >
                Change email or resend code
              </button>
            </div>
          )}

          {/* Password (Login & Register Only — hidden once an admin email is detected) */}
          {authMode !== 'forgot' && !(authMode === 'login' && isAdminEmail) && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-300 font-bold uppercase tracking-widest block">Password</label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot'); setErrorMsg(''); }}
                  className="text-[9px] text-gray-400 hover:text-white transition uppercase font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required={authMode === 'register'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold"
              />
              {authMode === 'register' && (
                <div className="pt-1.5 space-y-1 text-[9px] text-gray-500 font-light">
                  <p className="font-semibold tracking-wider text-[8px] uppercase text-luxury-gold/75">Guidelines:</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span className={`flex items-center space-x-1 ${password.length >= 8 ? 'text-emerald-400/90' : 'text-gray-500'}`}>
                      <span>• Min 8 chars</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${/[A-Z]/.test(password) ? 'text-emerald-400/90' : 'text-gray-500'}`}>
                      <span>• One uppercase</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${/[a-z]/.test(password) ? 'text-emerald-400/90' : 'text-gray-500'}`}>
                      <span>• One lowercase</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${/[!@#$%^&*(),.?":{}|<>\-_]/.test(password) ? 'text-emerald-400/90' : 'text-gray-500'}`}>
                      <span>• One special char</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || lockoutCountdown > 0}
            className={`w-full py-3.5 font-bold text-xs tracking-widest uppercase transition flex items-center justify-center space-x-1.5 ${
              loading || lockoutCountdown > 0 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-white/5' 
                : 'bg-white text-luxury-dark hover:bg-luxury-gold hover:text-luxury-dark cursor-pointer'
            }`}
          >
            {loading 
              ? 'Processing...'
              : authMode === 'register' 
              ? 'Create Account' 
              : authMode === 'forgot'
              ? 'Request Reset Link'
              : authMode === 'login' && isAdminEmail
              ? (adminStep === 'email' ? 'Send Code' : 'Verify & Sign In')
              : lockoutCountdown > 0
              ? `Locked (${lockoutCountdown}s)`
              : 'Authenticate Credentials'
            }
          </button>

          {authMode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                className="text-[10px] text-gray-400 hover:text-white transition uppercase font-semibold cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </form>


      </div>

      {/* Password Requirements Popup Modal */}
      {showPasswordPopup && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1a17] border border-white/10 rounded-md p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-2 text-luxury-gold">
              <ShieldCheck size={20} />
              <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-white">Password Requirements</h3>
            </div>
            
            <p className="text-[10px] text-gray-400 font-light">
              Your security is paramount. Please ensure your password meets all Khroniq guidelines:
            </p>

            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center space-x-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  password.length >= 8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {password.length >= 8 ? '✓' : '✗'}
                </span>
                <span className={password.length >= 8 ? 'text-gray-200' : 'text-gray-500'}>
                  Minimum 8 characters
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  /[A-Z]/.test(password) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {/[A-Z]/.test(password) ? '✓' : '✗'}
                </span>
                <span className={/[A-Z]/.test(password) ? 'text-gray-200' : 'text-gray-500'}>
                  At least one uppercase letter (A-Z)
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  /[a-z]/.test(password) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {/[a-z]/.test(password) ? '✓' : '✗'}
                </span>
                <span className={/[a-z]/.test(password) ? 'text-gray-200' : 'text-gray-500'}>
                  At least one lowercase letter (a-z)
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  /[!@#$%^&*(),.?":{}|<>\-_]/.test(password) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {/[!@#$%^&*(),.?":{}|<>\-_]/.test(password) ? '✓' : '✗'}
                </span>
                <span className={/[!@#$%^&*(),.?":{}|<>\-_]/.test(password) ? 'text-gray-200' : 'text-gray-500'}>
                  At least one special character
                </span>
              </li>
            </ul>

            <button
              onClick={() => setShowPasswordPopup(false)}
              className="w-full mt-2 py-2.5 bg-white hover:bg-luxury-gold text-luxury-dark font-bold text-xs tracking-wider uppercase transition cursor-pointer"
            >
              Understand & Adjust
            </button>
          </div>
        </div>
      )}
    </div>
  );
}