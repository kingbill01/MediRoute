import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  LocalHospital,
  Warning,
  Phone,
  LocationOn,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const EmergencyTab: React.FC = () => {
  const navigate = useNavigate();

  const emergencyServices = [
    { name: 'SAMU', number: '15', color: '#d32f2f' },
    { name: 'Pompiers', number: '18', color: '#ff6f00' },
    { name: 'Police', number: '17', color: '#1976d2' },
  ];

  return (
    <Grid container spacing={3}>
      {/* Alerte d'urgence */}
      <Grid item xs={12}>
        <Alert 
          severity="error" 
          icon={<Warning fontSize="large" />}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <AlertTitle sx={{ fontSize: '1.2rem', fontWeight: 600 }}>
            En cas d'urgence vitale
          </AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Si vous êtes en danger immédiat, appelez les services d'urgence ou rendez-vous directement à l'hôpital le plus proche.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {emergencyServices.map((service) => (
              <Button
                key={service.number}
                variant="contained"
                startIcon={<Phone />}
                sx={{
                  bgcolor: service.color,
                  '&:hover': { bgcolor: service.color, opacity: 0.9 },
                }}
                href={`tel:${service.number}`}
              >
                {service.name} - {service.number}
              </Button>
            ))}
          </Box>
        </Alert>
      </Grid>

      {/* Formulaire d'urgence */}
      <Grid item xs={12} md={8}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'primary.main',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <LocalHospital sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Demande d'Urgence
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
              Remplissez le formulaire d'urgence pour être orienté vers l'hôpital le plus approprié selon votre situation.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/emergency')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
                transition: 'all 0.3s',
              }}
            >
              Commencer
            </Button>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
            }}
          />
        </Paper>
      </Grid>

      {/* Conseils d'urgence */}
      <Grid item xs={12} md={4}>
        <Card 
          elevation={0} 
          sx={{ 
            height: '100%', 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Conseils Urgences
            </Typography>
            <Box component="ul" sx={{ pl: 2, '& li': { mb: 1.5 } }}>
              <li>
                <Typography variant="body2">
                  <strong>Restez calme</strong> et évaluez la situation
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Appelez les secours</strong> si nécessaire
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Notez les symptômes</strong> précis
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Préparez</strong> vos documents médicaux
                </Typography>
              </li>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Historique des demandes */}
      <Grid item xs={12}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Historique de vos demandes d'urgence
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LocalHospital sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Aucune demande d'urgence enregistrée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Vos demandes d'urgence apparaîtront ici
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default EmergencyTab;
