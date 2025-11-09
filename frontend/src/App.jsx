import { useState } from 'react';
import WelcomePage from '@components/pages/WelcomePage.jsx';
import HomePage from '@components/pages/HomePage.jsx';
import CobrarPage from '@components/pages/CobrarPage.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome'); // 'welcome', 'home', 'cobrar'

  const navigateToHome = () => {
    setCurrentPage('home');
  };

  const navigateBackToWelcome = () => {
    setCurrentPage('welcome');
  };

  const navigateToCobrar = () => {
    setCurrentPage('cobrar');
  };

  const navigateBackToHome = () => {
    setCurrentPage('home');
  };

  return (
    <div className="h-screen flex flex-col dark bg-slate-950 text-slate-100">
      {currentPage === 'welcome' && (
        <WelcomePage onStart={navigateToHome} />
      )}
      
      {currentPage === 'home' && (
        <HomePage onBack={navigateBackToWelcome} onCobrar={navigateToCobrar} />
      )}

      {currentPage === 'cobrar' && (
        <CobrarPage onBack={navigateBackToHome} />
      )}
    </div>
  );
}
