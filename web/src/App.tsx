import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import EmergencyForm from './pages/Emergency/EmergencyForm';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import DoctorDashboard from './pages/Dashboard/DoctorDashboard';
import PatientDashboard from './pages/Dashboard/PatientDashboard';
import authService from './services/authService';
import { ROUTES } from './config/constants';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#0F2D52', light: '#1E4D8C', dark: '#081D38', contrastText: '#fff' },
    secondary: { main: '#00A896', light: '#33BFAD', dark: '#007A6E', contrastText: '#fff' },
    error:     { main: '#E53E3E' },
    warning:   { main: '#D69E2E' },
    success:   { main: '#38A169' },
    background: { default: '#F4F6F9', paper: '#FFFFFF' },
    text: { primary: '#1A202C', secondary: '#64748B' },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
    '0px 3px 8px rgba(0,0,0,0.07), 0px 1px 3px rgba(0,0,0,0.04)',
    '0px 6px 16px rgba(0,0,0,0.08), 0px 2px 6px rgba(0,0,0,0.04)',
    '0px 10px 24px rgba(0,0,0,0.09)',
    '0px 14px 32px rgba(0,0,0,0.10)',
    '0px 18px 40px rgba(0,0,0,0.10)',
    '0px 22px 48px rgba(0,0,0,0.11)',
    '0px 26px 56px rgba(0,0,0,0.11)',
    '0px 30px 64px rgba(0,0,0,0.12)',
    '0px 34px 72px rgba(0,0,0,0.12)',
    '0px 38px 80px rgba(0,0,0,0.13)',
    '0px 42px 88px rgba(0,0,0,0.13)',
    '0px 46px 96px rgba(0,0,0,0.14)',
    '0px 50px 104px rgba(0,0,0,0.14)',
    '0px 54px 112px rgba(0,0,0,0.15)',
    '0px 58px 120px rgba(0,0,0,0.15)',
    '0px 62px 128px rgba(0,0,0,0.16)',
    '0px 66px 136px rgba(0,0,0,0.16)',
    '0px 70px 144px rgba(0,0,0,0.17)',
    '0px 74px 152px rgba(0,0,0,0.17)',
    '0px 78px 160px rgba(0,0,0,0.18)',
    '0px 82px 168px rgba(0,0,0,0.18)',
    '0px 86px 176px rgba(0,0,0,0.19)',
    '0px 90px 184px rgba(0,0,0,0.20)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingTop: 10, paddingBottom: 10, boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1E4D8C 0%, #0F2D52 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #2557A0 0%, #152F54 100%)' },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #00C4B0 0%, #00A896 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0px 2px 8px rgba(0,0,0,0.06)', border: '1px solid #EEF2F7' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
        elevation1: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            '&:hover fieldset': { borderColor: '#0F2D52' },
            '&.Mui-focused fieldset': { borderColor: '#0F2D52', borderWidth: 2 },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: '0.7rem' } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-head': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', backgroundColor: '#F8FAFC' } },
      },
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to={ROUTES.LOGIN} />;
};

const RoleBasedDashboard: React.FC = () => {
  const user = authService.getCurrentUser();
  const role = (user as any)?.role?.toUpperCase();
  if (role === 'ADMIN') return <AdminDashboard />;
  if (role === 'DOCTOR') return <DoctorDashboard />;
  return <PatientDashboard />;
};

const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.EMERGENCY} element={<EmergencyForm />} />
        <Route path={ROUTES.DASHBOARD} element={<PrivateRoute><RoleBasedDashboard /></PrivateRoute>} />
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} />} />
      </Routes>
    </BrowserRouter>
    <ToastContainer
      position="top-right"
      autoClose={4000}
      toastStyle={{ borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: 14 }}
    />
  </ThemeProvider>
);

export default App;
