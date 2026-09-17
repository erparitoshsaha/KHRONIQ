import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser, registerUser, checkAdminEmail, requestAdminCode, verifyAdminCode, forgotPassword } from '../store/slices/watchSlice';
import { Star, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { isAdminRole } from '../constants/permissions';

const SUPER_ADMIN_EMAIL = 'er.paritoshsaha@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Admin states
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  const [isSuperAdminEmail, setIsSuperAdminEmail] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [adminStep, setAdminStep] = useState('email'); // 'email' | 'code'
  const [adminCode, setAdminCode] = useState('');

  useEffect(() => {
    document.title = 'Client Authentication | KHRONIQ';
  }, []);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setErrorMsg('');

    if (authMode === 'login') {
      const clean = (val || '').trim().toLowerCase();
      // If user typed or pasted the exact super admin email, adapt the view seamlessly
      if (clean === SUPER_ADMIN_EMAIL) {
        setIsAdminEmail(true);
        setIsSuperAdminEmail(true);
        setRequiresOtp(true);
      } else {
        // Any intermediate typing: do not fire premature network requests or privileged checks
        setIsAdminEmail(false);
        setIsSuperAdminEmail(false);
        setRequiresOtp(false);
        if (adminStep === 'code') {
          setAdminStep('email');
          setAdminCode('');
          setOtpSentMsg(false);
        }
      }
    }
  };

  const handleEmailBlur = async () => {
    if (authMode !== 'login') return;
    const clean = (email || '').trim().toLowerCase();
    if (!clean || !EMAIL_REGEX.test(clean)) return;

    if (clean === SUPER_ADMIN_EMAIL) {
      setIsAdminEmail(true);
      setIsSuperAdminEmail(true);
      setRequiresOtp(true);
      return;
    }

    try {
      const res = await dispatch(checkAdminEmail(clean));
      if (res && res.isAdmin && !res.isSuperAdmin) {
        setIsAdminEmail(true);
        setIsSuperAdminEmail(false);
        setRequiresOtp(false);
      }
    } catch (_) {
      // Ignore background check failure on blur; submit handler will handle errors safely
    }
  };

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
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        setErrorMsg('Please enter your email address.');
        return;
      }

      if (!EMAIL_REGEX.test(cleanEmail)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      setLoading(true);
      try {
        const isSuper = cleanEmail === SUPER_ADMIN_EMAIL;

        if (isSuper) {
          setIsAdminEmail(true);
          setIsSuperAdminEmail(true);
          setRequiresOtp(true);

          if (adminStep === 'email') {
            const res = await dispatch(requestAdminCode(cleanEmail));
            if (res.success) {
              setAdminStep('code');
              setOtpSentMsg(true);
            } else if (res.message && res.message.includes('seconds')) {
              setAdminStep('code');
              setOtpSentMsg(true);
              setErrorMsg(res.message);
            } else {
              setErrorMsg(res.message || 'Unable to send OTP. Please try again.');
            }
          } else {
            if (!adminCode.trim()) {
              setErrorMsg('Please enter the 6-digit verification code sent to your email.');
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

        // For non-Super Admin: check if email belongs to a normal staff administrator
        const checkRes = await dispatch(checkAdminEmail(cleanEmail));
        const isNormalAdmin = Boolean(checkRes?.isAdmin && !checkRes?.isSuperAdmin);

        if (isNormalAdmin) {
          setIsAdminEmail(true);
          setIsSuperAdminEmail(false);
          setRequiresOtp(false);

          if (!password) {
            setErrorMsg('Please enter your administrator password.');
            setLoading(false);
            return;
          }

          const res = await dispatch(loginUser(cleanEmail, password));
          if (res.success) {
            onPageChange('admin');
          } else {
            setErrorMsg(res.message || 'Invalid email or password.');
            if (res.remainingSeconds) {
              setLockoutCountdown(res.remainingSeconds);
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
          if (isAdminRole(res.role)) {
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
          // If backend indicated OTP is required (e.g. backend auto-dispatched for Super Admin)
          if (res.requireOtp || res.isSuperAdmin) {
            setIsAdminEmail(true);
            setIsSuperAdminEmail(true);
            setRequiresOtp(true);
            setAdminStep('code');
            setOtpSentMsg(true);
            setErrorMsg(res.message || 'A verification code has been dispatched to your email.');
            setLoading(false);
            return;
          }
          if (res.remainingSeconds) {
            setLockoutCountdown(res.remainingSeconds);
          } else {
            setErrorMsg(res.message || 'Invalid login combination.');
          }
        }
      } catch (err) {
        console.error('Sign In error:', err);
        setErrorMsg('Network or service error. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (authMode === 'forgot') {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        setErrorMsg('Please specify your registered email.');
        return;
      }
      if (!EMAIL_REGEX.test(cleanEmail)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      try {
        const res = await dispatch(forgotPassword(cleanEmail));
        if (res.success) {
          setForgotSuccess(true);
          setEmail('');
        } else {
          setErrorMsg(res.message || 'Failed to send reset link.');
        }
      } catch (err) {
        setErrorMsg('Failed to process password reset request.');
      } finally {
        setLoading(false);
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
                       /[!@#$%^&*(),.?":{}|<>-_]/.test(password);

      if (!isStrong) {
        setShowPasswordPopup(true);
        return;
      }

      setLoading(true);
      try {
        const res = await dispatch(registerUser(name.trim(), email.trim().toLowerCase(), password));
        if (res.success) {
          if (redirectPage === 'checkout') {
            onPageChange('checkout', { appliedCoupon });
          } else {
            onPageChange('profile');
          }
        } else {
          setErrorMsg(res.message || 'Registration failed.');
        }
      } catch (err) {
        setErrorMsg('Server connection failed during registration.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4 sm:px-6">
      <div className="bg-luxury-gray p-8 rounded-lg border border-white/10 space-y-6 shadow-2xl relative">

        {/* Toggle between Login, Register, Forgot */}
        {authMode !== 'forgot' ? (
          <div className="flex border-b border-white/5 pb-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
                setForgotSuccess(false);
                setOtpSentMsg(false);
                setAdminStep('email');
                setAdminCode('');
                if (email.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
                  setIsAdminEmail(true);
                  setIsSuperAdminEmail(true);
                  setRequiresOtp(true);
                } else {
                  setIsAdminEmail(false);
                  setIsSuperAdminEmail(false);
                  setRequiresOtp(false);
                }
              }}
              className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition ${
                authMode === 'login' ? 'border-luxury-text text-luxury-text' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
                setForgotSuccess(false);
                setOtpSentMsg(false);
                setIsAdminEmail(false);
                setIsSuperAdminEmail(false);
                setRequiresOtp(false);
              }}
              className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition ${
                authMode === 'register' ? 'border-luxury-text text-luxury-text' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </button>
          </div>
        ) : (
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold text-luxury-text uppercase tracking-wider text-center">Reset Credentials Key</h2>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-luxury-red/10 border border-luxury-red/30 rounded text-luxury-red text-xs font-medium animate-in fade-in">
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
              <label className="text-[10px] text-white font-bold uppercase tracking-widest block">Full Name</label>
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
              disabled={authMode === 'login' && requiresOtp && adminStep === 'code'}
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="customer@domain.com"
              className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-luxury-gold disabled:opacity-50"
            />
            {authMode === 'login' && isAdminEmail && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-[9px] text-luxury-gold font-medium uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-luxury-gold inline" />
                  {isSuperAdminEmail ? 'Super Admin Account • 2FA OTP Protected' : 'Staff Admin Account'}
                </span>
                {requiresOtp && adminStep === 'email' && (
                  <button
                    type="button"
                    onClick={() => { setAdminStep('code'); setErrorMsg(''); setOtpSentMsg(false); }}
                    className="text-[9px] text-gray-400 hover:text-white transition uppercase font-semibold cursor-pointer underline"
                  >
                    Already have a code? Enter code
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Super Admin 2FA Code (Only shown when 2FA OTP is required and code step is active) */}
          {authMode === 'login' && requiresOtp && adminStep === 'code' && (
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

          {/* Password (Shown for register, customer login, and restricted admin login; hidden for Super Admin OTP flow) */}
          {authMode !== 'forgot' && !(authMode === 'login' && requiresOtp) && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-300 font-bold uppercase tracking-widest block">Password</label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot'); setErrorMsg(''); }}
                  className="text-[9px] text-gray-400 hover:text-luxury-text transition uppercase font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required={authMode === 'register' || (authMode === 'login' && !requiresOtp)}
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
                    <span className={`flex items-center space-x-1 ${/[!@#$%^&*(),.?":{}|<>-_]/.test(password) ? 'text-emerald-400/90' : 'text-gray-500'}`}>
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
              : authMode === 'login' && requiresOtp
              ? (adminStep === 'email' ? 'Send Verification Code' : 'Verify & Sign In')
              : authMode === 'login' && isAdminEmail
              ? 'Sign In to Admin Panel'
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
                className="text-[10px] text-gray-400 hover:text-luxury-text transition uppercase font-semibold cursor-pointer"
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
                  /[!@#$%^&*(),.?":{}|<>-_]/.test(password) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {/[!@#$%^&*(),.?":{}|<>-_]/.test(password) ? '✓' : '✗'}
                </span>
                <span className={/[!@#$%^&*(),.?":{}|<>-_]/.test(password) ? 'text-gray-200' : 'text-gray-500'}>
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
