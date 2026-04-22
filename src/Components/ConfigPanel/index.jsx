import { useState } from 'react';
import style from './style.module.css';

export default function ConfigPanel({ config, onSave, onClose }) {
    const [localConfig, setLocalConfig] = useState(config);

    const handleChange = (key, value) => {
        setLocalConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className={style.overlay}>
            <div className={style.panel}>
                <div className={style.header}>
                    <div className={style.headerIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.07.07A10 10 0 0 0 12 17.66a10 10 0 0 0 6.18-2.24l.07-.07z" />
                        </svg>
                    </div>
                    <div className={style.headerText}>
                        <h2>Configurações do Sistema</h2>
                        <p>Personalize o comportamento do painel de suporte</p>
                    </div>
                    <button className={style.closeBtn} onClick={onClose}>✕</button>
                </div>
                
                <div className={style.content}>
                    {/* SLA SUPORTE */}
                    <div className={style.card}>
                        <div className={style.cardHeader}>
                            <span className={style.cardIcon}>🆘</span>
                            <h3>SLA - Suporte (Atendimento Inicial)</h3>
                        </div>
                        <div className={style.cardBody}>
                            <div className={style.setting}>
                                <label>⏰ Tempo máximo para assumir ticket:</label>
                                <div className={style.inputWrapper}>
                                    <input 
                                        type="range" 
                                        value={localConfig.supportTakeoverTime}
                                        onChange={(e) => handleChange('supportTakeoverTime', parseInt(e.target.value))}
                                        min="5"
                                        max="30"
                                        step="1"
                                    />
                                    <span className={style.valueDisplay}>{localConfig.supportTakeoverTime} min</span>
                                </div>
                                <small>Ticket deve ser movido para "Em Andamento" neste tempo</small>
                            </div>
                            <div className={style.setting}>
                                <label>⚠️ Tempo para alerta de atraso (Suporte):</label>
                                <div className={style.inputWrapper}>
                                    <input 
                                        type="range" 
                                        value={localConfig.supportWarningTime}
                                        onChange={(e) => handleChange('supportWarningTime', parseInt(e.target.value))}
                                        min="10"
                                        max="40"
                                        step="1"
                                    />
                                    <span className={style.valueDisplay}>{localConfig.supportWarningTime} min</span>
                                </div>
                                <small>Alerta quando estourar este tempo sem movimentação</small>
                            </div>
                            <div className={style.setting}>
                                <label>⏱️ Tempo máximo de resolução (Suporte):</label>
                                <div className={style.inputWrapper}>
                                    <input 
                                        type="range" 
                                        value={localConfig.supportResolutionTime}
                                        onChange={(e) => handleChange('supportResolutionTime', parseInt(e.target.value))}
                                        min="30"
                                        max="60"
                                        step="5"
                                    />
                                    <span className={style.valueDisplay}>{localConfig.supportResolutionTime} min</span>
                                </div>
                                <small>Tempo máximo para resolver o ticket</small>
                            </div>
                        </div>
                    </div>

                    {/* SLA DESENVOLVIMENTO */}
                    <div className={style.card}>
                        <div className={style.cardHeader}>
                            <span className={style.cardIcon}>💻</span>
                            <h3>SLA - Desenvolvimento (Após escalonamento)</h3>
                        </div>
                        <div className={style.cardBody}>
                            <div className={style.setting}>
                                <label>⏰ Tempo para escalonar para Dev:</label>
                                <div className={style.inputWrapper}>
                                    <input 
                                        type="range" 
                                        value={localConfig.escalationTime}
                                        onChange={(e) => handleChange('escalationTime', parseInt(e.target.value))}
                                        min="30"
                                        max="60"
                                        step="5"
                                    />
                                    <span className={style.valueDisplay}>{localConfig.escalationTime} min</span>
                                </div>
                                <small>Após este tempo, ticket vai para o time de dev</small>
                            </div>
                            <div className={style.setting}>
                                <label>⏱️ Tempo máximo de correção (Dev):</label>
                                <div className={style.inputWrapper}>
                                    <input 
                                        type="range" 
                                        value={localConfig.devResolutionTime}
                                        onChange={(e) => handleChange('devResolutionTime', parseInt(e.target.value))}
                                        min="30"
                                        max="120"
                                        step="5"
                                    />
                                    <span className={style.valueDisplay}>{localConfig.devResolutionTime} min</span>
                                </div>
                                <small>Tempo máximo para o time de desenvolvimento corrigir</small>
                            </div>
                        </div>
                    </div>

                    {/* FILTROS */}
                    <div className={style.card}>
                        <div className={style.cardHeader}>
                            <span className={style.cardIcon}>🔍</span>
                            <h3>Filtros de Visualização</h3>
                        </div>
                        <div className={style.cardBody}>
                            <div className={style.setting}>
                                <label>📋 Tickets Abertos (dias atrás):</label>
                                <div className={style.inputWrapper}>
                                    <input 
                                        type="range" 
                                        value={localConfig.openTicketsDays}
                                        onChange={(e) => handleChange('openTicketsDays', parseInt(e.target.value))}
                                        min="1"
                                        max="7"
                                        step="1"
                                    />
                                    <span className={style.valueDisplay}>{localConfig.openTicketsDays} dias</span>
                                </div>
                                <small>Exibir tickets abertos nos últimos {localConfig.openTicketsDays} dias</small>
                            </div>
                            <div className={style.setting}>
                                <label>✅ Finalizados (dias atrás):</label>
                                <div className={style.inputWrapper}>
                                    <input 
                                        type="range" 
                                        value={localConfig.finishedDays}
                                        onChange={(e) => handleChange('finishedDays', parseInt(e.target.value))}
                                        min="1"
                                        max="7"
                                        step="1"
                                    />
                                    <span className={style.valueDisplay}>{localConfig.finishedDays} dias</span>
                                </div>
                                <small>Exibir finalizados dos últimos {localConfig.finishedDays} dias</small>
                            </div>
                        </div>
                    </div>

                    {/* NOTIFICAÇÕES */}
                    <div className={style.card}>
                        <div className={style.cardHeader}>
                            <span className={style.cardIcon}>🔔</span>
                            <h3>Notificações</h3>
                        </div>
                        <div className={style.cardBody}>
                            <div className={style.toggleWrapper}>
                                <label className={style.toggle}>
                                    <input 
                                        type="checkbox" 
                                        checked={localConfig.soundEnabled}
                                        onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                                    />
                                    <span className={style.toggleSlider}></span>
                                    <span className={style.toggleLabel}>
                                        <span>🔔 Alertas Visuais</span>
                                        <small>Popup na tela para alertas SLA</small>
                                    </span>
                                </label>
                            </div>
                            <div className={style.toggleWrapper}>
                                <label className={style.toggle}>
                                    <input 
                                        type="checkbox" 
                                        checked={localConfig.voiceEnabled}
                                        onChange={(e) => handleChange('voiceEnabled', e.target.checked)}
                                    />
                                    <span className={style.toggleSlider}></span>
                                    <span className={style.toggleLabel}>
                                        <span>🗣️ Alertas por Voz</span>
                                        <small>Narração automática de alertas SLA</small>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* RESUMO */}
                    <div className={style.summaryCard}>
                        <div className={style.summaryHeader}>
                            <span>📊</span>
                            <h3>Resumo das Configurações</h3>
                        </div>
                        <div className={style.summaryGrid}>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Assumir ticket:</span>
                                <span className={style.summaryValue}>{localConfig.supportTakeoverTime} min</span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Alerta Suporte:</span>
                                <span className={style.summaryValue}>{localConfig.supportWarningTime} min</span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Resolução Suporte:</span>
                                <span className={style.summaryValue}>{localConfig.supportResolutionTime} min</span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Escalonamento:</span>
                                <span className={style.summaryValue}>{localConfig.escalationTime} min</span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Resolução Dev:</span>
                                <span className={style.summaryValue}>{localConfig.devResolutionTime} min</span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Filtrar abertos:</span>
                                <span className={style.summaryValue}>{localConfig.openTicketsDays} dias</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={style.footer}>
                    <button className={style.cancelBtn} onClick={onClose}>Cancelar</button>
                    <button className={style.saveBtn} onClick={() => onSave(localConfig)}>💾 Salvar Configurações</button>
                </div>
            </div>
        </div>
    );
}