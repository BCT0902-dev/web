import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import TrustedApps from './sections/TrustedApps';
import Footer from './components/Footer';
import Background from './components/Background';
import Login from './pages/Login';

const Home = () => (
  <>
    <Hero />
    <About />
    <Skills />
    <TrustedApps />
  </>
);

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div style={{ position: 'relative' }}>
      <Background />
      {!isLoginPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default App;
