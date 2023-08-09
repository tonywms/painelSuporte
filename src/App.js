import logo from './logo.svg';
import './App.css';
import Header from './Components/Header';
import Main from './Components/Main';
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
