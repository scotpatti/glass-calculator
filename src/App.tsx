import { Calculator } from './components/Calculator'

function App() {
  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <div className="backdrop__blob" />
        <div className="backdrop__blob" />
        <div className="backdrop__blob" />
      </div>
      <main className="app">
        <h1 className="sr-only">Glass Calculator</h1>
        <Calculator />
      </main>
    </>
  )
}

export default App
