import style from './style.module.css';

export default function Tabela({ dados }) {
    // Função simples para formatar a data ISO para o padrão brasileiro
    const formatarData = (dataIso) => {
        if (!dataIso) return '--';
        return new Date(dataIso).toLocaleDateString('pt-BR');
    };

    return (
        <div className={style.ContainerTable}>
            <section className={style.containerHeader}>
                <div className={style.headerTitle}>
                    Tickets Abertos <span className={style.badge}>{dados.length}</span>
                </div>
            </section>

            <div className={style.labelsGrid}>
                <span>Tarefa</span>
                <span>Cliente</span>
                <span>Início</span>
                <span>Entrega</span>
                <span>Status</span>
                <span>Usuário</span>
            </div>

            <section className={style.tableBody}>
                {dados.length > 0 ? dados.map(task => (
                    <div key={task.id} className={style.elementTable}>
                        {/* Tarefa: usa o campo 'id' */}
                        <div className={style.fontBodyTable}>#{task.id}</div>
                        
                        {/* Cliente: usa o campo 'client_name' */}
                        <div className={style.fontBodyTable}>{task.client_name || 'N/A'}</div>
                        
                        {/* Início: usa o campo 'created_at' */}
                        <div className={style.fontBodyTable}>{formatarData(task.created_at)}</div>
                        
                        {/* Entrega: usa o campo 'estimated_at' */}
                        <div className={style.fontBodyTable}>{formatarData(task.estimated_at)}</div>
                        
                        {/* Status: usa o campo 'board_stage_name' */}
                        <div className={style.fontBodyTable}>
                            <span className={task.on_going ? style.statusBadge : ''}>
                                {task.board_stage_name || (task.on_going ? 'Em Andamento' : 'A Fazer')}
                            </span>
                        </div>
                        
                        {/* Usuário: usa o campo 'user_name' */}
                        <div className={style.fontBodyTable}>{task.user_name || 'Pendente'}</div>
                    </div>
                )) : (
                    <div style={{color: '#fff', textAlign: 'center', padding: '20px'}}>
                        Nenhum ticket aberto
                    </div>
                )}
            </section>
        </div>
    );
}