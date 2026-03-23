import style from './style.module.css';

export default function Tabela({ dados, titulo, variante }) {
    const eAberto = variante === 'aberto';
    const eAndamento = variante === 'andamento';
    const eFinalizado = variante === 'finalizado';

    const getGradient = () => {
        if (variante === 'aberto') return 'linear-gradient(90deg, #188ABD, #0ea5e9)';
        if (variante === 'andamento') return 'linear-gradient(90deg, #6366f1, #a855f7)';
        if (variante === 'finalizado') return 'linear-gradient(90deg, #0f766e, #10b981)';
        return 'linear-gradient(90deg, #188ABD, #0ea5e9)'; 
    };

    // Grid com 5 colunas para manter o padrão visual - Mantido conforme seu original
    const gridLayout = {
        display: 'grid',
        gridTemplateColumns: '70px minmax(120px, 1.2fr) 100px 110px 1fr',
        gap: '10px'
    };

    return (
        <div className={style.ContainerTable}>
            <section className={style.containerHeader} style={{ background: getGradient() }}>
                <div className={style.headerTitle}>
                    {titulo} <span className={style.badge}>{dados?.length || 0}</span>
                </div>
            </section>

            <div className={style.labelsGrid} style={gridLayout}>
                <span>Tarefa</span>
                <span>Cliente</span>
                <span>{eAberto ? 'Início' : (eFinalizado ? 'Encerrado' : 'Entrega')}</span>
                {/* Ajuste para garantir que o título 'Status' apareça em Finalizados também */}
                <span>{eAberto || eFinalizado ? 'Status' : ''}</span>
                <span>Usuário</span>
            </div>

            <section className={style.tableBody}>
                {dados && dados.length > 0 ? dados.map(task => (
                    <div key={task.id} className={style.elementTable} style={gridLayout}>
                        <div className={style.fontBodyTable}>{task.id}</div>
                        
                        {/* Cliente */}
                        <div className={style.fontBodyTable}>{task.client_name || 'N/A'}</div>
                        
                        {/* Data: Lógica preservada com close_date para finalizados */}
                        <div className={style.fontBodyTable}>
                            {eAberto && new Date(task.created_at).toLocaleDateString('pt-BR')}
                            {eAndamento && (task.estimated_at ? new Date(task.estimated_at).toLocaleDateString('pt-BR') : '--')}
                            {eFinalizado && (task.close_date ? new Date(task.close_date).toLocaleDateString('pt-BR') : '--')}
                        </div>

                        {/* Status: Preservado conforme seu código original */}
                        <div className={style.fontBodyTable}>
                            {(eAberto || eFinalizado) && (
                                <span className={eFinalizado ? style.statusFinalizado : (task.on_going ? style.statusBadge : '')}>
                                    {task.board_stage_name}
                                </span>
                            )}
                        </div>

                        {/* Usuário */}
                        <div className={style.fontBodyTable}>{task.exibir_usuarios || 'Pendente'}</div>
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