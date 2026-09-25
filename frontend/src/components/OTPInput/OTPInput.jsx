import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * 6-digit OTP input with:
 * - Auto-focus management
 * - Backspace navigation
 * - Paste support
 * - Animated focus ring
 *
 * @param {string[]} value - Array of 6 single-char strings
 * @param {function} onChange - Called with new array on change
 * @param {boolean} disabled
 * @param {boolean} hasError
 */
const OTPInput = ({ value = Array(6).fill(''), onChange, disabled = false, hasError = false }) => {
  const inputRefs = useRef([]);

  // Ensure 6 elements
  const otp = [...value];
  while (otp.length < 6) otp.push('');

  const handleChange = (index, char) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    onChange(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        onChange(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = Array(6).fill('');
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    onChange(newOtp);
    // Focus the next empty or last
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const ringClass = hasError
    ? 'border-danger-500 focus:border-danger-400 focus:ring-danger-500/40'
    : 'border-dark-500/60 focus:border-primary-500 focus:ring-primary-500/40';

  return (
    <div className="flex items-center gap-2 sm:gap-3 justify-center" role="group" aria-label="OTP Input">
      {otp.map((digit, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <input
            id={`otp-input-${index}`}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={disabled}
            autoComplete="one-time-code"
            className={`
              w-11 h-13 sm:w-13 sm:h-14 text-center text-xl font-bold font-mono
              bg-dark-700/60 text-white rounded-xl border-2
              focus:outline-none focus:ring-2 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${ringClass}
              ${digit ? 'border-primary-500/50 bg-primary-500/5 text-primary-300' : ''}
            `}
            style={{ width: '3rem', height: '3.5rem' }}
            aria-label={`Digit ${index + 1}`}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default OTPInput;
