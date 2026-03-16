import style from './style.module.css';

export default function Tabela({ dados }) {
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
                        {/* "id" = numero da tarefa */}
                        <div className={style.fontBodyTable}>#{task.id}</div>
                        
                        {/* "client_name" */}
                        <div className={style.fontBodyTable}>{task.client_name || 'N/A'}</div>
                        
                        {/* "created_at" (Formatado para PT-BR) */}
                        <div className={style.fontBodyTable}>
                            {new Date(task.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        
                        {/* "estimated_at" */}
                        <div className={style.fontBodyTable}>
                            {task.estimated_at ? new Date(task.estimated_at).toLocaleDateString('pt-BR') : '--'}
                        </div>
                        
                        {/* "board_stage_name" */}
                        <div className={style.fontBodyTable}>
                            <span className={task.on_going ? style.statusBadge : ''}>
                                {task.board_stage_name}
                            </span>
                        </div>
                        
                        {/* "user_name" */}
                        <div className={style.fontBodyTable}>{task.user_name || 'Pendente'}</div>
                    </div>
                )) : <div style={{color: '#fff', textAlign: 'center', padding: '20px'}}>Nenhum ticket aberto</div>}
            </section>
        </div>
    );
}