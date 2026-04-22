import { useEffect, useState } from "react";
import style from './Call.module.css';


export default function ListCall({ dados }) {
    const [newArray, setNewArray] = useState([]);
    const [cliente, setCliente] = useState('');

    function deleteFirst() {
        setTimeout(() => {
            setCliente(cliente => newArray[0]?.Cliente);
            newArray.shift();
            deleteFirst();
        }, 10 * 1000);
    }

    useEffect(() => {
        setNewArray( value => ([...value, ...dados.map(dado => ({ ...dado, chamado: false }))]));
    }, []);

    return (
        <>
            <div className={style.Container}>
                <section className={style.ClientContainer}>
                    <section>
                        <label>Código Pedido</label>
                        <div>012231</div>
                    </section>

                    <section>
                        <label>Cliente</label>
                        <div>{newArray[0]?.Cliente}</div>
                    </section>
                </section>
            </div>
        </>
    )
}