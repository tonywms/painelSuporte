// src/DebugConsole.js
import { useState, useEffect } from 'react';

function DebugConsole() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/runrun?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const rawTasks = Array.isArray(data) ? data : [data];
      
      // Processa os dados
      const processedTasks = rawTasks.map(task => ({
        id: task.id,
        title: task.title,
        client_name: task.client_name,
        board_stage_name: task.board_stage_name,
        is_closed: task.is_closed,
        created_at: task.created_at,
        close_date: task.close_date,
        user_name: task.user_name,
        assignments: task.assignments,
        estimated_at: task.estimated_at
      }));
      
      setTasks(processedTasks);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Estatísticas
  const ticketsAbertos = tasks.filter(t => 
    t.board_stage_name === "A fazer" || t.board_stage_name === "Em aprovação"
  );
  
  const ticketsAndamento = tasks.filter(t => t.board_stage_name === "Fazendo");
  
  const ticketsFinalizadosHoje = tasks.filter(t => {
    const isEntregue = String(t.board_stage_name).toLowerCase() === "entregues" || t.is_closed === true;
    if (!isEntregue) return false;
    
    const closeDate = t.close_date ? new Date(t.close_date) : null;
    const today = new Date();
    if (closeDate) {
      return closeDate.getDate() === today.getDate() &&
             closeDate.getMonth() === today.getMonth() &&
             closeDate.getFullYear() === today.getFullYear();
    }
    return false;
  });

  const ticketsFinalizadosTotal = tasks.filter(t => 
    String(t.board_stage_name).toLowerCase() === "entregues" || t.is_closed === true
  );

  // Categorias para debug
  const categorias = {};
  tasks.forEach(task => {
    const stage = task.board_stage_name || "Sem categoria";
    categorias[stage] = (categorias[stage] || 0) + 1;
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔍 Console de Debug - RunRun.it</h1>
      
      {/* Botão de atualização */}
      <div style={styles.header}>
        <button onClick={fetchData} style={styles.refreshBtn}>
          🔄 Atualizar Agora
        </button>
        {lastRefresh && (
          <span style={styles.lastRefresh}>
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </span>
        )}
      </div>

      {/* ERRO se houver */}
      {error && (
        <div style={styles.errorBox}>
          <strong>❌ Erro:</strong> {error}
          <br />
          <small>Verifique se o servidor está rodando e as credenciais estão corretas.</small>
        </div>
      )}

      {/* LOADING */}
      {loading && tasks.length === 0 && (
        <div style={styles.loading}>Carregando dados...</div>
      )}

      {/* ESTATÍSTICAS PRINCIPAIS */}
      {!loading && (
        <>
          {/* Cards de Estatísticas */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{ticketsAbertos.length}</div>
              <div style={styles.statLabel}>Tickets em SLA (A fazer/Em aprovação)</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{ticketsAndamento.length}</div>
              <div style={styles.statLabel}>Em Andamento (Fazendo)</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{ticketsFinalizadosHoje.length}</div>
              <div style={styles.statLabel}>Finalizados Hoje</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{ticketsFinalizadosTotal.length}</div>
              <div style={styles.statLabel}>Total Finalizados</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{tasks.length}</div>
              <div style={styles.statLabel}>Total de Tickets</div>
            </div>
          </div>

          {/* CATEGORIAS (Board Stages) */}
          <div style={styles.section}>
            <h2>📋 Distribuição por Status (Board Stage)</h2>
            <div style={styles.categoryGrid}>
              {Object.entries(categorias).map(([nome, qtd]) => (
                <div key={nome} style={styles.categoryItem}>
                  <span style={styles.categoryName}>{nome}</span>
                  <span style={styles.categoryCount}>{qtd}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TICKETS EM SLA (Abertos) */}
          <div style={styles.section}>
            <h2>⚠️ Tickets em SLA (A fazer / Em aprovação) - {ticketsAbertos.length}</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Título</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th>Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsAbertos.length === 0 ? (
                    <tr><td colSpan="6" style={styles.emptyRow}>Nenhum ticket em SLA</td></tr>
                  ) : (
                    ticketsAbertos.map(task => (
                      <tr key={task.id}>
                        <td style={styles.idCell}>#{task.id}</td>
                        <td>{task.client_name || 'N/A'}</td>
                        <td style={styles.titleCell}>{task.title?.substring(0, 50) || 'N/A'}</td>
                        <td><span style={styles.badgeWarning}>{task.board_stage_name}</span></td>
                        <td>{task.created_at ? new Date(task.created_at).toLocaleString('pt-BR') : 'N/A'}</td>
                        <td>{task.user_name || 'Pendente'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TICKETS EM ANDAMENTO */}
          <div style={styles.section}>
            <h2>⚙️ Em Andamento (Fazendo) - {ticketsAndamento.length}</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Título</th>
                    <th>Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsAndamento.length === 0 ? (
                    <tr><td colSpan="4" style={styles.emptyRow}>Nenhum ticket em andamento</td></tr>
                  ) : (
                    ticketsAndamento.map(task => (
                      <tr key={task.id}>
                        <td style={styles.idCell}>#{task.id}</td>
                        <td>{task.client_name || 'N/A'}</td>
                        <td style={styles.titleCell}>{task.title?.substring(0, 50) || 'N/A'}</td>
                        <td>{task.user_name || 'Pendente'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINALIZADOS HOJE */}
          <div style={styles.section}>
            <h2>✅ Finalizados Hoje - {ticketsFinalizadosHoje.length}</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Título</th>
                    <th>Finalizado em</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsFinalizadosHoje.length === 0 ? (
                    <tr><td colSpan="4" style={styles.emptyRow}>Nenhum ticket finalizado hoje</td></tr>
                  ) : (
                    ticketsFinalizadosHoje.map(task => (
                      <tr key={task.id}>
                        <td style={styles.idCell}>#{task.id}</td>
                        <td>{task.client_name || 'N/A'}</td>
                        <td style={styles.titleCell}>{task.title?.substring(0, 50) || 'N/A'}</td>
                        <td>{task.close_date ? new Date(task.close_date).toLocaleString('pt-BR') : 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'monospace',
    background: '#0f172a',
    minHeight: '100vh',
    color: '#e2e8f0'
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#60a5fa'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  refreshBtn: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  lastRefresh: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  errorBox: {
    background: '#7f1d1d',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ef4444'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '30px'
  },
  statCard: {
    background: '#1e293b',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#60a5fa'
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '8px'
  },
  section: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginTop: '15px'
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#0f172a',
    borderRadius: '8px'
  },
  categoryName: {
    fontSize: '13px',
    color: '#cbd5e1'
  },
  categoryCount: {
    fontWeight: 'bold',
    color: '#60a5fa'
  },
  tableContainer: {
    overflowX: 'auto',
    marginTop: '15px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  idCell: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  titleCell: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  badgeWarning: {
    background: '#dc2626',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  emptyRow: {
    textAlign: 'center',
    padding: '20px',
    color: '#64748b'
  }
};

export default DebugConsole;