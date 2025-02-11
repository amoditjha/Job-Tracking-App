import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Applications } from './pages/Applications';
import { Resumes } from './pages/Resumes';
import { Auth } from './pages/Auth';
import { AuthProvider } from './contexts/AuthContext';


const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
            <Route path="/login" element={<Auth />} />
              <Route index element={<Dashboard />} />
              <Route path="applications" element={<Applications />} />
              <Route path="resumes" element={<Resumes />} />
              
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;