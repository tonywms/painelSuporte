import axios from 'axios';
import { useState, useEffect } from 'react';
import Tabela from './Tabela';
import Conferidos from './Conferidos';
import style from './layout.module.css';

export default function Main() {

    const [dados, setDados] = useState([]);

    async function getDados() {
        let local = localStorage.getItem('dados');
        if (local != '' || undefined && local != null) {
            axios.get('http://192.168.4.218:3000/pedidosf14').
            then(data => data.data?.filter((dados) => dados.Situacao === 'Retirar' ? false : true)).
            then(data => (setDados(data), console.log(data))).catch(err => console.log(err))
        }

        setTimeout(() => {
            getDados()
        }, 60000);
    }

    useEffect(
        () => {
            getDados();
        }
        , []
    );

    return (
        <div className={style.layout}>
            <Tabela dados={dados} />
            <Conferidos dados={dados} />
            {/* <ListCall dados={dados}/> */}
            <section className={style.containerCounter}>
                <section className={style.boxCounter}>
                    <label htmlFor="">Em Separação</label>&nbsp;&nbsp;
                    <div className={style.textCounter} data-separacao>{dados.filter(dado => dado.Situacao == 'Em Separação').length}</div>
                </section>
                <section className={style.boxCounter}>
                    <label htmlFor="">Aguardando Conferência</label>&nbsp;&nbsp;
                    <div className={style.textCounter} data-aguardando>{dados.filter(dado => dado.Situacao == 'Aguardando conferencia').length}</div>
                </section>
                <section className={style.boxCounter}>
                    <label htmlFor="">Conferência Finalizada</label>&nbsp;&nbsp;
                    <div className={style.textCounter} data-conferido>{dados.filter(dado => dado.Situacao == 'Conferencia Finalizada').length}</div>
                </section>
                <section className={style.boxCounter}>
                    <label htmlFor="">Finalizados</label>&nbsp;&nbsp;
                    <div className={style.textCounter} data-finalizado>{dados.filter(dado => dado.Situacao == 'Finalizado').length}</div>
                </section>
            </section>
        </div>
    )
}