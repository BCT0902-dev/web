import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowLeft, KeyRound, Smartphone } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as OTPAuth from 'otpauth';
import { QRCodeCanvas } from 'qrcode.react';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('login'); // login, 2fa_setup, 2fa_verify
  
  // 2FA State
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Admin Hardcoded Check
    if (email === 'admin' && password === 'Buicongtoi0902') {
      try {
        // 1. Kiểm tra xem đã có Secret Key trong Firestore chưa
        const adminDoc = await getDoc(doc(db, 'system', 'admin_config'));
        
        if (adminDoc.exists() && adminDoc.data().totpSecret) {
          // Đã có secret -> Chuyển sang bước xác thực
          setTotpSecret(adminDoc.data().totpSecret);
          setStep('2fa_verify');
        } else {
          // Chưa có secret -> Tạo mới (Setup lần đầu)
          const secret = new OTPAuth.Secret({ size: 20 });
          const secretBase32 = secret.base32;
          
          const totp = new OTPAuth.TOTP({
            issuer: 'BCT0902_SYSTEM',
            label: 'admin',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secretBase32,
          });

          setTotpSecret(secretBase32);
          setQrCodeUrl(totp.toString());
          setStep('2fa_setup');
        }
      } catch (err) {
        console.error("Lỗi Firestore:", err);
        // Kiểm tra nếu lỗi do bị chặn bởi AdBlock hoặc mất kết nối
        if (err.toString().toLowerCase().includes('blocked') || err.code === 'unavailable') {
          setError("Kết nối bị chặn (ERR_BLOCKED_BY_CLIENT)! Vui lòng tắt AdBlock cho trang này và thử lại.");
        } else {
          setError("Lỗi kết nối cơ sở dữ liệu. Vui lòng kiểm tra cấu hình Firebase!");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal Login
    setError("Thông tin đăng nhập không chính xác hoặc chưa được cấp quyền.");
    setLoading(false);
  };

  const verify2FA = async () => {
    setError('');
    if (otpCode.length !== 6) return;

    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'BCT0902_SYSTEM',
        label: 'admin',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: totpSecret,
      });

      const delta = totp.validate({
        token: otpCode,
        window: 1,
      });
      
      if (delta !== null) {
        // Nếu là lần đầu setup, lưu secret vào Firestore
        if (step === '2fa_setup') {
          await setDoc(doc(db, 'system', 'admin_config'), {
            totpSecret: totpSecret,
            updatedAt: new Date()
          });
        }
        
        // Thành công -> Lưu flag admin vào localStorage và điều hướng
        localStorage.setItem('bct_admin_session', 'true');
        navigate('/');
      } else {
        setError('Mã xác thực không đúng. Vui lòng kiểm tra lại!');
      }
    } catch (err) {
      setError('Lỗi xác thực: ' + err.message);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Lỗi xác thực: ' + err.message);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at center, #111 0%, #050505 100%)'
    }}>
      {/* Background Decorative Elements */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'var(--accent-glow)', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px', background: 'var(--accent-secondary)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '450px', padding: '3rem 2.5rem', position: 'relative', background: 'rgba(10, 10, 12, 0.82)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      >
        <AnimatePresence mode="wait">
          {step === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem', textDecoration: 'none' }}>
                  <h1 style={{ fontSize: '2rem', fontFamily: '"Share Tech Mono", monospace' }} className="text-gradient">
                    BCT0902 // TRUY CẬP
                  </h1>
                </Link>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                  <ShieldCheck size={16} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--success)' }} />
                  XÁC MINH DANH TÍNH ADMIN
                </p>
              </div>

              {error && <div className="error-box" style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}

              <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="NETWORK_ID" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" placeholder="MẬT_MÃ" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', opacity: loading ? 0.7 : 1 }} disabled={loading}>
                  {loading ? 'ĐANG PHÂN TÍCH...' : 'XÁC NHẬN TRUY CẬP'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>HOẶC</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button onClick={() => handleSocialLogin(googleProvider)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: '#fff', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Google</button>
                <button onClick={() => handleSocialLogin(githubProvider)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>GitHub</button>
              </div>
            </motion.div>
          )}

          {(step === '2fa_setup' || step === '2fa_verify') && (
            <motion.div key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ textAlign: 'center' }}>
              <button onClick={() => setStep('login')} style={{ position: 'absolute', left: 0, top: '-2rem', background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> QUAY LẠI
              </button>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(var(--accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid var(--accent-main)' }}>
                  <Smartphone className="text-glow" size={30} color="var(--accent-main)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-mono)', letterSpacing: '2px', fontSize: '1.2rem', color: '#fff' }}>
                  XÁC THỰC 2 LỚP
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {step === '2fa_setup' ? 'Quét mã QR bằng App Google Authenticator' : 'Nhập mã 6 chữ số từ điện thoại của bạn'}
                </p>
              </div>

              {step === '2fa_setup' && (
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                  <QRCodeCanvas value={qrCodeUrl} size={150} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" maxLength="6" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(var(--accent-rgb), 0.3)', borderRadius: '8px', color: 'var(--accent-main)', fontFamily: 'var(--font-mono)', fontSize: '1.4rem', letterSpacing: '8px', textAlign: 'center', outline: 'none' }} />
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</p>}

                <button onClick={verify2FA} className="btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={otpCode.length !== 6}>
                  XÁC MINH VÀ TIẾP TỤC
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: '2rem', padding: '0.8rem', border: '1px dashed rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)', fontSize: '0.7rem', color: 'var(--success)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          ADMIN_SHELL_STATUS: [{step.toUpperCase()}]
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
