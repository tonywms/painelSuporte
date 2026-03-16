import './App.css';
import Header from './Components/Header';
import Main from './Components/Main'; // Agora importa o index.js da pasta Main
import style from './style.module.css';

function App() {
  return (
    <div className={style.container}>
      <Header/>
      <Main/>
    </div>
  );
}

export default App;