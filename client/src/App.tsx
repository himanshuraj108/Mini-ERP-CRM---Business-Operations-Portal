import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CustomersListPage from './pages/Customers/CustomersListPage';
import CustomerDetailPage from './pages/Customers/CustomerDetailPage';
import CustomerFormPage from './pages/Customers/CustomerFormPage';
import ProductsListPage from './pages/Products/ProductsListPage';
import ProductDetailPage from './pages/Products/ProductDetailPage';
import ProductFormPage from './pages/Products/ProductFormPage';
import ChallansListPage from './pages/Challans/ChallansListPage';
import ChallanDetailPage from './pages/Challans/ChallanDetailPage';
import ChallanCreatePage from './pages/Challans/ChallanCreatePage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute roles={['admin', 'sales']}>
              <AppLayout>
                <CustomersListPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/new"
          element={
            <ProtectedRoute roles={['admin', 'sales']}>
              <AppLayout>
                <CustomerFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute roles={['admin', 'sales']}>
              <AppLayout>
                <CustomerDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id/edit"
          element={
            <ProtectedRoute roles={['admin', 'sales']}>
              <AppLayout>
                <CustomerFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProductsListPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute roles={['admin', 'warehouse']}>
              <AppLayout>
                <ProductFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProductDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute roles={['admin', 'warehouse']}>
              <AppLayout>
                <ProductFormPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/challans"
          element={
            <ProtectedRoute roles={['admin', 'sales', 'accounts']}>
              <AppLayout>
                <ChallansListPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/challans/new"
          element={
            <ProtectedRoute roles={['admin', 'sales']}>
              <AppLayout>
                <ChallanCreatePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/challans/:id"
          element={
            <ProtectedRoute roles={['admin', 'sales', 'accounts']}>
              <AppLayout>
                <ChallanDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
