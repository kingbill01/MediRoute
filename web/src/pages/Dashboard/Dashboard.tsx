import React, { useState } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
} from '@mui/material';
import {
  LocalHospital,
  CalendarMonth,
  Person,
  NotificationsOutlined,
  ExitToApp,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import EmergencyTab from './tabs/EmergencyTab';
import AppointmentsTab from './tabs/AppointmentsTab';
import HospitalsTab from './tabs/HospitalsTab';
import ProfileTab from './tabs/ProfileTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const user = authService.getCurrentUser();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          bgcolor: 'white',
          color: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <LocalHospital sx={{ fontSize: 40, mr: 1.5, color: 'primary.main' }} />
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MediRoute
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="primary">
              <Badge badgeContent={3} color="error">
                <NotificationsOutlined />
              </Badge>
            </IconButton>

            <Divider orientation="vertical" flexItem />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user?.role === 'PATIENT' ? 'Patient' : 'Médecin'}
                </Typography>
              </Box>
              <IconButton onClick={handleMenuOpen}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 40,
                    height: 40,
                  }}
                >
                  {user?.profile?.firstName?.charAt(0)}
                  {user?.profile?.lastName?.charAt(0)}
                </Avatar>
              </IconButton>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { setCurrentTab(3); handleMenuClose(); }}>
              <Person sx={{ mr: 1 }} /> Mon Profil
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <Settings sx={{ mr: 1 }} /> Paramètres
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ExitToApp sx={{ mr: 1 }} /> Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
          <Container maxWidth="lg">
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="dashboard tabs"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                },
              }}
            >
              <Tab
                icon={<LocalHospital />}
                iconPosition="start"
                label="Urgences"
                id="dashboard-tab-0"
              />
              <Tab
                icon={<CalendarMonth />}
                iconPosition="start"
                label="Rendez-vous"
                id="dashboard-tab-1"
              />
              <Tab
                icon={<LocalHospital />}
                iconPosition="start"
                label="Hôpitaux"
                id="dashboard-tab-2"
              />
              <Tab
                icon={<Person />}
                iconPosition="start"
                label="Profil"
                id="dashboard-tab-3"
              />
            </Tabs>
          </Container>
        </Box>
      </AppBar>

      {/* Content */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, mt: 3, mb: 4 }}>
        <TabPanel value={currentTab} index={0}>
          <EmergencyTab />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <AppointmentsTab />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <HospitalsTab />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <ProfileTab />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default Dashboard;
