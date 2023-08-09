import style from './style.module.css';

export default function Title() {
    return (
        <div className={style.ContainerTitle}>
            <h1 className={style.textTitle}>
                Acompanhamento de Pedidos
            </h1>
        </div>
    )
}