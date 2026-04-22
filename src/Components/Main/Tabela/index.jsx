import style from './style.module.css';

export default function Tabela({ dados, titulo, variante, slaConfig }) {
    const getStatusClass = (task) => {
        if (variante !== 'aberto') return style.statusDefault;
        
        switch(task.slaStatus) {
            case 'critical': return style.statusCritical;
            case 'warning': return style.statusWarning;
            case 'normal': return style.statusNormal;
            case 'dev': return style.statusDev;
            case 'devCritical': return style.statusCritical;
            default: return style.statusNormal;
        }
    };

    const getStatusText = (task) => {
        if (variante !== 'aberto') {
            if (variante === 'andamento') return task.board_stage_name || 'Fazendo';
            return task.board_stage_name || 'Em andamento';
        }
        return task.slaMessage || `🟢 Normal (${task.minutesOpen || 0}m)`;
    };

    const getHeaderGradient = () => {
        if (variante === 'aberto') return 'linear-gradient(135deg, #188ABD, #0ea5e9)';
        if (variante === 'andamento') return 'linear-gradient(135deg, #6366f1, #a855f7)';
        return 'linear-gradient(135deg, #0f766e, #10b981)';
    };

    const getGridClass = () => {
        if (variante === 'aberto') return style.labelsGridAbertos;
        if (variante === 'andamento') return style.labelsGridAndamento;
        return style.labelsGridFinalizados;
    };

    const getElementClass = () => {
        if (variante === 'aberto') return style.elementTableAbertos;
        if (variante === 'andamento') return style.elementTableAndamento;
        return style.elementTableFinalizados;
    };

    return (
        <div className={style.containerTable}>
            <div className={style.tableHeader} style={{ background: getHeaderGradient() }}>
                <h3>
                    {titulo}
                    <span className={style.badge}>{dados?.length || 0}</span>
                </h3>
            </div>

            <div className={getGridClass()}>
                <span>ID</span>
                <span>Cliente</span>
                {variante === 'aberto' && <span>Aberto há</span>}
                {variante === 'andamento' && <span>Previsão</span>}
                {variante === 'finalizado' && <span>Encerrado</span>}
                <span>Status</span>
                {variante !== 'andamento' && <span>Responsável</span>}
            </div>

            <div className={style.tableBody}>
                {dados && dados.length > 0 ? dados.map(task => (
                    <div key={task.id} className={getElementClass()}>
                        <div style={{ fontWeight: 'bold' }}>#{task.id}</div>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.client_name || 'N/A'}
                        </div>
                        
                        {variante === 'aberto' && (
                            <div style={{ fontFamily: 'monospace' }}>{task.timeOpenFormatted || '0m'}</div>
                        )}
                        {variante === 'andamento' && (
                            <div style={{ whiteSpace: 'nowrap' }}>
                                {task.estimated_at ? new Date(task.estimated_at).toLocaleDateString('pt-BR') : '--'}
                            </div>
                        )}
                        {variante === 'finalizado' && (
                            <div>{task.close_date ? new Date(task.close_date).toLocaleDateString('pt-BR') : '--'}</div>
                        )}
                        
                        <div>
                            <span className={getStatusClass(task)} style={{ whiteSpace: 'nowrap' }}>
                                {getStatusText(task)}
                            </span>
                        </div>
                        
                        {variante !== 'andamento' && (
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {task.exibir_usuarios || 'Pendente'}
                            </div>
                        )}
                    </div>
                )) : (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
                        Nenhum ticket encontrado
                    </div>
                )}
            </div>
        </div>
    );
}