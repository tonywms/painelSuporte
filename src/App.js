// App.js - Versão completa com modo debug
import { useState, useEffect } from 'react';
import './App.css';
import Header from './Components/Header';
import Main from './Components/Main';
import ConfigPanel from './Components/ConfigPanel';
import TvApp from './TvApp';
import DebugConsole from './DebugConsole';
import style from './style.module.css';

function App() {
  // ============================================
  // VERIFICAÇÃO DE MODO DEBUG PRIMEIRO
  // ============================================
  const isDebugMode = typeof window !== 'undefined' && (
    window.location.search.includes('debug=true') ||
    localStorage.getItem('debugMode') === 'true'
  );

  // SE FOR MODO DEBUG, MOSTRA O CONSOLE
  if (isDebugMode) {
    return <DebugConsole />;
  }

  // ============================================
  // DETECÇÃO DE TV SAMSUNG
  // ============================================
  const [isTvBrowser, setIsTvBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detecta navegador da TV Samsung
    const userAgent = navigator.userAgent.toLowerCase();
    const isSamsungTv = userAgent.includes('tizen') || 
                         userAgent.includes('samsungbrowser') ||
                         userAgent.includes('smarttv');
    
    // Detecta também por falta de suporte a backdrop-filter
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
    
    setIsTvBrowser(isSamsungTv || !supportsBackdropFilter);
    setIsLoading(false);
  }, []);

  const [configOpen, setConfigOpen] = useState(false);
  const [slaConfig, setSlaConfig] = useState(() => {
    const saved = localStorage.getItem('slaConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao carregar configurações', e);
      }
    }
    return {
      supportTakeoverTime: 15,
      supportWarningTime: 30,
      supportResolutionTime: 45,
      escalationTime: 45,
      devResolutionTime: 60,
      openTicketsDays: 2,
      finishedDays: 1,
      soundEnabled: true,
      voiceEnabled: true,
      alertRepeat: 2
    };
  });

  const handleSaveConfig = (newConfig) => {
    setSlaConfig(newConfig);
    localStorage.setItem('slaConfig', JSON.stringify(newConfig));
    setConfigOpen(false);
    
    // Notificação de sucesso
    const notification = document.createElement('div');
    notification.textContent = '✅ Configurações salvas com sucesso!';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      z-index: 10002;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
    
    window.dispatchEvent(new Event('refreshData'));
  };

  // Se for TV Samsung, carrega a versão simplificada
  if (isTvBrowser) {
    return <TvApp />;
  }

  // Tela de loading
  if (isLoading) {
    return (
      <div className={style.loadingOverlay}>
        <div className={style.loadingContent}>
          <div className={style.loadingSpinner}></div>
          <div className={style.loadingText}>Iniciando Sistema...</div>
        </div>
      </div>
    );
  }

  // App normal
  return (
    <div className={style.appContainer}>
      <div className={style.particlesBg} />
      <Header onConfigClick={() => setConfigOpen(true)} />
      <main className={style.mainLayout}>
        <Main slaConfig={slaConfig} />
      </main>
      {configOpen && (
        <ConfigPanel 
          config={slaConfig} 
          onSave={handleSaveConfig} 
          onClose={() => setConfigOpen(false)} 
        />
      )}
      <div className={style.scanlines} />
    </div>
  );
}

export default App;