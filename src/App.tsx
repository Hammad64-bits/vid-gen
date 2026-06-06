import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";

import "./App.css";

function App() {
  return (
    <main>
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}

export default App;
