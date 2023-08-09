'use client';

import { useEffect } from 'react';
import style from './style.module.css';

var valorPorCiclo2 = 0;

export default function Conferidos({ dados }) {

    
    function loop() {
        let table = document.querySelector('#data-body-conferido');
        setTimeout(() => {
            if (table?.scrollHeight - table?.clientHeight <= valorPorCiclo2) {
                table?.scrollTo({ top: 0, behavior: 'auto' });
                valorPorCiclo2 = 0;
            } else {
                table?.scrollTo({ top: valorPorCiclo2 + 34, behavior: 'smooth' });
                valorPorCiclo2 = valorPorCiclo2 + 34;
            }
            loop();
        }, 10 * 1000)
    };

    useEffect(() => { loop() }, []);

    return (
        <div className={style.containerConferido}>
            <section className={style.titleConferido}>
                <h2 className={style.Title}>Pedidos Finalizados</h2>
            </section>
            <section className={style.containerElementsFinalizados} id="data-body-conferido">
                {
                    dados?.filter(pedido => pedido.Situacao == "Finalizado").
                        sort((a, b) => (a < b.Codpedido) ? -1 : (a > b.Codpedido) ? 1 : 0).
                        map((pedidos, key) =>
                            <div key={`k-c-${key}`} className={style.ElementFinalizado}>
                                <div style={{ borderRightWidth: "2px" }}>{pedidos?.Codpedido}</div>
                                <div>{pedidos.Cliente}</div>
                            </div>)
                }
            </section>
        </div>
    )
}