import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import CustomersPage from './pages/CustomersPage';
import LoginPage from './pages/LoginPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersPage from './pages/OrdersPage';
import VehicleHistoryPage from './pages/VehicleHistoryPage';
import VehiclesPage from './pages/VehiclesPage';

// Para expandir: crie uma página em src/pages/ e adicione a rota aqui.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/os" element={<OrdersPage />} />
        <Route path="/os/:id" element={<OrderDetailPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/veiculos" element={<VehiclesPage />} />
        <Route path="/veiculos/:id/historico" element={<VehicleHistoryPage />} />
        <Route path="*" element={<Navigate to="/os" replace />} />
      </Route>
    </Routes>
  );
}
