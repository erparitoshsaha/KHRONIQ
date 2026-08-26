import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../store/slices/watchSlice';
import { Star, CheckCircle2 } from 'lucide-react';

export default function ResetPassword({ params, onPageChange }) {
  const dispatch = useDispatch();
  const token = params?.token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const res = await dispatch(resetPassword(token, password));
    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMsg(res.message || 'Failed to reset password.');
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-gray-400 text-sm">
        Invalid reset link.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-8">
      <div className="text-center space-y-2">
        <Star className="mx-auto text-luxury-red" size={32} fill="currentColor" />
        <h1 className="font-serif text-2xl font-bold uppercase tracking-widest text-luxury-text">Set New Password</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 sm:p-8 space-y-6 shadow-md">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs font-medium flex items-center justify-center space-x-1.5">
              <CheckCircle2 size={14} />
              <span>Password reset successful.</span>
            </div>
            <button
              onClick={() => onPageChange('login')}
              className="w-full py-3.5 bg-luxury-text text-white hover:bg-black/80 font-bold text-xs tracking-widest uppercase transition cursor-pointer rounded-sm"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-luxury-text font-bold uppercase tracking-widest block">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-300 rounded text-luxury-text text-xs p-3 focus:outline-none focus:border-black placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-luxury-text font-bold uppercase tracking-widest block">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-300 rounded text-luxury-text text-xs p-3 focus:outline-none focus:border-black placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-luxury-text text-white hover:bg-black/80 font-bold text-xs tracking-widest uppercase transition cursor-pointer rounded-sm shadow-sm"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}