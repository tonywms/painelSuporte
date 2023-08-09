import Logo from "./Logo"
import Title from "./Title"
import style from './style.module.css';

export default function Header() {
    return (
        <div className={style.header}>
            <Logo/>
            <Title/>
        </div>
    )
}