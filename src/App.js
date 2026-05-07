// No início do seu App.js, adicione:
import { useState, useEffect } from 'react';
import './App.css';
import Header from './Components/Header';
import Main from './Components/Main';
import ConfigPanel from './Components/ConfigPanel';
import TvApp from './TvApp';
import style from './style.module.css';

function App() {
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

  // Se for TV Samsung, carrega a versão simplificada
  if (isTvBrowser) {
    return <TvApp />;
  }

  // Se for navegador normal, carrega o app completo
  // ... resto do seu App.js original ...
  
  const handleSaveConfig = (newConfig) => {
    setSlaConfig(newConfig);
    localStorage.setItem('slaConfig', JSON.stringify(newConfig));
    setConfigOpen(false);
  };

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