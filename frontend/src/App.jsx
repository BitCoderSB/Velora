import { useState } from 'react';
import WelcomePage from '@components/pages/WelcomePage.jsx';
import HomePage from '@components/pages/HomePage.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome'); // 'welcome', 'home'

  const navigateToHome = () => {
    setCurrentPage('home');
  };

  const navigateBackToWelcome = () => {
    setCurrentPage('welcome');
  };

  return (
    <div className="h-screen flex flex-col dark bg-slate-950 text-slate-100">
      {currentPage === 'welcome' && (
        <WelcomePage onStart={navigateToHome} />
      )}
      
      {currentPage === 'home' && (
        <HomePage onBack={navigateBackToWelcome} />
      )}
    </div>
  );
}
