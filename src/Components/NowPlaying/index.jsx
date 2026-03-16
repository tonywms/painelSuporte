import style from './style.module.css';
import { useEffect, useState } from 'react';

export default function NowPlaying({ evento }) {
    const [visivel, setVisivel] = useState(false);

    useEffect(() => {
        if (!evento) return;

        setVisivel(true);

        const timer = setTimeout(() => {
            setVisivel(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, [evento?.ts]); // 👈 importante para reabrir popup

    if (!evento || !visivel) return null;

    return (
        <div className={style.overlay}>
            <div className={style.card}>
                <div className={style.badge}>
                    STATUS ATUALIZADO
                </div>

                <div className={style.cliente}>
                    {evento.Cliente}
                </div>

                {/* 🔥 MENSAGEM INTELIGENTE */}
                {evento.mensagemCustom && (
                    <div className={style.mensagem}>
                        Pedido: {evento.numeroPedido}
                        <br />
                        {evento.mensagemCustom}
                    </div>
                )}
            </div>
        </div>
    );
}