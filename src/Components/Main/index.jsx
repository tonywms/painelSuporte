import { useState, useEffect } from 'react';
import Tabela from '../Tabela';
import Conferidos from '../Conferidos';
import Call from '../Call';
import style from './style.module.css';
import { data } from '../../data'; // Dados mockados para teste

export default function Main() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    // Opção 1: USAR DADOS MOCKADOS (para teste imediato)
    setDados(data);
    setCarregando(false);

    // Opção 2: BUSCAR DA API (quando a URL estiver correta)
    /*
    fetch('https://painel-suporte.vercel.app/api/runrun')
      .then(res => res.json())
      .then(data => {
        setDados(data);
        setCarregando(false);
      })
      .catch(err => {
        setErro(err.message);
        setCarregando(false);
      });
    */
  }, []);

  if (carregando) return <div>Carregando...</div>;
  if (erro) return <div>Erro: {erro}</div>;

  return (
    <main className={style.main}>
      <div className={style.containerMain}>
        <Tabela dados={dados} />
        <Conferidos dados={dados} />
      </div>
      <Call dados={dados} />
    </main>
  );
}