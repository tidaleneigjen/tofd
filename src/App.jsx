import MenuBar from "./components/MenuBar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-violet-950 text-gray-300">
      {/* Container to constrain width and center */}
      <div className="max-w-5xl mx-auto w-full px-4 flex flex-col flex-grow">
        <MenuBar />
        <Header />
        <main className="flex-grow">
          <Home />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
