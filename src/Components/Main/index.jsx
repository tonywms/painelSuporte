import { useEffect, useState, useMemo } from 'react';
import Tabela from './Tabela/index';
import Conferidos from './Conferidos/index';
import style from './layout.module.css';

export default function Main() {
    const [tasks, setTasks] = useState([]);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/runrun');
            
            if (!response.ok) {
                console.error("A API retornou um erro");
                return;
            }

            const data = await response.json();
            // A API do Runrun.it retorna um Array de objetos
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar dados da Vercel:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); 
        return () => clearInterval(interval);
    }, []);

    // Filtros corrigidos seguindo a documentação do Runrun.it:
    // is_closed: true/false indica se a tarefa foi encerrada
    // is_running: true/false indica se o "Play" está acionado (em andamento)

// No seu arquivo Main/index.jsx, mude APENAS estas linhas:

    const ticketsAbertos = useMemo(() => 
        tasks.filter(t => t.is_closed === false), [tasks]);

    const ticketsAndamento = useMemo(() => 
        tasks.filter(t => t.is_running === true), [tasks]);

    const ticketsFinalizados = useMemo(() => 
        tasks.filter(t => t.is_closed === true), [tasks]);

    const ticketsAguardando = useMemo(() => 
        tasks.filter(t => t.is_running === false && t.is_closed === false), [tasks]);

    return (
        <main className={style.layout}>
            <div className={style.panelsRow}>
                <div className={style.column}>
                    <Tabela dados={ticketsAbertos} />
                </div>
                <div className={style.column}>
                    <Conferidos 
                        title="Andamento" 
                        dados={ticketsAndamento} 
                        gradient="linear-gradient(90deg, #188ABD, #0ea5e9)" 
                    />
                </div>
                <div className={style.column}>
                    <Conferidos 
                        title="Finalizados" 
                        dados={ticketsFinalizados} 
                        gradient="linear-gradient(90deg, #0f766e, #14b8a6)" 
                    />
                </div>
            </div>

            <div className={style.containerCounter}>
                <div className={style.boxCounter}>
                    <label>Tickets Abertos</label>
                    <div className={style.textCounter} data-aberto>{ticketsAbertos.length}</div>
                </div>
                <div className={style.boxCounter}>
                    <label>Em Andamento</label>
                    <div className={style.textCounter} data-andamento>{ticketsAndamento.length}</div>
                </div>
                <div className={style.boxCounter}>
                    <label>Aguardando</label>
                    <div className={style.textCounter} data-aguardando>{ticketsAguardando.length}</div>
                </div>
                <div className={style.boxCounter}>
                    <label>Finalizados</label>
                    <div className={style.textCounter} data-finalizado>{ticketsFinalizados.length}</div>
                </div>
            </div>
        </main>
    );
}