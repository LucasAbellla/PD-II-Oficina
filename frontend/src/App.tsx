import { Navigate, Route, Routes } from 'react-router-dom';
import ClientLayout from './components/ClientLayout';
import Layout from './components/Layout';
import ClientLoginPage from './pages/ClientLoginPage';
import ClientVehiclePage from './pages/ClientVehiclePage';
import ClientVehiclesPage from './pages/ClientVehiclesPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomersPage from './pages/CustomersPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersPage from './pages/OrdersPage';
import PublicOrderPage from './pages/PublicOrderPage';
import UsersPage from './pages/UsersPage';
import VehicleHistoryPage from './pages/VehicleHistoryPage';
import VehiclesPage from './pages/VehiclesPage';

// Para expandir: crie uma página em src/pages/ e adicione a rota aqui.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Área do cliente: placa ou CPF + código de acesso */}
      <Route path="/cliente" element={<ClientLoginPage />} />
      <Route element={<ClientLayout />}>
        <Route path="/cliente/veiculos" element={<ClientVehiclesPage />} />
        <Route path="/cliente/veiculos/:id" element={<ClientVehiclePage />} />
      </Route>
      {/* Link público por OS: sem login, somente leitura */}
      <Route path="/acompanhar/:token" element={<PublicOrderPage />} />
      <Route element={<Layout />}>
        <Route path="/painel" element={<DashboardPage />} />
        <Route path="/os" element={<OrdersPage />} />
        <Route path="/os/:id" element={<OrderDetailPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/clientes/:id" element={<CustomerDetailPage />} />
        <Route path="/veiculos" element={<VehiclesPage />} />
        <Route path="/veiculos/:id/historico" element={<VehicleHistoryPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
