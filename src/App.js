// App.js - Versão corrigida (Hooks sempre chamados)
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
  // TODOS OS HOOKS DEVEM SER CHAMADOS PRIMEIRO
  // NÃO CONDICIONALMENTE!
  // ============================================
  
  // Detecta modo debug (sem hook, é só uma variável)
  const isDebugMode = typeof window !== 'undefined' && (
    window.location.search.includes('debug=true') ||
    localStorage.getItem('debugMode') === 'true'
  );

  // Hooks (sempre chamados, na mesma ordem)
  const [isTvBrowser, setIsTvBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  // useEffect SEMPRE chamado
  useEffect(() => {
    // Detecta navegador da TV Samsung
    const userAgent = navigator.userAgent.toLowerCase();
    const isSamsungTv = userAgent.includes('tizen') || 
                         userAgent.includes('samsungbrowser') ||
                         userAgent.includes('smarttv');
    
    console.log('USER AGENT:', userAgent);
    console.log('IS SAMSUNG TV:', isSamsungTv);
    
    // Detecta também por falta de suporte a backdrop-filter
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
    
    setIsTvBrowser(isSamsungTv || !supportsBackdropFilter);
    setIsLoading(false);
  }, []);

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

  // ============================================
  // RENDERIZAÇÃO CONDICIONAL DEPOIS DOS HOOKS
  // ============================================
  
  // 1. Prioridade: Modo Debug
  if (isDebugMode) {
    return <DebugConsole />;
  }

  // 2. Segunda prioridade: TV Samsung
  if (isTvBrowser) {
    return <TvApp />;
  }

  // 3. Tela de loading
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f172a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #3b82f6',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Iniciando Sistema...</div>
        </div>
      </div>
    );
  }

  // 4. App normal
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

// Adicione esta keyframe global se não existir
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;