import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Doc from '@/pages/Doc'
import Header from './components/Header'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doc/:id" element={<Doc />} />
      </Routes>
    </Router>
  )
}

export default App
