import { useState, useEffect } from 'react';
import './App.css';
import Header from './Components/Header';
import Main from './Components/Main';
import ConfigPanel from './Components/ConfigPanel';
import style from './style.module.css';

function App() {
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
    // Configurações padrão - SLA de Suporte e Desenvolvimento
    return {
      // SLA Suporte
      supportTakeoverTime: 15,      // 15 min para assumir ticket
      supportWarningTime: 30,       // 30 min alerta de atraso
      supportResolutionTime: 45,    // 45 min para resolver
      
      // SLA Desenvolvimento
      escalationTime: 45,           // 45 min para escalonar
      devResolutionTime: 60,        // 60 min para correção
      
      // Filtros
      openTicketsDays: 2,           // Exibir tickets dos últimos 2 dias
      finishedDays: 1,              // Exibir finalizados do dia
      
      // Notificações
      soundEnabled: true,
      voiceEnabled: true,
      alertRepeat: 2
    };
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveConfig = (newConfig) => {
    setSlaConfig(newConfig);
    localStorage.setItem('slaConfig', JSON.stringify(newConfig));
    setConfigOpen(false);
    
    const notification = document.createElement('div');
    notification.textContent = '✅ Configurações salvas com sucesso!';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      z-index: 10002;
      animation: fadeInOut 2s ease;
      font-weight: 600;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
    
    window.dispatchEvent(new Event('refreshData'));
  };

  if (isLoading) {
    return (
      <div className={style.loadingOverlay}>
        <div className={style.loadingContent}>
          <div className={style.loadingSpinner}></div>
          <div className={style.loadingText}>Carregando Painel de Suporte...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={style.container}>
      <Header onConfigClick={() => setConfigOpen(true)} />
      <Main slaConfig={slaConfig} />
      {configOpen && (
        <ConfigPanel 
          config={slaConfig} 
          onSave={handleSaveConfig} 
          onClose={() => setConfigOpen(false)} 
        />
      )}
    </div>
  );
}

export default App;