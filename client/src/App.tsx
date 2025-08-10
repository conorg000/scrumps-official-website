import { GameCanvas } from './components/GameCanvas';

function App() {
  return (
    <div className="w-full h-screen overflow-hidden bg-blue-500">
      <div className="text-white p-4">Debug: App is loading...</div>
      <GameCanvas />
    </div>
  );
}

export default App;
