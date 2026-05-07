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

// Função para calcular tempo útil (horário comercial)
// Função para calcular tempo útil (horário comercial 8h-18h, Segunda a Sexta)
const calcularMinutosUteis = (dataInicio) => {
    const inicio = new Date(dataInicio);
    const agora = new Date();
    
    if (inicio >= agora) return 0;
    
    let totalMinutos = 0;
    let current = new Date(inicio);
    
    const inicioExpediente = 8;  // 8:00
    const fimExpediente = 18;     // 18:00
    
    // Arredonda para o minuto atual
    current.setSeconds(0, 0);
    const agoraArredondado = new Date(agora);
    agoraArredondado.setSeconds(0, 0);
    
    while (current < agoraArredondado) {
        const diaSemana = current.getDay(); // 0 = Domingo, 6 = Sábado
        const hora = current.getHours();
        
        // Segunda a Sexta (1 a 5)
        if (diaSemana >= 1 && diaSemana <= 5) {
            // Dentro do horário comercial
            if (hora >= inicioExpediente && hora < fimExpediente) {
                totalMinutos++;
            }
        }
        
        // Avança 1 minuto
        current.setMinutes(current.getMinutes() + 1);
    }
    
    return totalMinutos;
};


export default function Main({ slaConfig }) {
    const [tasks, setTasks] = useState([]);
    const [alerta, setAlerta] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
    
    const alertaQueue = useRef([]);
    const isProcessing = useRef(false);
    const currentUtterance = useRef(null);
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

    const processNextAlert = useCallback(() => {
        if (isProcessing.current) {
            return;
        }
        
        if (alertaQueue.current.length === 0) {
            return;
        }
        
        const nextAlert = alertaQueue.current.shift();
        isProcessing.current = true;
        
        setAlerta(nextAlert.displayMessage);
        
        if (slaConfig.voiceEnabled && audioPermissionGranted) {
            if (currentUtterance.current) {
                window.speechSynthesis.cancel();
            }
            
            const utterance = new SpeechSynthesisUtterance(nextAlert.voiceMessage);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9;
            currentUtterance.current = utterance;
            
            utterance.onend = () => {
                setAlerta(null);
                isProcessing.current = false;
                currentUtterance.current = null;
                setTimeout(() => processNextAlert(), 500);
            };
            
            utterance.onerror = () => {
                setAlerta(null);
                isProcessing.current = false;
                currentUtterance.current = null;
                setTimeout(() => processNextAlert(), 500);
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
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
                    const minutesDiff = calcularMinutosUteis(task.created_at);
                    task.minutesOpen = minutesDiff;
                    task.timeOpenFormatted = formatMinutes(minutesDiff);
                    
                        if (task.board_stage_name === "A fazer" || task.board_stage_name === "Em aprovação") {
                        // SLA: 15min para assumir, 45min para resolver (horário comercial)
                        if (minutesDiff <= 15) {
                            task.slaStatus = 'normal';
                            task.slaMessage = `🟢 Normal (${formatSlaTime(minutesDiff)})`;
                        } else if (minutesDiff <= 30) {
                            task.slaStatus = 'warning';
                            task.slaMessage = `🟡 Atenção (${formatSlaTime(minutesDiff)})`;
                        } else if (minutesDiff <= 45) {
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

            const novosTickets = formattedTasks.filter(t => 
                (t.board_stage_name === "A fazer" || t.board_stage_name === "Em aprovação") &&
                !novosTicketsRef.current.has(t.id) &&
                isTicketFromToday(t.created_at)
            );
            
            for (const ticket of novosTickets) {
                novosTicketsRef.current.add(ticket.id);
                alertaQueue.current.push({
                    displayMessage: `📢 NOVO TICKET! #${ticket.id} - ${ticket.client_name} | Assuma em ${slaConfig.supportTakeoverTime}min`,
                    voiceMessage: `Novo ticket ${ticket.id} do cliente ${ticket.client_name}. Assuma em ${slaConfig.supportTakeoverTime} minutos.`
                });
            }

            setTasks(formattedTasks);
            setLastRefresh(new Date());
            
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

    // Alertas SLA
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

    

    // ==================== CÁLCULO DE MÉTRICAS DOS ATENDENTES ====================
    const dadosParaExibir = useMemo(() => {
        const ticketsAndamentoAtendentes = ticketsAndamento.filter(t => t.exibir_usuarios && t.exibir_usuarios !== 'Pendente');
        const ticketsFinalizadosAtendentes = ticketsFinalizados.filter(t => t.exibir_usuarios && t.exibir_usuarios !== 'Pendente');
        
        const atendentesMap = new Map();
        
        ticketsAndamentoAtendentes.forEach(ticket => {
            const atendente = ticket.exibir_usuarios;
            if (!atendentesMap.has(atendente)) {
                atendentesMap.set(atendente, { em_andamento: 0, finalizados: 0, total: 0 });
            }
            atendentesMap.get(atendente).em_andamento++;
            atendentesMap.get(atendente).total++;
        });
        
        ticketsFinalizadosAtendentes.forEach(ticket => {
            const atendente = ticket.exibir_usuarios;
            if (!atendentesMap.has(atendente)) {
                atendentesMap.set(atendente, { em_andamento: 0, finalizados: 0, total: 0 });
            }
            atendentesMap.get(atendente).finalizados++;
            atendentesMap.get(atendente).total++;
        });
        
        return Array.from(atendentesMap.entries())
            .map(([nome, dados]) => ({ nome, ...dados }))
            .sort((a, b) => b.total - a.total);
    }, [ticketsAndamento, ticketsFinalizados]);

    return (
        <main className={`${style.layout} ${style.cyberLayout}`}>
            {/* HERO CYBERPUNK */}
            <section className={style.heroSection}>
                <div className={style.heroCard}>
                    <div className={style.heroContent}>
                        
                        <h1 className={style.heroTitle}>Painel de Suporte SLA</h1>
                        <p className={style.heroSubtitle}>Monitoramento em Tempo Real • Alertas Inteligentes • SLAs Automáticos</p>
                        <div className={style.statsGrid}>
                            <div className={style.statCard}>
                                <span className={style.statValue}>{ticketsAbertos.length}</span>
                                <span className={style.statLabel}>Tickets Críticos</span>
                            </div>
                            <div className={style.statCard}>
                                <span className={style.statValue}>{ticketsAndamento.length}</span>
                                <span className={style.statLabel}>Em Andamento</span>
                            </div>
                            <div className={style.statCard}>
                                <span className={style.statValue}>{ticketsFinalizados.length}</span>
                                <span className={style.statLabel}>Finalizados Hoje</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal de áudio FUTURISTA */}
            {!audioPermissionGranted && (
                <div className={style.audioModal}>
                    <div className={style.audioCard}>
                        <div className={style.audioIcon}>🔊</div>
                        <h2 className={style.audioTitle}>Ativar Sistema de Voz</h2>
                        <p className={style.audioText}>
                            Ative os alertas por voz para notificações em tempo real
                        </p>
                        <button className={style.audioButton} onClick={ativarAlertas}>
                            ⚡ ATIVAR VOZ IA
                        </button>
                        <p className={style.audioNote}>Alertas visuais sempre funcionam</p>
                    </div>
                </div>
            )}

            {/* Alerta visual NEON */}
            {alerta && (
                <div className={style.overlayAlerta}>
                    <div className={style.boxAlerta}>
                        <button 
                            onClick={() => {
                                if (currentUtterance.current) {
                                    window.speechSynthesis.cancel();
                                }
                                setAlerta(null);
                                isProcessing.current = false;
                                currentUtterance.current = null;
                                setTimeout(() => processNextAlert(), 500);
                            }}
                            className={style.closeAlertBtn}
                        >
                            ✕
                        </button>
                        <h1 className={style.tituloAlerta}>
                            {alerta.includes('SLA') ? '🚨 ALERTA SLA CRÍTICO' : '🆕 NOVO TICKET'}
                        </h1>
                        <p className={style.mensagemAlerta}>{alerta}</p>
                    </div>
                </div>
            )}

            {/* CARDS ATENDENTES CYBERPUNK */}
            {dadosParaExibir.length > 0 && (
                <section className={style.teamSection}>
                    <div className={style.sectionHeader}>
                        <h3 className={style.sectionTitle}>👥 Time Ativo</h3>
                        <span className={style.sectionBadge}>Real-time</span>
                    </div>
                    <div className={style.atendentesCards}>
                        {dadosParaExibir.map((atendente) => (
                            <div key={atendente.nome} className={style.atendenteCard}>
                                <div className={style.atendenteAvatar}>
                                    {atendente.nome.charAt(0).toUpperCase()}
                                </div>
                                <div className={style.atendenteInfo}>
                                    <div className={style.atendenteNome}>{atendente.nome}</div>
                                    <div className={style.atendenteStats}>
                                        <span className={`${style.statBadge} ${style.andamento}`}>
                                            ⚙️ {atendente.em_andamento}
                                        </span>
                                        <span className={`${style.statBadge} ${style.finalizado}`}>
                                            ✅ {atendente.finalizados}
                                        </span>
                                        <span className={`${style.statBadge} ${style.total}`}>
                                            📊 {atendente.total}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

                {/* SEÇÃO PRINCIPAL - TICKETS ABERTOS */}
                <section className={style.mainSection}>
                    <div className={style.highlightHeader}>
                        <div className={style.highlightIcon}>🎯</div>
                        <div>
                            <div className={style.highlightTitle}>TICKETS EM SLA</div>
                            <div className={style.highlightSub}>Prioridade máxima - Assuma agora!</div>
                        </div>
                        <div className={style.highlightBadge}>{ticketsAbertos.length} ativos</div>
                    </div>
                    <div className={style.tableContainer}>
                        <Tabela dados={ticketsAbertos} titulo="" variante="aberto" slaConfig={slaConfig} />
                    </div>
                </section>

            {/* INFO DE ATUALIZAÇÃO NEON */}
            <div className={style.footerInfo}>
                🕐 Última sincronização: <span className={style.refreshTime}>{lastRefresh.toLocaleTimeString('pt-BR')}</span>
            </div>
        </main>
    );
}
/*
vercel --prod
*/