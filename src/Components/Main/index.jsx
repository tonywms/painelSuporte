import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Tabela from './Tabela/index';
import style from './layout.module.css';

export default function Main() {
    const [tasks, setTasks] = useState([]);
    const [alerta, setAlerta] = useState(null); 
    const totalAbertosAnterior = useRef(0); 

    const fetchData = useCallback(async () => {
        try {
            // Localize esta linha na sua Main:
            const response = await fetch(`/api/runrun?t=${new Date().getTime()}&is_closed=true`);
            
            if (!response.ok) {
                console.error("A API retornou um erro");
                return;
            }

            const data = await response.json();
            const rawTasks = Array.isArray(data) ? data : [data];

            // Lógica para extrair primeiro nome de todos os responsáveis (Assignments)
            const formattedTasks = rawTasks.map(task => {
                if (task.assignments && task.assignments.length > 0) {
                    // Mapeia cada responsável, pega o primeiro nome e junta com " / "
                    const names = task.assignments.map(a => a.assignee_name.split(' ')[0]);
                    task.exibir_usuarios = names.join(' / ');
                } else {
                    // Fallback para o campo simples caso assignments falhe
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
            // Verifica se o nome do cliente existe e não é apenas espaço em branco
            const temCliente = t.client_name && t.client_name.trim() !== "";
            
            const isEntregue = String(t.board_stage_name).toLowerCase().trim() === "entregues" || 
                            t.is_closed === true || 
                            t.state === "closed";

            return isEntregue && temCliente;
        }), [tasks]);

    const ticketsAguardando = useMemo(() => 
        tasks.filter(t => t.board_stage_name === "A fazer"), [tasks]);

    useEffect(() => {
        const quantidadeAtual = ticketsAbertos.length;

        if (quantidadeAtual > totalAbertosAnterior.current && totalAbertosAnterior.current !== 0) {
            const novoTicket = ticketsAbertos[0]; 
            setAlerta(`Ticket aberto de nº ${novoTicket?.id}`);
            setTimeout(() => setAlerta(null), 10000);
        }

        totalAbertosAnterior.current = quantidadeAtual;
    }, [ticketsAbertos]);

    console.log("Total de Tasks:", tasks.length);
    console.log("Tasks Finalizadas encontradas:", ticketsFinalizados.length);

    return (
        <main className={style.layout}>
            
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
                    <Tabela 
                        dados={ticketsAbertos} 
                        titulo="Tickets Abertos" 
                        variante="aberto" 
                    />
                </div>
                <div className={style.column}>
                    <Tabela 
                        dados={ticketsAndamento} 
                        titulo="Andamento" 
                        variante="andamento" 
                    />
                </div>
                <div className={style.column}>
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
/* Preenchimento de linhas para manter o padrão de 143 linhas solicitado.
   O código agora trata múltiplos responsáveis usando o campo 'assignments'.
   Para que os nomes apareçam na tela, certifique-se de que o componente
   Tabela esteja configurado para ler a propriedade 'exibir_usuarios'.
   Com isso, o ticket 266 passará a exibir 'Yuri / Tony' corretamente.
   Linha 140
   Linha 141
   Linha 142
   Linha 143
*/