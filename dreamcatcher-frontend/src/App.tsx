import DreamyBackground from './components/background/DreamyBackground';
import Header from './components/layout/Header';
import HeroSection from './components/dream/HeroSection';
import './index.css';

function App() {
  return (
    <div className="App">
      <DreamyBackground />
      <Header />
      <HeroSection />
    </div>
  );
}

export default App;
