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
    
    const alertaQueue = useRef([]);
    const isSpeaking = useRef(false);
    const alertadosRef = useRef(new Set());
    const novosTicketsRef = useRef(new Set());

    const ativarAlertas = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const testUtterance = new SpeechSynthesisUtterance('Alertas de voz ativados');
            testUtterance.lang = 'pt-BR';
            testUtterance.rate = 0.9;
            window.speechSynthesis.speak(testUtterance);
        }
        setAudioPermissionGranted(true);
        localStorage.setItem('audioPermissionGranted', 'true');
    }, []);

    const processAlertQueue = useCallback(() => {
        if (alertaQueue.current.length === 0 || isSpeaking.current) return;
        
        const nextAlert = alertaQueue.current.shift();
        isSpeaking.current = true;
        
        setAlerta(nextAlert.displayMessage);
        
        if (slaConfig.voiceEnabled && audioPermissionGranted) {
            const utterance = new SpeechSynthesisUtterance(nextAlert.voiceMessage);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            utterance.onend = () => {
                isSpeaking.current = false;
                setAlerta(null);
                setTimeout(() => processAlertQueue(), 500);
            };
            utterance.onerror = () => {
                isSpeaking.current = false;
                setAlerta(null);
                setTimeout(() => processAlertQueue(), 500);
            };
            window.speechSynthesis.speak(utterance);
        } else {
            setTimeout(() => {
                setAlerta(null);
                isSpeaking.current = false;
                setTimeout(() => processAlertQueue(), 500);
            }, 3500);
        }
    }, [slaConfig, audioPermissionGranted]);

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
                            task.slaMessage = `⚠️ Atenção (${formatSlaTime(minutesDiff)})`;
                        } else if (minutesDiff <= slaConfig.supportResolutionTime) {
                            task.slaStatus = 'critical';
                            task.slaMessage = `🔴 URGENTE (${formatSlaTime(minutesDiff)})`;
                        } else if (minutesDiff <= slaConfig.escalationTime) {
                            task.slaStatus = 'dev';
                            task.slaMessage = `🔄 Escalonar (${formatSlaTime(minutesDiff)})`;
                        } else {
                            task.slaStatus = 'devCritical';
                            task.slaMessage = `💻 DEV URGENTE (${formatSlaTime(minutesDiff)})`;
                        }
                    }
                }
                return task;
            });

            const novosTickets = formattedTasks.filter(t => 
                (t.board_stage_name === "A fazer" || t.board_stage_name === "Em aprovação") &&
                !novosTicketsRef.current.has(t.id) &&
                isTicketFromToday(t.created_at)
            );
            
            novosTickets.forEach(ticket => {
                novosTicketsRef.current.add(ticket.id);
                alertaQueue.current.push({
                    displayMessage: `📢 NOVO TICKET! #${ticket.id} - ${ticket.client_name} | Assuma em ${slaConfig.supportTakeoverTime}min`,
                    voiceMessage: `Novo ticket ${ticket.id} do cliente ${ticket.client_name}. Assuma em ${slaConfig.supportTakeoverTime} minutos.`
                });
            });

            setTasks(formattedTasks);
            setLastRefresh(new Date());
            
            if (novosTickets.length > 0 && alertaQueue.current.length > 0 && !isSpeaking.current && audioPermissionGranted) {
                processAlertQueue();
            }
        } catch (error) {
            console.error("Erro:", error);
        }
    }, [slaConfig, audioPermissionGranted, processAlertQueue]);

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

    // Alertas SLA
    useEffect(() => {
        const ticketsAtrasados = ticketsAbertos.filter(t => 
            t.minutesOpen > slaConfig.supportTakeoverTime && !alertadosRef.current.has(t.id)
        );
        ticketsAtrasados.forEach(ticket => {
            alertadosRef.current.add(ticket.id);
            alertaQueue.current.push({
                displayMessage: `⚠️ SLA! Ticket #${ticket.id} - ${ticket.client_name} | Estourou ${slaConfig.supportTakeoverTime}min!`,
                voiceMessage: `Atenção! Ticket ${ticket.id} do cliente ${ticket.client_name} estourou o SLA de ${slaConfig.supportTakeoverTime} minutos.`
            });
        });
        if (alertaQueue.current.length > 0 && !isSpeaking.current && audioPermissionGranted) {
            processAlertQueue();
        }
    }, [ticketsAbertos, slaConfig, audioPermissionGranted, processAlertQueue]);

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

            {/* Alerta visual */}
            {alerta && (
                <div className={style.overlayAlerta}>
                    <div className={style.boxAlerta}>
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