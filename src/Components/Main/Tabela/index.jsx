'use client';

import { useState, useEffect } from 'react';
import style from './style.module.css';

var valorPorCiclo = 0;
export default function Tabela({ dados }) {
    
    function loop() {
        let table = document.querySelector('#data-body-tabel');

        setTimeout(() => {
            if (table?.scrollHeight - table?.clientHeight <= valorPorCiclo) {
                table?.scrollTo({ top: 0, behavior: 'auto' });
                valorPorCiclo = 0;
            } else {
                table?.scrollTo({ top: valorPorCiclo + 34, behavior: 'smooth' });
                valorPorCiclo = valorPorCiclo + 34;
            }
            loop();
        }, 10 * 1000)
    };


    useEffect(() => {
        loop();
    }, [])

    function Switch(status){
        switch(status){
            case 'Em Separação': 
                return <div className={style.statusPedido} data-separacao/>
            case 'Aguardando conferencia':
                return <div className={style.statusPedido} data-aguardando/>
            case 'Conferencia Finalizada':
                return <div className={style.statusPedido} data-finalizada/>
        }
    }

    return (
        <div className={style.ContainerTable}>
            <section className={style.containerHeader}>
                <div className={style.fontHeader}>
                    Status
                </div>
                <div className={style.fontHeader}>
                    Pedido
                </div>
                <div className={style.fontHeader}>
                    Código
                </div>
                <div className={style.fontHeader}>
                    Cliente
                </div>
            </section>
            <section className={style.tableBody} id="data-body-tabel">
                {dados.filter(
                    (pedido) => pedido.Situacao === 'Finalizado' ? false : true).
                    sort((a, b) => (a < b.Codpedido) ? -1 : (a > b.Codpedido) ? 1 : 0).
                    map((el, key) => <div key={`t-k-${key}`} className={style.elementTable}>
                        <div className={style.fontBodyTable}>
                            {Switch(el.Situacao)}
                        </div>
                        <div className={style.fontBodyTable}>
                            {el.Codpedido}
                        </div>
                        <div className={style.fontBodyTable}>
                            {el.CodCliente}
                        </div>
                        <div className={style.fontBodyTable}>
                            {el.Cliente}
                        </div>
                    </div>)}
            </section>
        </div>
    )
}