// src/TvApp.js
import { useState, useEffect } from 'react';

// ============================================
// FUNÇÃO DE CÁLCULO DE HORÁRIO COMERCIAL
// Conta apenas minutos entre 8h-18h, Segunda a Sexta
// ============================================
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

// Função para formatar minutos em horas/minutos
const formatarTempo = (minutes) => {
    if (!minutes && minutes !== 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        if (mins > 0) return `${hours}h ${mins}m`;
        return `${hours}h`;
    }
    return `${mins}m`;
};

function TvApp() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/runrun?t=${new Date().getTime()}`);
      if (!response.ok) return;
      const data = await response.json();
      const rawTasks = Array.isArray(data) ? data : [data];
      
      const formattedTasks = rawTasks.map(task => {
        if (task.assignments && task.assignments.length > 0) {
          task.exibir_usuarios = task.assignments.map(a => a.assignee_name?.split(' ')[0] || 'N/A').join(' / ');
        } else {
          task.exibir_usuarios = task.user_name ? task.user_name.split(' ')[0] : 'Pendente';
        }
        
        // ============================================
        // CÁLCULO DE TEMPO COM HORÁRIO COMERCIAL
        // ============================================
        if (task.created_at) {
          const minutesDiff = calcularMinutosUteis(task.created_at);
          task.minutesOpen = minutesDiff;
          task.timeOpenFormatted = formatarTempo(minutesDiff);
          
          // Definir status do SLA baseado no tempo comercial
          if (minutesDiff <= 15) {
            task.slaStatus = 'normal';
            task.slaMessage = `🟢 Normal`;
          } else if (minutesDiff <= 30) {
            task.slaStatus = 'warning';
            task.slaMessage = `🟡 Atenção`;
          } else if (minutesDiff <= 45) {
            task.slaStatus = 'critical';
            task.slaMessage = `🔴 URGENTE`;
          } else {
            task.slaStatus = 'critical';
            task.slaMessage = `🔴 ATRASADO`;
          }
        }
        return task;
      });
      
      setTasks(formattedTasks);
      setLastRefresh(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Erro:", error);
      setLoading(false);
    }
  };

  const ticketsAbertos = tasks.filter(t => 
    (t.board_stage_name === "A fazer" || t.board_stage_name === "Em aprovação")
  );

  const ticketsAndamento = tasks.filter(t => t.board_stage_name === "Fazendo");
  
  const ticketsFinalizados = tasks.filter(t => 
    String(t.board_stage_name).toLowerCase() === "entregues" || t.is_closed === true
  );

  // Calcular métricas dos atendentes
  const atendentesMap = new Map();
  
  ticketsAndamento.forEach(ticket => {
    const nome = ticket.exibir_usuarios;
    if (nome && nome !== 'Pendente') {
      if (!atendentesMap.has(nome)) {
        atendentesMap.set(nome, { em_andamento: 0, finalizados: 0 });
      }
      atendentesMap.get(nome).em_andamento++;
    }
  });
  
  ticketsFinalizados.forEach(ticket => {
    const nome = ticket.exibir_usuarios;
    if (nome && nome !== 'Pendente') {
      if (!atendentesMap.has(nome)) {
        atendentesMap.set(nome, { em_andamento: 0, finalizados: 0 });
      }
      atendentesMap.get(nome).finalizados++;
    }
  });
  
  const atendentes = Array.from(atendentesMap.entries()).map(([nome, dados]) => ({ nome, ...dados }));

  if (loading) {
    return (
      <div style={styles.loading}>
        <h1>Carregando Painel...</h1>
        <p>Aguardando dados do servidor</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>WMSEXPERT</h1>
        <p style={styles.subtitle}>Painel de Suporte • Horário Comercial 8h-18h</p>
        <div style={styles.stats}>
          <div style={styles.stat}><span style={styles.statValue}>{ticketsAbertos.length}</span><span>Tickets em SLA</span></div>
          <div style={styles.stat}><span style={styles.statValue}>{ticketsAndamento.length}</span><span>Em andamento</span></div>
          <div style={styles.stat}><span style={styles.statValue}>{ticketsFinalizados.length}</span><span>Finalizados</span></div>
        </div>
      </div>

      {/* Time Ativo - Discreto */}
      {atendentes.length > 0 && (
        <div style={styles.teamSection}>
          <div style={styles.teamHeader}>
            <span>👥 TIME ATIVO</span>
            <span style={styles.teamBadge}>{atendentes.length} online</span>
          </div>
          <div style={styles.teamList}>
            {atendentes.map(a => (
              <div key={a.nome} style={styles.teamCard}>
                <div style={styles.teamAvatar}>{a.nome.charAt(0)}</div>
                <div style={styles.teamInfo}>
                  <div>{a.nome}</div>
                  <div style={styles.teamStats}>
                    <span style={styles.badgeBlue}>⚙️ {a.em_andamento}</span>
                    <span style={styles.badgeGreen}>✅ {a.finalizados}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tickets em SLA - PROTAGONISTA */}
      <div style={styles.slaSection}>
        <div style={styles.slaHeader}>
          <span style={styles.slaIcon}>🎯</span>
          <div>
            <h2 style={styles.slaTitle}>TICKETS EM SLA</h2>
            <p style={styles.slaSub}>Prioridade máxima - Assuma em até 15min!</p>
          </div>
          <div style={styles.slaBadge}>{ticketsAbertos.length} ativos</div>
        </div>

        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <div style={styles.gridHeader}>
              <span>ID</span>
              <span>Cliente</span>
              <span>Tempo Aberto</span>
              <span>Status SLA</span>
              <span>Responsável</span>
            </div>
          </div>
          <div style={styles.tableBody}>
            {ticketsAbertos.length === 0 ? (
              <div style={styles.emptyState}>Nenhum ticket em SLA no momento</div>
            ) : (
              ticketsAbertos.map(task => (
                <div key={task.id} style={styles.tableRow}>
                  <div style={styles.rowId}>#{task.id}</div>
                  <div style={styles.rowCliente}>{task.client_name || 'N/A'}</div>
                  <div style={styles.rowTempo}>{task.timeOpenFormatted || '0m'}</div>
                  <div>
                    <span style={task.slaStatus === 'critical' ? styles.statusCritical : (task.slaStatus === 'warning' ? styles.statusWarning : styles.statusNormal)}>
                      {task.slaMessage}
                    </span>
                  </div>
                  <div style={styles.rowResp}>{task.exibir_usuarios || 'Pendente'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        🕐 Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')} | ⏰ Contabiliza apenas horário comercial (8h-18h, Seg-Sex)
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#0f172a',
    minHeight: '100vh',
    padding: '16px',
    fontFamily: 'Arial, sans-serif',
    color: '#e2e8f0'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0f172a',
    color: '#e2e8f0'
  },
  header: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  title: {
    fontSize: '24px',
    color: '#60a5fa',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '16px'
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px'
  },
  stat: {
    textAlign: 'center'
  },
  statValue: {
    display: 'block',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#60a5fa'
  },
  teamSection: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px'
  },
  teamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #334155',
    fontSize: '12px',
    color: '#94a3b8'
  },
  teamBadge: {
    background: '#334155',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '10px'
  },
  teamList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  teamCard: {
    background: '#0f172a',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '140px'
  },
  teamAvatar: {
    width: '32px',
    height: '32px',
    background: '#3b82f6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  teamInfo: {
    flex: 1
  },
  teamStats: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px'
  },
  badgeBlue: {
    background: '#1e3a5f',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
    color: '#60a5fa'
  },
  badgeGreen: {
    background: '#14532d',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
    color: '#4ade80'
  },
  slaSection: {
    background: '#1e293b',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '20px'
  },
  slaHeader: {
    background: '#0f172a',
    padding: '16px 20px',
    borderBottom: '2px solid #ef4444',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  slaIcon: {
    fontSize: '28px'
  },
  slaTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    color: 'white'
  },
  slaSub: {
    fontSize: '10px',
    color: '#94a3b8',
    margin: '4px 0 0 0'
  },
  slaBadge: {
    background: '#dc2626',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '16px',
    fontWeight: 'bold',
    marginLeft: 'auto'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  tableHeader: {
    background: '#0f172a',
    borderBottom: '1px solid #334155'
  },
  gridHeader: {
    display: 'grid',
    gridTemplateColumns: '60px 2fr 90px 1.2fr 1.3fr',
    gap: '8px',
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#94a3b8'
  },
  tableBody: {
    maxHeight: '500px',
    overflowY: 'auto'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '60px 2fr 90px 1.2fr 1.3fr',
    gap: '8px',
    padding: '10px 16px',
    borderBottom: '1px solid #1e293b',
    fontSize: '13px',
    alignItems: 'center'
  },
  rowId: {
    fontWeight: 'bold',
    color: '#60a5fa',
    fontFamily: 'monospace'
  },
  rowCliente: {
    fontWeight: '500'
  },
  rowTempo: {
    fontFamily: 'monospace'
  },
  rowResp: {
    color: '#94a3b8'
  },
  statusCritical: {
    background: '#dc2626',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  statusWarning: {
    background: '#d97706',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  statusNormal: {
    background: '#16a34a',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b'
  },
  footer: {
    textAlign: 'center',
    padding: '12px',
    fontSize: '10px',
    color: '#475569'
  }
};

export default TvApp;