import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Races from './pages/Races';
import Sponsors from './pages/Sponsors';
import SplashLoader from './components/SplashLoader';
import './App.css';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // TODO(backend): replace this simulated delay with the app's real
    // startup fetch (e.g. loading race categories/fees or event config
    // from the backend) and flip `ready` to true once it resolves.
    const timer = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <SplashLoader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/races" element={<Races />} />
          <Route path="/sponsors" element={<Sponsors />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
