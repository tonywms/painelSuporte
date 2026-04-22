import { useState, useEffect } from 'react';
import style from './style.module.css';

export default function Header({ onConfigClick }) {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getGreeting = () => {
        const hour = currentDateTime.getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <header className={style.header}>
            <div className={style.headerContent}>
                {/* Lado Esquerdo - Título */}
                <div className={style.headerLeft}>
                    <div className={style.titleSection}>
                        <h1 className={style.mainTitle}>WMSEXPERT</h1>
                        <span className={style.subTitle}>Painel de Controle de Suporte</span>
                    </div>
                </div>

                {/* Lado Direito - Informações alinhadas */}
                <div className={style.headerRight}>
                    {/* Saudação */}
                    <div className={style.greetingSection}>
                        <span className={style.greetingText}>{getGreeting()} 👋</span>
                    </div>

                    {/* Data e Hora */}
                    <div className={style.datetimeSection}>
                        <div className={style.dateDisplay}>
                            📅 {formatDate(currentDateTime)}
                        </div>
                        <div className={style.timeDisplay}>
                            🕐 {formatTime(currentDateTime)}
                        </div>
                    </div>

                    {/* Botão Configurações */}
                    <button className={style.configButton} onClick={onConfigClick}>
                        ⚙️ Configurações
                    </button>

                    {/* Status do Sistema */}
                    <div className={style.statusCard}>
                        <div className={style.statusDot}></div>
                        <div className={style.statusInfo}>
                            <span className={style.statusLabel}>SISTEMA</span>
                            <span className={style.statusText}>Operacional</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}