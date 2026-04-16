import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Tabela from './Tabela/index';
import style from './layout.module.css';

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
    
    const alertaQueue = useRef([]); // Fila de alertas pendentes
    const isProcessing = useRef(false); // Controla se está processando um alerta
    const currentUtterance = useRef(null); // Referência para a fala atual
    const alertadosRef = useRef(new Set());
    const novosTicketsRef = useRef(new Set());

    const ativarAlertas = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const testUtterance = new SpeechSynthesisUtterance('Alertas de voz ativados');
            testUtterance.lang = 'pt-BR';
            testUtterance.rate = 0.9;
            window.speechSynthesis.speak(testUtterance);
        }
        setAudioPermissionGranted(true);
        localStorage.setItem('audioPermissionGranted', 'true');
    };

    // Processa a fila de alertas - UM POR VEZ
    const processNextAlert = useCallback(() => {
        // Se já está processando um alerta, não faz nada
        if (isProcessing.current) {
            console.log('⚠️ Já processando um alerta, aguardando...');
            return;
        }
        
        // Se não tem alerta na fila, não faz nada
        if (alertaQueue.current.length === 0) {
            console.log('📭 Fila de alertas vazia');
            return;
        }
        
        // Pega o próximo alerta da fila
        const nextAlert = alertaQueue.current.shift();
        isProcessing.current = true;
        
        console.log('🔔 Processando alerta:', nextAlert.displayMessage);
        
        // Mostra o alerta visual
        setAlerta(nextAlert.displayMessage);
        
        // Se voz estiver ativada, reproduz
        if (slaConfig.voiceEnabled && audioPermissionGranted) {
            // Cancela qualquer fala anterior
            if (currentUtterance.current) {
                window.speechSynthesis.cancel();
            }
            
            const utterance = new SpeechSynthesisUtterance(nextAlert.voiceMessage);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            currentUtterance.current = utterance;
            
            utterance.onend = () => {
                console.log('✅ Fala finalizada, removendo alerta visual');
                // Remove o alerta visual
                setAlerta(null);
                // Libera para o próximo alerta
                isProcessing.current = false;
                currentUtterance.current = null;
                // Processa o próximo alerta na fila (se houver)
                setTimeout(() => processNextAlert(), 500);
            };
            
            utterance.onerror = (e) => {
                console.error('❌ Erro na voz:', e);
                // Em caso de erro, remove o alerta e continua
                setAlerta(null);
                isProcessing.current = false;
                currentUtterance.current = null;
                setTimeout(() => processNextAlert(), 500);
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            // Sem voz, mantém o alerta visual por 5 segundos
            setTimeout(() => {
                setAlerta(null);
                isProcessing.current = false;
                setTimeout(() => processNextAlert(), 500);
            }, 5000);
        }
    }, [slaConfig.voiceEnabled, audioPermissionGranted]);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(`/api/runrun?t=${new Date().getTime()}`);
            if (!response.ok) return;

            const data = await response.json();
            const rawTasks = Array.isArray(data) ? data : [data];

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
            const novosTickets = formattedTasks.filter(t => 
                (t.board_stage_name === "A fazer" || t.board_stage_name === "Em aprovação") &&
                !novosTicketsRef.current.has(t.id) &&
                isTicketFromToday(t.created_at)
            );
            
            console.log('📢 Novos tickets de HOJE encontrados:', novosTickets.length);
            
            // Adicionar novos tickets à fila (UM POR UM)
            for (const ticket of novosTickets) {
                novosTicketsRef.current.add(ticket.id);
                alertaQueue.current.push({
                    displayMessage: `📢 NOVO TICKET! #${ticket.id} - ${ticket.client_name} | Assuma em ${slaConfig.supportTakeoverTime}min`,
                    voiceMessage: `Novo ticket ${ticket.id} do cliente ${ticket.client_name}. Assuma em ${slaConfig.supportTakeoverTime} minutos.`
                });
            }

            setTasks(formattedTasks);
            setLastRefresh(new Date());
            
            // Inicia processamento da fila se houver novos tickets e não estiver processando
            if (novosTickets.length > 0 && !isProcessing.current) {
                setTimeout(() => processNextAlert(), 500);
            }
        } catch (error) {
            console.error("Erro:", error);
        }
    }, [slaConfig, processNextAlert]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        const saved = localStorage.getItem('audioPermissionGranted');
        if (saved === 'true') setAudioPermissionGranted(true);
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

    return (
        <main className={style.layout}>
            {/* Modal de áudio */}
            {!audioPermissionGranted && (
                <div className={style.audioModal}>
                    <div className={style.audioCard}>
                        <div className={style.audioIcon}>🔊</div>
                        <h2 className={style.audioTitle}>Ativar Alertas de Voz</h2>
                        <p className={style.audioText}>
                            Para receber alertas sonoros, clique no botão abaixo.
                            <br /><br />
                            <strong style={{ color: '#facc15' }}>⚠️ Use o OK do controle</strong>
                        </p>
                        <button className={style.audioButton} onClick={ativarAlertas}>
                            🔊 ATIVAR ALERTAS
                        </button>
                        <p className={style.audioNote}>Alertas visuais funcionam mesmo sem voz</p>
                    </div>
                </div>
            )}

            {/* Alerta visual - FICA NA TELA ENQUANTO A VOZ FALA */}
            {alerta && (
                <div className={style.overlayAlerta}>
                    <div className={style.boxAlerta}>
                        <button 
                            onClick={() => {
                                // Botão para fechar manualmente (útil na TV)
                                if (currentUtterance.current) {
                                    window.speechSynthesis.cancel();
                                }
                                setAlerta(null);
                                isProcessing.current = false;
                                currentUtterance.current = null;
                                setTimeout(() => processNextAlert(), 500);
                            }}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'rgba(0,0,0,0.6)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                fontSize: '18px',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✕
                        </button>
                        <h1 className={style.tituloAlerta}>
                            {alerta.includes('SLA') ? '⚠️ ALERTA DE SLA ⚠️' : '📢 NOVO TICKET!'}
                        </h1>
                        <p className={style.mensagemAlerta}>{alerta}</p>
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
                <div className={style.metricItem}>
                    <span className={style.metricLabel}>🕐 Atualização</span>
                    <span className={style.metricValue} style={{ fontSize: '16px' }}>{lastRefresh.toLocaleTimeString('pt-BR')}</span>
                </div>
            </div>
        </main>
    );
}
/*
vercel --prod
*/