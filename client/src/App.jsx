import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  return <Routes><Route path="/" element={<Home />} /><Route path="/u/:username" element={<Dashboard />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
