import { useState } from 'react';
import LandingPage from '@components/pages/LandingPage.jsx';
import WelcomePage from '@components/pages/WelcomePage.jsx';
import RegisterPage from '@components/pages/RegisterPage.jsx';
import Registro2Page from '@components/pages/Registro2Page.jsx';
import RegistroFacialPage from '@components/pages/RegistroFacialPage.jsx';
import HomePage from '@components/pages/HomePage.jsx';
import ClientDashboardPage from '@components/pages/ClientDashboardPage.jsx';
import CobrarPage from '@components/pages/CobrarPage.jsx';
import ConfirmTransferPage from '@components/pages/ConfirmTransferPage.jsx';
import FinalConfirmationPage from '@components/pages/FinalConfirmationPage.jsx';
import TransferReceiptPage from '@components/pages/TransferReceiptPage.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'welcome', 'register', 'registro2', 'registrofacial', 'home', 'clientDashboard', 'cobrar', 'transfer', 'confirm', 'finalConfirm', 'receipt'
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [confirmationUrl, setConfirmationUrl] = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);

  const navigateToWelcome = () => {
    setCurrentPage('welcome');
  };

  const navigateToHome = () => {
    setCurrentPage('home');
  };

  const navigateToRegister = () => {
    setCurrentPage('register');
  };

  const navigateToRegistro2 = () => {
    setCurrentPage('registro2');
  };

  const navigateToRegistroFacial = () => {
    setCurrentPage('registrofacial');
  };

  const navigateBackToRegister = () => {
    setCurrentPage('register');
  };

  const navigateBackToRegistro2 = () => {
    setCurrentPage('registro2');
  };

  const navigateToClientDashboard = () => {
    setCurrentPage('clientDashboard');
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

  const navigateBackToCobrar = () => {
    setCurrentPage('cobrar');
  };

  const navigateToConfirm = () => {
    setCurrentPage('confirm');
  };

  const navigateBackToCobrar2 = () => {
    setCurrentPage('cobrar');
  };

  const navigateToFinalConfirm = () => {
    setCurrentPage('finalConfirm');
  };

  const navigateBackToConfirm = () => {
    setCurrentPage('confirm');
  };

  const navigateToReceipt = () => {
    setCurrentPage('receipt');
  };

  const handleTransferSubmit = async (transferData) => {
    console.log('Datos de transferencia:', transferData);
    // Guardar los datos temporalmente y navegar a la página de confirmación
    setPendingTransfer(transferData);
    navigateToConfirm();
  };

  const handleConfirmTransfer = async (transferDataWithNip) => {
    console.log('Confirmación de transferencia con NIP:', transferDataWithNip);
    
    // Aquí se implementará la lógica de envío al backend con el NIP
    // El backend debe devolver una URL de confirmación
    // Por ahora simulamos la respuesta con una URL de ejemplo
    
    try {
      // Simular llamada al backend
      // const response = await fetch('/api/transfer/initiate', {
      //   method: 'POST',
      //   body: JSON.stringify(transferDataWithNip)
      // });
      // const data = await response.json();
      // const confirmUrl = data.confirmationUrl;
      
      // Por ahora usamos una URL de ejemplo
      const exampleConfirmUrl = `https://www.liverpool.com.mx/tienda/home`;
      
      setConfirmationUrl(exampleConfirmUrl);
      navigateToFinalConfirm();
      
    } catch (error) {
      console.error('Error al confirmar transferencia:', error);
      alert('Error al procesar la transferencia. Por favor intenta de nuevo.');
    }
  };

  const handleFinalComplete = (transactionData) => {
    console.log('Proceso de transferencia completado:', transactionData);
    
    // Combinar datos de la transferencia pendiente con los datos de la transacción
    const completeTransferResult = {
      // Datos de la transacción ILP (simulados o del backend)
      transactionId: transactionData?.transactionId || `TXN-ILP-${Date.now()}`,
      status: transactionData?.status || 'COMPLETED',
      timestamp: transactionData?.timestamp || new Date().toISOString(),
      fulfillment: transactionData?.fulfillment || 'HS8e5Ew02XKAglyus2dh2Ohabuqmy3HDM8EXMLz22ok=',
      
      // Datos originales de la transferencia del usuario
      amount: pendingTransfer?.amount || 0,
      currency: 'USD',
      description: pendingTransfer?.description || '',
      walletUrl: pendingTransfer?.walletUrl || '',
      senderWallet: '$wallet.velora.app/usuario',
      receiverWallet: pendingTransfer?.walletUrl || '',
      
      // Datos ILP adicionales
      fee: '0.01',
      exchangeRate: '1.00',
      connectorRoute: 'velora.connector -> destination.connector',
      paymentPointer: pendingTransfer?.walletUrl || '$ilp.rafiki.money/destinatario',
      
      // ILP Packet
      ilpPacket: {
        amount: pendingTransfer?.amount ? (parseFloat(pendingTransfer.amount) * 1000000).toString() : '0',
        destination: `g.crypto.${(pendingTransfer?.walletUrl || 'recipient').split('/').pop()}`,
        executionCondition: 'uzoYx3K6u+Nt6kZjbN6KmH4LcipUsRcYHRO8CU2VRIg=',
        expiresAt: new Date(Date.now() + 30000).toISOString(),
      },
    };
    
    setTransferResult(completeTransferResult);
    navigateToReceipt();
  };

  const handleReceiptBack = () => {
    // Limpiar todos los datos y regresar a home
    setPendingTransfer(null);
    setConfirmationUrl(null);
    setTransferResult(null);
    navigateToHome();
  };

  return (
    <div className="h-screen flex flex-col dark bg-slate-950 text-slate-100">
      {currentPage === 'landing' && (
        <LandingPage onContinue={navigateToWelcome} />
      )}

      {currentPage === 'welcome' && (
        <WelcomePage 
          onStartVendor={navigateToRegister} 
          onStartClient={navigateToClientDashboard}
          onDevRegistroFacial={navigateToRegistroFacial}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage 
          onBack={navigateBackToWelcome}
          onRegister={(userData) => {
            console.log('RegisterPage - Datos recibidos:', userData);
            setRegistrationData(userData);
            console.log('Navegando a Registro2Page');
            navigateToRegistro2();
          }}
        />
      )}

      {currentPage === 'registro2' && registrationData && (
        <Registro2Page 
          userData={registrationData}
          onBack={navigateBackToRegister}
          onComplete={(completeData) => {
            console.log('Datos de Interledger completados:', completeData);
            console.log('Navegando a RegistroFacial con datos:', completeData);
            setRegistrationData(prevData => {
              const newData = { ...prevData, ...completeData };
              console.log('registrationData actualizado a:', newData);
              return newData;
            });
            navigateToRegistroFacial();
          }}
        />
      )}

      {currentPage === 'registrofacial' && registrationData && (
        <RegistroFacialPage 
          userData={registrationData}
          onBack={navigateBackToRegistro2}
          onComplete={(completeDataWithFace) => {
            console.log('✅ Registro completo con foto facial:', completeDataWithFace);
            console.log('Navegando a ClientDashboard');
            // Limpiar datos de registro
            setRegistrationData(null);
            // Navegar al dashboard del cliente
            navigateToClientDashboard();
          }}
        />
      )}

      {currentPage === 'clientDashboard' && (
        <ClientDashboardPage 
          onBack={navigateBackToWelcome}
          onBecomeVendor={navigateToHome}
        />
      )}
      
      {currentPage === 'home' && (
        <HomePage 
          onBack={navigateBackToWelcome} 
          onCobrar={navigateToCobrar}
        />
      )}

      {currentPage === 'cobrar' && (
        <CobrarPage 
          onBack={navigateBackToHome}
          onVerified={(result) => {
            console.log('Verificación completada:', result);
            // Si la verificación fue exitosa, navegar directamente a confirm
            if (result.match) {
              // Aquí podríamos pasar los datos del cobro directamente
              setPendingTransfer({
                walletUrl: result.walletUrl || '',
                amount: result.amount || 0,
                description: result.description || ''
              });
              navigateToConfirm();
            }
          }}
        />
      )}

      {currentPage === 'confirm' && pendingTransfer && (
        <ConfirmTransferPage 
          transferData={pendingTransfer}
          onBack={navigateBackToCobrar2}
          onConfirm={handleConfirmTransfer}
        />
      )}

      {currentPage === 'finalConfirm' && confirmationUrl && (
        <FinalConfirmationPage 
          confirmationUrl={confirmationUrl}
          onBack={navigateBackToConfirm}
          onComplete={handleFinalComplete}
        />
      )}

      {currentPage === 'receipt' && transferResult && (
        <TransferReceiptPage 
          transferResult={transferResult}
          onBack={handleReceiptBack}
        />
      )}
    </div>
  );
}
