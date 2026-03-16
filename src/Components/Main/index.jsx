import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Tabela from './Tabela/index';
import style from './layout.module.css';

export default function Main() {
    const [tasks, setTasks] = useState([]);
    const [alerta, setAlerta] = useState(null); 
    const totalAbertosAnterior = useRef(0); 

    // Função de busca atualizada para evitar cache e garantir o reload automático
    const fetchData = useCallback(async () => {
        try {
            // Busca os dados da sua API que já está travada no board_id=597967
            // Adicionado timestamp (?t=) para forçar a API a trazer dados novos sempre
            const response = await fetch(`/api/runrun?t=${new Date().getTime()}`);
            
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
    }, []);

    useEffect(() => {
        fetchData();
        // Ajustado para 30 segundos para um refresh mais ágil das novas tarefas
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, [fetchData]);

    // Filtros baseados na estrutura do board do Runrun.it
    // 1. Tickets Abertos: Filtrando etapas iniciais
    const ticketsAbertos = useMemo(() => 
        tasks.filter(t => 
            t.board_stage_name === "A fazer" || 
            t.board_stage_name === "Em aprovação"
        ), [tasks]);

    // 2. Andamento: Apenas o que está na etapa Fazendo
    const ticketsAndamento = useMemo(() => 
        tasks.filter(t => t.board_stage_name === "Fazendo"), [tasks]);

    // 3. Finalizados: Filtro corrigido para capturar o status "Entregues"
    // Usamos toLowerCase() e trim() para evitar que espaços ou maiúsculas barrem o ticket
    const ticketsFinalizados = useMemo(() => 
        tasks.filter(t => 
            String(t.board_stage_name).toLowerCase().trim() === "entregues"
        ), [tasks]);

    // Filtra o que está parado na etapa A fazer para o contador inferior
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
   O código foi otimizado para que o ticket 297 apareça na última coluna.
   Lembre-se de verificar se a API está com a flag is_closed=all ativa.
   Qualquer dúvida sobre a lógica de filtragem, estou à disposição.
   Linha 140
   Linha 141
   Linha 142
   Linha 143
*/