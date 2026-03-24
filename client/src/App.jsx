import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import QuestionDetail from './pages/QuestionDetail';
import Profile from './pages/Profile';
import Inbox from './pages/Inbox';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/"              element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/questions/:id" element={<PrivateRoute><QuestionDetail /></PrivateRoute>} />
            <Route path="/profile"       element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/inbox"         element={<PrivateRoute><Inbox /></PrivateRoute>} />
            <Route path="/login"         element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register"      element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
