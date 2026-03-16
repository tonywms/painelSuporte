import style from './style.module.css';

export default function Tabela({ dados, titulo, variante }) {
    const eColunaPrincipal = titulo === "Tickets Abertos";

    // Definimos os gradientes diretamente para evitar falhas de mapeamento de classe
    const getGradient = () => {
        if (variante === 'aberto') return 'linear-gradient(90deg, #188ABD, #0ea5e9)';
        if (variante === 'andamento') return 'linear-gradient(90deg, #6366f1, #a855f7)';
        if (variante === 'finalizado') return 'linear-gradient(90deg, #0f766e, #10b981)';
        return 'linear-gradient(90deg, #188ABD, #0ea5e9)'; // Default
    };

    const gridLayout = {
        display: 'grid',
        gridTemplateColumns: eColunaPrincipal 
            ? '70px minmax(150px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr)' 
            : '70px minmax(150px, 1.5fr) minmax(120px, 1fr)',
        gap: '10px'
    };

    return (
        <div className={style.ContainerTable}>
            {/* Aplicamos o background inline para garantir a mudança de cor */}
            <section 
                className={style.containerHeader} 
                style={{ background: getGradient() }}
            >
                <div className={style.headerTitle}>
                    {titulo} <span className={style.badge}>{dados?.length || 0}</span>
                </div>
            </section>

            <div className={style.labelsGrid} style={gridLayout}>
                <span>Tarefa</span>
                <span>Cliente</span>
                {eColunaPrincipal && (
                    <>
                        <span>Início</span>
                        <span>Entrega</span>
                        <span>Status</span>
                    </>
                )}
                <span>Usuário</span>
            </div>

            <section className={style.tableBody}>
                {dados && dados.length > 0 ? dados.map(task => (
                    <div key={task.id} className={style.elementTable} style={gridLayout}>
                        <div className={style.fontBodyTable}>#{task.id}</div>
                        <div className={style.fontBodyTable}>{task.client_name || 'N/A'}</div>
                        
                        {eColunaPrincipal && (
                            <>
                                <div className={style.fontBodyTable}>
                                    {new Date(task.created_at).toLocaleDateString('pt-BR')}
                                </div>
                                <div className={style.fontBodyTable}>
                                    {task.estimated_at ? new Date(task.estimated_at).toLocaleDateString('pt-BR') : '--'}
                                </div>
                                <div className={style.fontBodyTable}>
                                    <span className={task.on_going ? style.statusBadge : ''}>
                                        {task.board_stage_name}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className={style.fontBodyTable}>{task.user_name || 'Pendente'}</div>
                    </div>
                )) : (
                    <div style={{color: '#fff', textAlign: 'center', padding: '20px'}}>
                        Nenhum ticket encontrado
                    </div>
                )}
            </section>
        </div>
    );
}