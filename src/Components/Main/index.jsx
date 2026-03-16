import { useEffect, useState, useMemo, useRef } from 'react';
import Tabela from './Tabela/index';
import style from './layout.module.css';

export default function Main() {
    const [tasks, setTasks] = useState([]);
    const [alerta, setAlerta] = useState(null); 
    const totalAbertosAnterior = useRef(0); 

    const fetchData = async () => {
        try {
            // Busca os dados da sua API que já está travada no board_id=597967
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

    // Dentro do seu Main/index.jsx, substitua os useMemo por estes:

    // 1. Tickets Abertos: "A fazer" ou "Em aprovação"
    const ticketsAbertos = useMemo(() => 
        tasks.filter(t => 
            t.board_stage_name === "A fazer" || 
            t.board_stage_name === "Em aprovação"
        ), [tasks]);

    // 2. Andamento: Apenas "Fazendo"
    const ticketsAndamento = useMemo(() => 
        tasks.filter(t => t.board_stage_name === "Fazendo"), [tasks]);

    // 3. Finalizados: Tudo o que não for os status acima
    const ticketsFinalizados = useMemo(() => 
        tasks.filter(t => 
            t.board_stage_name !== "A fazer" && 
            t.board_stage_name !== "Em aprovação" && 
            t.board_stage_name !== "Fazendo"
        ), [tasks]);

    // Filtra o que não está rodando e não está fechado (Contador Aguardando)
    const ticketsAguardando = useMemo(() => 
        tasks.filter(t => t.board_stage_name === "A fazer"), [tasks]);

    // --- LÓGICA DO ALERTA DE NOVO TICKET ---
    useEffect(() => {
        const quantidadeAtual = ticketsAbertos.length;

        // Se a quantidade atual for maior que a anterior, dispara o alerta
        if (quantidadeAtual > totalAbertosAnterior.current && totalAbertosAnterior.current !== 0) {
            // Pega o ID do ticket mais recente (topo da lista)
            const novoTicket = ticketsAbertos[0]; 
            setAlerta(`Ticket aberto de nº ${novoTicket?.id}`);

            // Remove o alerta após 10 segundos
            setTimeout(() => setAlerta(null), 10000);
        }

        totalAbertosAnterior.current = quantidadeAtual;
    }, [ticketsAbertos]);

    return (
        <main className={style.layout}>
            
            {/* ALERTA VISUAL NO MEIO DA TELA */}
            {alerta && (
                <div className={style.overlayAlerta}>
                    <div className={style.boxAlerta}>
                        <h1 className={style.tituloAlerta}>NOVO CHAMADO!</h1>
                        <p className={style.mensagemAlerta}>{alerta}</p>
                    </div>
                </div>
            )}

            <div className={style.panelsRow}>
                <div className={style.column}>
                    {/* Tabela de Abertos (A fazer / Em aprovação) */}
                    <Tabela 
                        dados={ticketsAbertos} 
                        titulo="Tickets Abertos" 
                        variante="aberto" 
                    />
                </div>
                <div className={style.column}>
                    {/* Agora usando Tabela para ter Tarefa, Cliente e Usuário */}
                    <Tabela 
                        dados={ticketsAndamento} 
                        titulo="Andamento" 
                        variante="andamento" 
                    />
                </div>
                <div className={style.column}>
                    {/* Agora usando Tabela para ter Tarefa, Cliente e Usuário */}
                    <Tabela 
                        dados={ticketsFinalizados} 
                        titulo="Finalizados" 
                        variante="finalizado" 
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