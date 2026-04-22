// src/Components/Main/index.jsx
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Tabela from './Tabela/index';
import style from './layout.module.css';
import { tvFetch, isSamsungTV, safeSpeak } from '../../utils/tvCompatibility';

// Função para formatar minutos
const formatMinutes = (minutes) => {
    if (!minutes && minutes !== 0) return '0min';
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = Math.floor(absMinutes % 60);
    const secs = Math.floor((absMinutes % 1) * 60);
    
    if (hours > 0) {
        if (mins > 0) return `${hours}h ${mins}m`;
        if (secs > 0) return `${hours}h ${secs}s`;
        return `${hours}h`;
    }
    if (mins > 0) {
        if (secs > 0) return `${mins}m ${secs}s`;
        return `${mins}m`;
    }
    return `${secs}s`;
};

const formatSlaTime = (minutes) => {
    if (!minutes && minutes !== 0) return '0min';
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes % 1) * 60);
    if (mins > 0) {
        if (secs > 0) return `${mins}m ${secs}s`;
        return `${mins}m`;
    }
    return `${secs}s`;
};

const isTicketFromToday = (createdAt) => {
    if (!createdAt) return false;
    const ticketDate = new Date(createdAt);
    const today = new Date();
    return ticketDate.getDate() === today.getDate() &&
           ticketDate.getMonth() === today.getMonth() &&
           ticketDate.getFullYear() === today.getFullYear();
};

export default function Main({ slaConfig }) {
    const [tasks, setTasks] = useState([]);
    const [alerta, setAlerta] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
    const [isTv, setIsTv] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('online');
    
    const alertaQueue = useRef([]);
    const isProcessing = useRef(false);
    const currentUtterance = useRef(null);
    const alertadosRef = useRef(new Set());
    const novosTicketsRef = useRef(new Set());
    const fetchAttempts = useRef(0);
    const lastSuccessRef = useRef(null);

    // Detectar TV no início
    useEffect(() => {
        const tvDetected = isSamsungTV();
        setIsTv(tvDetected);
        console.log('📺 Dispositivo detectado:', tvDetected ? 'TV Samsung' : 'Outro dispositivo');
        console.log('🌐 User Agent:', navigator.userAgent);
        
        // Monitorar conexão
        window.addEventListener('online', () => setConnectionStatus('online'));
        window.addEventListener('offline', () => setConnectionStatus('offline'));
        
        return () => {
            window.removeEventListener('online', () => setConnectionStatus('online'));
            window.removeEventListener('offline', () => setConnectionStatus('offline'));
        };
    }, []);

        const ativarAlertas = () => {
            console.log('🔊 Ativando alertas de voz...');
            
            // Forçar o speechSynthesis a "acordar" no desktop
            if (window.speechSynthesis) {
                try {
                    // Cancela qualquer fala pendente
                    window.speechSynthesis.cancel();
                    
                    // Tenta falar algo pequeno para ativar (às vezes precisa)
                    const testUtterance = new SpeechSynthesisUtterance(' ');
                    testUtterance.volume = 0;
                    window.speechSynthesis.speak(testUtterance);
                    
                    // Pequeno delay e depois fala a mensagem real
                    setTimeout(() => {
                        const welcomeMsg = new SpeechSynthesisUtterance('Alertas de voz ativados');
                        welcomeMsg.lang = 'pt-BR';
                        welcomeMsg.rate = 0.9;
                        welcomeMsg.volume = 1;
                        window.speechSynthesis.speak(welcomeMsg);
                    }, 100);
                    
                } catch(e) {
                    console.log('Erro ao ativar voz:', e);
                }
            }
            
            setAudioPermissionGranted(true);
            localStorage.setItem('audioPermissionGranted', 'true');
            
            console.log('🔊 audioPermissionGranted setado para:', true);
        };

    // Processa a fila de alertas - UM POR VEZ
    // Processa a fila de alertas - COM TIMEOUT DE SEGURANÇA (mantém seus botões)
    const processNextAlert = useCallback(() => {
        if (isProcessing.current) {
            console.log('⚠️ Já processando um alerta, aguardando...');
            return;
        }
        
        if (alertaQueue.current.length === 0) {
            return;
        }
        
        const nextAlert = alertaQueue.current.shift();
        isProcessing.current = true;
        
        console.log('🔔 Processando alerta:', nextAlert.displayMessage);
        
        // Mostra o alerta visual
        setAlerta(nextAlert.displayMessage);
        
        // TIMEOUT DE SEGURANÇA: Força fechamento do alerta após 10 segundos
        // Isso evita congelamento se a voz travar
        const safetyTimeout = setTimeout(() => {
            console.log('⚠️ TIMEOUT DE SEGURANÇA: Forçando fechamento do alerta');
            
            // Cancela voz se estiver travada
            if (window.speechSynthesis) {
                try {
                    window.speechSynthesis.cancel();
                } catch(e) {}
            }
            
            setAlerta(null);
            isProcessing.current = false;
            
            // Processa próximo alerta
            setTimeout(() => processNextAlert(), 500);
        }, 10000); // 10 segundos máximo
        
        // Se voz estiver ativada
        // Se voz estiver ativada
        if (slaConfig.voiceEnabled && audioPermissionGranted) {
            console.log('🔊 [DEBUG] Entrou no IF da voz');
            console.log('🔊 [DEBUG] Mensagem:', nextAlert.voiceMessage);
            console.log('🔊 [DEBUG] slaConfig.voiceEnabled:', slaConfig.voiceEnabled);
            console.log('🔊 [DEBUG] audioPermissionGranted:', audioPermissionGranted);
            
            safeSpeak(nextAlert.voiceMessage, () => {
                console.log('🔊 Fala terminada, removendo alerta');
                clearTimeout(safetyTimeout);
                setAlerta(null);
                isProcessing.current = false;
                setTimeout(() => processNextAlert(), 500);
            });
        } else {
            console.log('🔊 [DEBUG] Entrou no ELSE - Voz desativada');
            console.log('🔊 [DEBUG] slaConfig.voiceEnabled:', slaConfig.voiceEnabled);
            console.log('🔊 [DEBUG] audioPermissionGranted:', audioPermissionGranted);
            
            // Sem voz, mantém o alerta visual por 4 segundos
            setTimeout(() => {
                clearTimeout(safetyTimeout);
                setAlerta(null);
                isProcessing.current = false;
                setTimeout(() => processNextAlert(), 500);
            }, 4000);
        }
    }, [slaConfig.voiceEnabled, audioPermissionGranted]);

    const fetchData = useCallback(async () => {
        try {
            setApiError(null);
            
            // Usar URL completa no Vercel
            const apiUrl = window.location.origin + `/api/runrun?t=${new Date().getTime()}`;
            console.log('🔄 Buscando dados de:', apiUrl);
            console.log('📡 Status da conexão:', connectionStatus);
            
            if (connectionStatus === 'offline') {
                throw new Error('Sem conexão com a internet');
            }
            
            const data = await tvFetch(apiUrl);
            
            if (!data) {
                throw new Error('Resposta vazia da API');
            }
            
            if (data.erro) {
                throw new Error(data.erro);
            }
            
            const rawTasks = Array.isArray(data) ? data : [data];
            console.log('✅ Dados recebidos:', rawTasks.length, 'tickets');
            
            // Resetar contador de tentativas no sucesso
            fetchAttempts.current = 0;
            lastSuccessRef.current = new Date();

            const formattedTasks = rawTasks.map(task => {
                if (task.assignments && task.assignments.length > 0) {
                    const names = task.assignments.map(a => a.assignee_name?.split(' ')[0] || 'N/A');
                    task.exibir_usuarios = names.join(' / ');
                } else {
                    task.exibir_usuarios = task.user_name ? task.user_name.split(' ')[0] : 'Pendente';
                }
                
                if (task.created_at) {
                    const minutesDiff = (new Date() - new Date(task.created_at)) / (1000 * 60);
                    task.minutesOpen = minutesDiff;
                    task.timeOpenFormatted = formatMinutes(minutesDiff);
                    
                    if (task.board_stage_name === "A fazer" || task.board_stage_name === "Em aprovação") {
                        if (minutesDiff <= slaConfig.supportTakeoverTime) {
                            task.slaStatus = 'normal';
                            task.slaMessage = `🟢 Normal (${formatSlaTime(minutesDiff)})`;
                        } else if (minutesDiff <= slaConfig.supportWarningTime) {
                            task.slaStatus = 'warning';
                            task.slaMessage = `🟡 Atenção (${formatSlaTime(minutesDiff)})`;
                        } else if (minutesDiff <= slaConfig.supportResolutionTime) {
                            task.slaStatus = 'critical';
                            task.slaMessage = `🔴 URGENTE (${formatSlaTime(minutesDiff)})`;
                        } else {
                            task.slaStatus = 'critical';
                            task.slaMessage = `🔴 ATRASADO (${formatSlaTime(minutesDiff)})`;
                        }
                    }
                }
                return task;
            });


            // Verificar novos tickets de HOJE
            // Verificar novos tickets de HOJE
        const novosTickets = formattedTasks.filter(t => 
            (t.board_stage_name === "A fazer" || t.board_stage_name === "Em aprovação") &&
            !novosTicketsRef.current.has(t.id) &&
            isTicketFromToday(t.created_at)
        );

        console.log('📢 Novos tickets encontrados:', novosTickets.length);

        // Adicionar DOIS alertas por ticket (ordem correta, sem atropelo)
        for (const ticket of novosTickets) {
            novosTicketsRef.current.add(ticket.id);
            
            // 1º ALERTA: NOVO TICKET
            alertaQueue.current.push({
                displayMessage: `📢 NOVO TICKET! #${ticket.id} - ${ticket.client_name}`,
                voiceMessage: `Novo ticket ${ticket.id} do cliente ${ticket.client_name}.`
            });
            
            // 2º ALERTA: PRAZO PARA ASSUMIR
            alertaQueue.current.push({
                displayMessage: `⏰ Ticket #${ticket.id} - Assuma em ${slaConfig.supportTakeoverTime} minutos!`,
                voiceMessage: `Assuma o ticket ${ticket.id} em ${slaConfig.supportTakeoverTime} minutos.`
            });
        }

            setTasks(formattedTasks);
            setLastRefresh(new Date());
            
            // Inicia processamento da fila se houver novos tickets e não estiver processando
            if (novosTickets.length > 0 && !isProcessing.current) {
                setTimeout(() => processNextAlert(), 500);
            }
            
        } catch (error) {
            console.error("❌ Erro na requisição:", error);
            fetchAttempts.current++;
            setApiError(`${error.message || 'Erro ao carregar dados'} (tentativa ${fetchAttempts.current})`);
            
            // Em TV, tentar novamente com backoff exponencial
            if (isTv && fetchAttempts.current < 5) {
                const delay = Math.min(10000 * Math.pow(2, fetchAttempts.current - 1), 60000);
                console.log(`🔄 Tentando novamente em ${delay/1000}s (tentativa ${fetchAttempts.current}/5)`);
                setTimeout(() => fetchData(), delay);
            } else if (fetchAttempts.current >= 5) {
                setApiError(`Erro persistente: ${error.message}. Recarregue a página.`);
            }
        }
    }, [slaConfig, processNextAlert, connectionStatus, isTv]);

    // Inicialização e intervalo
    useEffect(() => {
        fetchData();
        // Aumentar intervalo na TV para não sobrecarregar (60s na TV, 30s no PC)
        const intervalTime = isTv ? 60000 : 30000;
        const interval = setInterval(fetchData, intervalTime);
        console.log(`⏰ Intervalo configurado: ${intervalTime/1000}s`);
        
        return () => clearInterval(interval);
    }, [fetchData, isTv]);

    // Carregar preferência de voz do localStorage
    useEffect(() => {
        const saved = localStorage.getItem('audioPermissionGranted');
        console.log('🔊 Carregando saved do localStorage:', saved);
        if (saved === 'true') {
            setAudioPermissionGranted(true);
            console.log('🔊 audioPermissionGranted setado para true');
        }
    }, []);

    // FILTROS
    const ticketsAbertos = useMemo(() => {
        const diasAtras = new Date();
        diasAtras.setDate(diasAtras.getDate() - slaConfig.openTicketsDays);
        return tasks.filter(t => 
            (t.board_stage_name === "A fazer" || t.board_stage_name === "Em aprovação") &&
            new Date(t.created_at) >= diasAtras
        );
    }, [tasks, slaConfig.openTicketsDays]);

    const ticketsAndamento = useMemo(() => 
        tasks.filter(t => t.board_stage_name === "Fazendo"), [tasks]);

    const ticketsFinalizados = useMemo(() => {
        const diasAtras = new Date();
        diasAtras.setDate(diasAtras.getDate() - slaConfig.finishedDays);
        return tasks.filter(t => {
            const isEntregue = String(t.board_stage_name).toLowerCase() === "entregues" || t.is_closed === true;
            if (!isEntregue) return false;
            if (t.close_date) return new Date(t.close_date) >= diasAtras;
            if (t.updated_at) return new Date(t.updated_at) >= diasAtras;
            return false;
        });
    }, [tasks, slaConfig.finishedDays]);

    // Alertas SLA (tickets atrasados)
    useEffect(() => {
        const ticketsAtrasados = ticketsAbertos.filter(t => 
            t.minutesOpen > slaConfig.supportTakeoverTime && !alertadosRef.current.has(t.id)
        );
        
        for (const ticket of ticketsAtrasados) {
            alertadosRef.current.add(ticket.id);
            alertaQueue.current.push({
                displayMessage: `⚠️ SLA! Ticket #${ticket.id} - ${ticket.client_name} | Estourou ${slaConfig.supportTakeoverTime}min!`,
                voiceMessage: `Atenção! Ticket ${ticket.id} do cliente ${ticket.client_name} estourou o SLA de ${slaConfig.supportTakeoverTime} minutos.`
            });
        }
        
        if (ticketsAtrasados.length > 0 && !isProcessing.current) {
            setTimeout(() => processNextAlert(), 500);
        }
    }, [ticketsAbertos, slaConfig, processNextAlert]);

    // Calcular tempo médio de resolução
    const avgTimeFormatted = useMemo(() => {
        const closedTasks = tasks.filter(t => t.is_closed === true && t.close_date);
        if (closedTasks.length === 0) return '0h';
        
        let totalMinutes = 0;
        for (let i = 0; i < closedTasks.length; i++) {
            const task = closedTasks[i];
            const created = new Date(task.created_at);
            const closed = new Date(task.close_date);
            const diffMinutes = (closed - created) / (1000 * 60);
            totalMinutes += diffMinutes;
        }
        const avgMinutes = totalMinutes / closedTasks.length;
        return formatMinutes(avgMinutes);
    }, [tasks]);

    // Forçar refresh manual (útil para TV)
    const handleManualRefresh = () => {
        console.log('🔄 Refresh manual solicitado');
        fetchData();
    };

    return (
        <main className={style.layout}>
            {/* Indicador de erro da API */}
            {apiError && (
                <div className={style.apiErrorBanner} onClick={handleManualRefresh}>
                    <span>⚠️</span>
                    <span>{apiError}</span>
                    <button className={style.retryButton} onClick={handleManualRefresh}>
                        🔄 Tentar novamente
                    </button>
                </div>
            )}

            {/* Indicador de conexão (apenas na TV) */}
            {isTv && connectionStatus === 'offline' && (
                <div className={style.offlineBanner}>
                    📡 Sem conexão com a internet. Verifique sua rede.
                </div>
            )}

            {/* Indicador de última atualização (útil na TV) */}
            <div className={style.updateInfo}>
                Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
                {isTv && (
                    <button className={style.refreshButton} onClick={handleManualRefresh}>
                        🔄
                    </button>
                )}
            </div>

            {/* Modal de áudio */}
            {/* Modal de áudio - ESSENCIAL para desktop */}
            {!audioPermissionGranted && (
                <div className={style.audioModal}>
                    <div className={style.audioCard}>
                        <div className={style.audioIcon}>🔊</div>
                        <h2 className={style.audioTitle}>Ativar Alertas de Voz</h2>
                        <p className={style.audioText}>
                            Para receber alertas sonoros, clique no botão abaixo.
                            <br /><br />
                            <strong style={{ color: '#facc15' }}>⚠️ Clique aqui para ativar o áudio</strong>
                        </p>
                        <button className={style.audioButton} onClick={ativarAlertas}>
                            🔊 ATIVAR ALERTAS
                        </button>
                        <p className={style.audioNote}>Alertas visuais funcionam mesmo sem voz</p>
                    </div>
                </div>
            )}

            {/* Alerta visual - CENTRALIZADO E SEM TRAVAR */}
            {alerta && (
                <div className={style.overlayAlerta}>
                    <div className={style.boxAlerta}>
                        <button 
                            onClick={() => {
                                if (currentUtterance.current) {
                                    try {
                                        window.speechSynthesis.cancel();
                                    } catch(e) {}
                                }
                                setAlerta(null);
                                isProcessing.current = false;
                                currentUtterance.current = null;
                                // Limpa a fila também
                                alertaQueue.current = [];
                                setTimeout(() => processNextAlert(), 500);
                            }}
                            className={style.closeAlertButton}
                        >
                            ✕
                        </button>
                        <h1 className={style.tituloAlerta}>
                            {alerta.includes('SLA') ? '⚠️ ALERTA DE SLA ⚠️' : '📢 NOVO TICKET!'}
                        </h1>
                        <p className={style.mensagemAlerta}>{alerta}</p>
                        <button 
                            onClick={() => {
                                if (currentUtterance.current) {
                                    try {
                                        window.speechSynthesis.cancel();
                                    } catch(e) {}
                                }
                                setAlerta(null);
                                isProcessing.current = false;
                                currentUtterance.current = null;
                            }}
                            style={{
                                marginTop: '24px',
                                padding: '10px 24px',
                                background: '#38bdf8',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* SEÇÃO PRINCIPAL - TICKETS ABERTOS */}
            <div className={style.mainSection}>
                <Tabela dados={ticketsAbertos} titulo="🎯 TICKETS ABERTOS" variante="aberto" slaConfig={slaConfig} />
            </div>

            {/* SEÇÃO INFERIOR - 2 COLUNAS */}
            <div className={style.bottomSection}>
                <div className={style.columnFull}>
                    <Tabela dados={ticketsAndamento} titulo="⚙️ EM ANDAMENTO" variante="andamento" slaConfig={slaConfig} />
                </div>
                <div className={style.columnFull}>
                    <Tabela dados={ticketsFinalizados} titulo={`✅ FINALIZADOS (${slaConfig.finishedDays} dia)`} variante="finalizado" slaConfig={slaConfig} />
                </div>
            </div>

            {/* BARRA DE MÉTRICAS */}
            <div className={style.metricsBar}>
                <div className={style.metricItem}>
                    <span className={style.metricLabel}>⏱️ Tempo Médio</span>
                    <span className={style.metricValue}>{avgTimeFormatted}</span>
                </div>
                <div className={style.metricItem}>
                    <span className={style.metricLabel}>📋 Tickets Abertos</span>
                    <span className={style.metricValue} data-type="aberto">{ticketsAbertos.length}</span>
                </div>
                <div className={style.metricItem}>
                    <span className={style.metricLabel}>⚙️ Em Andamento</span>
                    <span className={style.metricValue} data-type="andamento">{ticketsAndamento.length}</span>
                </div>
                <div className={style.metricItem}>
                    <span className={style.metricLabel}>✅ Finalizados</span>
                    <span className={style.metricValue} data-type="finalizado">{ticketsFinalizados.length}</span>
                </div>
            </div>
        </main>
    );
}
/*
vercel --prod
*/