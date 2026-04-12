import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import FilmStrip from './sections/FilmStrip';
import Skills from './sections/Skills';
import TrustedApps from './sections/TrustedApps';
import Footer from './components/Footer';
import Testimonials from './sections/Testimonials';
import Background from './components/Background';
import Login from './pages/Login';
import Utilities from './pages/Utilities';
import FloatingChatBtn from './components/FloatingChatBtn';
import { ConfigProvider } from './context/ConfigContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import { AnimatePresence } from 'framer-motion';
import ScrollToTop from './components/ScrollToTop';

import AdminDashboard from './pages/admin/AdminDashboard';
import Blog from './pages/blog/Blog'; // Assuming I move it to pages/blog/Blog.jsx or keep it simple
import BlogPost from './pages/blog/BlogPost';

const Home = () => (
  <>
    <Hero />
    <About />
    <FilmStrip />
    <Skills />
    <TrustedApps />
    <Testimonials />
  </>
);

function AppRoutes() {
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isUtilitiesPage = location.pathname.startsWith('/utilities');
  const isBlogPage = location.pathname.startsWith('/blog');

  const { isAdmin } = useAuth();

  return (
    <>
      <AnimatePresence>
        {isInitialLoading && (
          <LoadingScreen onComplete={() => setIsInitialLoading(false)} />
        )}
      </AnimatePresence>

      <div style={{ position: 'relative' }}>
        <Background />
        {!isLoginPage && !isAdminPage && <Navbar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/utilities/*" element={<Utilities />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Login />} />
        </Routes>
        {!isAdminPage && <FloatingChatBtn />}
        {!isLoginPage && !isAdminPage && !isUtilitiesPage && !isBlogPage && <Footer />}
        {isBlogPage && <Footer />}
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <ScrollToTop />
        <AppRoutes />
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
