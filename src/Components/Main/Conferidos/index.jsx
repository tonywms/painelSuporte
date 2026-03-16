import style from './style.module.css';

export default function Conferidos({ dados, title, gradient }) {
    return (
        <div className={style.containerConferido}>
            <section className={style.titleConferido} style={{ background: gradient }}>
                <div className={style.headerTitle}>
                    {title} <span className={style.badge}>{dados.length}</span>
                </div>
            </section>

            <section className={style.containerElementsFinalizados}>
                {dados.map((task) => (
                    <div key={task.id} className={style.ElementFinalizado}>
                        <div className={style.codPedido}>
                           <div className={style.caixaSquare}></div>
                           #{task.id}
                        </div>
                        <div style={{fontSize: '12px'}}>{task.client_name || 'Cliente'}</div>
                        <div style={{fontSize: '12px'}}>{task.responsible_name || '---'}</div>
                    </div>
                ))}
            </section>
        </div>
    );
}