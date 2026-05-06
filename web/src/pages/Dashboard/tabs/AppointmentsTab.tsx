import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  AccessTime,
  Person,
  LocationOn,
  Cancel,
  CheckCircle,
  Pending,
} from '@mui/icons-material';

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  hospital: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const AppointmentsTab: React.FC = () => {
  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      date: '2026-04-25',
      time: '10:00',
      doctor: 'Dr. Aminata Sow',
      specialty: 'Cardiologie',
      hospital: 'Hôpital Principal Dakar',
      status: 'confirmed',
    },
    {
      id: '2',
      date: '2026-05-10',
      time: '14:30',
      doctor: 'Dr. Mamadou Fall',
      specialty: 'Médecine générale',
      hospital: 'Hôpital Le Dantec',
      status: 'pending',
    },
  ]);

  const getStatusChip = (status: string) => {
    const configs = {
      confirmed: { label: 'Confirmé', color: 'success' as const, icon: <CheckCircle /> },
      pending: { label: 'En attente', color: 'warning' as const, icon: <Pending /> },
      cancelled: { label: 'Annulé', color: 'error' as const, icon: <Cancel /> },
    };
    const config = configs[status as keyof typeof configs];
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Grid container spacing={3}>
      {/* Header avec bouton */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Mes Rendez-vous
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Nouveau Rendez-vous
          </Button>
        </Box>
      </Grid>

      {/* Stats rapides */}
      <Grid item xs={12} sm={4}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  2
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  À venir
                </Typography>
              </Box>
              <CalendarMonth sx={{ fontSize: 60, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={4}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  5
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Ce mois
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 60, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={4}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  12
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total
                </Typography>
              </Box>
              <Person sx={{ fontSize: 60, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Liste des rendez-vous */}
      <Grid item xs={12}>
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Prochains Rendez-vous
            </Typography>
          </Box>
          <Divider />
          {appointments.map((appointment, index) => (
            <Box key={appointment.id}>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: 'primary.main',
                          width: 56,
                          height: 56,
                          fontSize: '1.5rem',
                        }}
                      >
                        {appointment.doctor.split(' ')[1]?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {appointment.doctor}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.specialty}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={5}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarMonth fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDate(appointment.date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          {appointment.time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">
                          {appointment.hospital}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    {getStatusChip(appointment.status)}
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button variant="outlined" size="small">
                        Détails
                      </Button>
                      <Button variant="outlined" size="small" color="error">
                        Annuler
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              {index < appointments.length - 1 && <Divider />}
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AppointmentsTab;
