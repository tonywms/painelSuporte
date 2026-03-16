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
                        <div className={style.fontBodyTable}>#{task.id}</div>
                        <div className={style.fontBodyTable}>{task.client_name || 'N/A'}</div>
                        <div className={style.fontBodyTable}>{task.desired_start_date || '--'}</div>
                        <div className={style.fontBodyTable}>{task.desired_due_date || '--'}</div>
                        <div className={style.fontBodyTable}>
                            <span className={task.is_working ? style.statusBadge : ''}>
                                {task.is_working ? 'Fazendo' : 'A Fazer'}
                            </span>
                        </div>
                        <div className={style.fontBodyTable}>{task.responsible_name || 'Pendente'}</div>
                    </div>
                )) : <div style={{color: '#fff', textAlign: 'center', padding: '20px'}}>Nenhum ticket aberto</div>}
            </section>
        </div>
    );
}