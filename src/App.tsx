import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/home'
import Doc from '@/pages/doc'
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
