import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Tabela from './Tabela/index';
import style from './layout.module.css';

export default function Main() {
    const [tasks, setTasks] = useState([]);
    const [alerta, setAlerta] = useState(null); 
    const totalAbertosAnterior = useRef(0); 

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(`/api/runrun?t=${new Date().getTime()}&is_closed=true`);
            
            if (!response.ok) {
                console.error("A API retornou um erro");
                return;
            }

            const data = await response.json();
            const rawTasks = Array.isArray(data) ? data : [data];

            const formattedTasks = rawTasks.map(task => {
                if (task.assignments && task.assignments.length > 0) {
                    const names = task.assignments.map(a => a.assignee_name.split(' ')[0]);
                    task.exibir_usuarios = names.join(' / ');
                } else {
                    task.exibir_usuarios = task.user_name ? task.user_name.split(' ')[0] : 'N/A';
                }
                return task;
            });

            setTasks(formattedTasks);
        } catch (error) {
            console.error("Erro ao carregar dados da Vercel:", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, [fetchData]);

    const ticketsAbertos = useMemo(() => 
        tasks.filter(t => 
            t.board_stage_name === "A fazer" || 
            t.board_stage_name === "Em aprovação"
        ), [tasks]);

    const ticketsAndamento = useMemo(() => 
        tasks.filter(t => t.board_stage_name === "Fazendo"), [tasks]);

    const ticketsFinalizados = useMemo(() => 
        tasks.filter(t => {
            const temCliente = t.client_name && t.client_name.trim() !== "" && t.client_name !== "N/A";
            const isEntregue = String(t.board_stage_name).toLowerCase().trim() === "entregues" || 
                               t.is_closed === true || 
                               t.state === "closed";
            return isEntregue && temCliente;
        }), [tasks]);

    const ticketsAguardando = useMemo(() => 
        tasks.filter(t => t.board_stage_name === "A fazer"), [tasks]);

    // LÓGICA ATUALIZADA: Sincronia Total entre Voz e Alerta
    useEffect(() => {
        const quantidadeAtual = ticketsAbertos.length;

        if (quantidadeAtual > totalAbertosAnterior.current && totalAbertosAnterior.current !== 0) {
            const novoTicket = ticketsAbertos[0]; 
            const cliente = novoTicket?.client_name || 'Não identificado';
            const id = novoTicket?.id;
            const mensagemTexto = `Cliente: ${cliente} - ID: #${id}`;
            const mensagemVoz = `Nova solicitação. Cliente: ${cliente}. Ticket: ${id}`;

            const executarAlertaSincronizado = (vez) => {
                const utterance = new SpeechSynthesisUtterance(mensagemVoz);
                utterance.lang = 'pt-BR';
                utterance.rate = 0.9;

                // 1. Só mostra o alerta quando a voz REALMENTE começar
                utterance.onstart = () => {
                    setAlerta(mensagemTexto);
                };

                // 2. Só retira o alerta quando a voz REALMENTE terminar
                utterance.onend = () => {
                    setAlerta(null);
                    
                    // Lógica para repetir a segunda vez após 1 segundo de intervalo
                    if (vez === 1) {
                        setTimeout(() => executarAlertaSincronizado(2), 1000);
                    }
                };

                window.speechSynthesis.speak(utterance);
            };

            executarAlertaSincronizado(1);
        }

        totalAbertosAnterior.current = quantidadeAtual;
    }, [ticketsAbertos]);

    return (
        <main className={style.layout}>
            {alerta && (
                <div className={style.overlayAlerta}>
                    <div className={style.boxAlerta}>
                        <h1 className={style.tituloAlerta}>NOVO TICKET!</h1>
                        <p className={style.mensagemAlerta}>{alerta}</p>
                    </div>
                </div>
            )}

            <div className={style.panelsRow}>
                <div className={style.column}>
                    <Tabela dados={ticketsAbertos} titulo="Tickets Abertos" variante="aberto" />
                </div>
                <div className={style.column}>
                    <Tabela dados={ticketsAndamento} titulo="Andamento" variante="andamento" />
                </div>
                <div className={style.column}>
                    <Tabela dados={ticketsFinalizados} titulo="Finalizados" variante="finalizado" />
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


/*
vercel --prod
*/