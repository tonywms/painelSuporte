import Logo from "./Logo";
import Title from "./Title";
import style from './style.module.css';

export default function Header() {
    return (
        <header className={style.header}>
            <div className={style.headerContent}>
                <Logo />
                <Title />
            </div>
            <div className={style.headerGlow} />
        </header>
    );
}