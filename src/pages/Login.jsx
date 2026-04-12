import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowLeft, KeyRound, Smartphone, User, UserCircle } from 'lucide-react';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, githubProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as OTPAuth from 'otpauth';
import { QRCodeCanvas } from 'qrcode.react';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdblockModal, setShowAdblockModal] = useState(false);
  
  // Auth Modes
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
  const [step, setStep] = useState('auth'); // auth, 2fa_setup, 2fa_verify
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  
  // 2FA State
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleError = (err) => {
    const errorStr = err.toString().toLowerCase();
    console.error("Auth Error Object:", err);
    
    // Check for explicit "blocked" markers
    if (errorStr.includes('blocked')) {
      setShowAdblockModal(true);
    } else if (err.message === 'TIMEOUT_FIRESTORE') {
      setError("Không thể kết nối đến máy chủ Database (Timeout 5s). Dự án của ngài chưa kích hoạt Firebase Firestore hoặc kết nối bị tường lửa chặn đặc biệt!");
    } else if (err?.code === 'unavailable') {
      // Offline but maybe temporary
      setError("Hệ thống hiện đang ngoại tuyến. Vui lòng kiểm tra lại kết nối mạng của ngài.");
      setShowAdblockModal(true);
    } else if (err?.code === 'auth/unauthorized-domain') {
      setError("Domain này chưa được cấp phép trong Firebase Console. Vui lòng liên hệ Admin!");
    } else {
      setError('Lỗi kết nối: ' + (err.message || err.toString()));
    }
  };

  const executeAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (authMode === 'login') {
      // 1. Kiểm tra Hardcoded Admin
      if (email === 'admin' && password === 'Buicongtoi0902') {
        try {
          // Timeout cầu chì 5 giây để tránh treo trình duyệt nếu DB chưa cấu hình
          const adminDoc = await Promise.race([
            getDoc(doc(db, 'system', 'admin_config')),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_FIRESTORE')), 5000))
          ]);

          if (adminDoc.exists() && adminDoc.data().totpSecret) {
            setTotpSecret(adminDoc.data().totpSecret);
            setStep('2fa_verify');
          } else {
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
          handleError(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 2. Nếu không phải Admin -> Đăng nhập User qua Firebase
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
           setError('Tài khoản hoặc Mật khẩu không chính xác.');
        } else {
           handleError(err);
        }
      } finally {
        setLoading(false);
      }

    } else if (authMode === 'register') {
      // Đăng ký mới
      if (!firstName || !lastName || !username) {
         setError('Vui lòng điền đầy đủ các thông tin cá nhân.');
         setLoading(false);
         return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Lưu thông tin người dùng vào Firestore Database
        await setDoc(doc(db, 'users', user.uid), {
          firstName,
          lastName,
          username,
          email,
          role: 'user',
          createdAt: new Date()
        });
        
        setError('');
        alert('Tạo hồ sơ thành công! Mời bạn tiếp tục sử dụng hệ thống.');
        navigate('/');
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
           setError('Tài khoản Email này đã được sử dụng.');
        } else if (err.code === 'auth/weak-password') {
           setError('Mật khẩu yếu. Vui lòng sử dụng mật khẩu trên 6 ký tự.');
        } else {
           handleError(err);
        }
      } finally {
        setLoading(false);
      }
    }
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

      const delta = totp.validate({ token: otpCode, window: 1 });
      if (delta !== null) {
        if (step === '2fa_setup') {
          await setDoc(doc(db, 'system', 'admin_config'), {
            totpSecret: totpSecret,
            updatedAt: new Date()
          });
        }
        localStorage.setItem('bct_admin_session', 'true');
        navigate('/admin');
      } else {
        setError('Mã xác thực không đúng. Vui lòng kiểm tra lại!');
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      console.error(err);
      handleError(err);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(circle at center, #111 0%, #050505 100%)'
    }}>
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
          {step === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <Link to="/" style={{ display: 'inline-block', marginBottom: '0.5rem', textDecoration: 'none' }}>
                  <h1 style={{ fontSize: '2rem', fontFamily: '"Share Tech Mono", monospace' }} className="text-gradient">
                    BCT0902 // {authMode === 'login' ? 'TRUY CẬP' : 'HỒ SƠ MỚI'}
                  </h1>
                </Link>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                   <button 
                     onClick={() => setAuthMode('login')} 
                     style={{ background: 'none', border: 'none', color: authMode === 'login' ? 'var(--accent-main)' : 'var(--text-muted)', fontWeight: authMode === 'login' ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                   >ĐĂNG NHẬP</button>
                   <span style={{ color: 'var(--text-muted)' }}>|</span>
                   <button 
                     onClick={() => setAuthMode('register')}
                     style={{ background: 'none', border: 'none', color: authMode === 'register' ? 'var(--accent-main)' : 'var(--text-muted)', fontWeight: authMode === 'register' ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                   >ĐĂNG KÝ</button>
                </div>
              </div>

              {error && <div className="error-box" style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}

              <form onSubmit={executeAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {authMode === 'register' && (
                  <>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Họ đệm" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                      </div>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input type="text" placeholder="Tên" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <UserCircle size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="text" placeholder="Username (Biệt danh)" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                    </div>
                  </>
                )}

                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder={authMode === 'login' ? "Email / ADMIN_NETWORK_ID" : "Email"} value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" placeholder={authMode === 'login' ? "Mật mã bảo mật" : "Nhập mật khẩu (Tối thiểu 6 ký tự)"} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', opacity: loading ? 0.7 : 1 }} disabled={loading}>
                  {loading ? 'ĐANG CHẠY TRÌNH KẾT NỐI...' : (authMode === 'login' ? 'XÁC NHẬN TRUY CẬP' : 'KHỞI TẠO TÀI KHOẢN MỚI')}
                </button>
              </form>

              {authMode === 'login' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>HOẶC MẠNG XÃ HỘI</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => handleSocialLogin(googleProvider)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: '#fff', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Google</button>
                    <button onClick={() => handleSocialLogin(githubProvider)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>GitHub</button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {(step === '2fa_setup' || step === '2fa_verify') && (
            <motion.div key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ textAlign: 'center' }}>
              <button onClick={() => setStep('auth')} style={{ position: 'absolute', left: 0, top: '-2rem', background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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
          SHELL_STATUS: [MODE: {authMode.toUpperCase()}]
        </div>
      </motion.div>

      {/* Museum Style AdBlock Modal */}
      <AnimatePresence>
        {showAdblockModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ background: '#0A0A0A', width: '90%', maxWidth: '550px', padding: '3.5rem 3rem 3rem', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '2px', boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 60px rgba(212, 175, 55, 0.05)', textAlign: 'center', position: 'relative' }}
            >
               <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', background: '#0A0A0A', padding: '0 1.5rem', color: 'var(--accent-gold)' }}>
                 <ShieldCheck size={36} />
               </div>
               
               <h2 style={{ fontFamily: "var(--font-heading), 'Chakra Petch', sans-serif", color: 'var(--accent-gold)', fontSize: '2.2rem', marginBottom: '1.5rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
                 TÁC PHẨM BỊ TỪ CHỐI
               </h2>
               
               <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '2.5rem', fontFamily: 'system-ui, sans-serif' }}>
                 Hệ thống bảo vệ (AdBlock / Shields) hoặc cấu hình mạng đang ngăn chặn tác phẩm này giao tiếp với máy chủ kho lưu trữ.
                 <br/><br/>
                 <span style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', opacity: 0.8 }}>
                   * Nếu ngài KHÔNG dùng AdBlock, hãy kiểm tra xem Domain này đã được "Authorized" trong Firebase Console chưa.
                 </span>
                 <br/><br/>
                 Để chiêm ngưỡng và tham gia giao tiếp với toàn bộ không gian nghệ thuật tại đây, hệ thống xin ngài vui lòng <b style={{ color: '#fff' }}>hạ khiên bảo vệ</b> hoặc kiểm tra lại kết nối mạng.
               </p>

               <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                 <button 
                   onClick={() => { setShowAdblockModal(false); window.location.reload(); }} 
                   style={{ background: 'var(--accent-gold)', padding: '1rem 2rem', border: '1px solid var(--accent-gold)', color: '#000', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', transition: 'all 0.3s' }}
                 >
                   TÔI ĐÃ TẮT & TẢI LẠI
                 </button>
                 <button 
                   onClick={() => setShowAdblockModal(false)}
                   style={{ background: 'transparent', padding: '1rem 2rem', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '1px', transition: 'all 0.3s' }}
                 >
                   THỬ LẠI NGAY
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
