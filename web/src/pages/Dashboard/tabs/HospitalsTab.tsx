import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Rating,
} from '@mui/material';
import {
  Search,
  LocalHospital,
  Phone,
  LocationOn,
  DirectionsRounded,
  ExpandMore,
  ExpandLess,
  CheckCircle,
} from '@mui/icons-material';

interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  services: string[];
  distance?: number;
  rating: number;
  emergencyCapacity: number;
}

const HospitalsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hospitals] = useState<Hospital[]>([
    {
      id: '1',
      name: 'Hôpital Principal de Dakar',
      address: 'Avenue Nelson Mandela',
      city: 'Dakar',
      phone: '+221 33 821 20 81',
      services: ['Urgences', 'Cardiologie', 'Chirurgie', 'Radiologie', 'Pédiatrie'],
      distance: 2.3,
      rating: 4.5,
      emergencyCapacity: 85,
    },
    {
      id: '2',
      name: 'Hôpital Le Dantec',
      address: 'Avenue Pasteur',
      city: 'Dakar',
      phone: '+221 33 821 93 00',
      services: ['Urgences', 'Médecine générale', 'ORL', 'Ophtalmologie'],
      distance: 3.7,
      rating: 4.2,
      emergencyCapacity: 65,
    },
    {
      id: '3',
      name: 'Hôpital Fann',
      address: 'Rue Aimé Césaire',
      city: 'Dakar',
      phone: '+221 33 869 11 77',
      services: ['Urgences', 'Neurologie', 'Psychiatrie', 'Médecine interne'],
      distance: 5.1,
      rating: 4.3,
      emergencyCapacity: 70,
    },
  ]);

  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.services.some((service) =>
        service.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCapacityColor = (capacity: number) => {
    if (capacity >= 75) return 'success';
    if (capacity >= 50) return 'warning';
    return 'error';
  };

  return (
    <Grid container spacing={3}>
      {/* Header et recherche */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Hôpitaux & Centres de Santé
          </Typography>
        </Box>
        <TextField
          fullWidth
          placeholder="Rechercher un hôpital, ville ou service..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'white',
            },
          }}
        />
      </Grid>

      {/* Statistiques */}
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
                  {hospitals.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Hôpitaux disponibles
                </Typography>
              </Box>
              <LocalHospital sx={{ fontSize: 60, opacity: 0.3 }} />
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
                  {hospitals.filter(h => h.emergencyCapacity >= 75).length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Urgences disponibles
                </Typography>
              </Box>
              <LocalHospital sx={{ fontSize: 60, opacity: 0.3 }} />
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
                  {hospitals[0]?.distance}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  km (Plus proche)
                </Typography>
              </Box>
              <LocationOn sx={{ fontSize: 60, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Liste des hôpitaux */}
      <Grid item xs={12}>
        <Grid container spacing={3}>
          {filteredHospitals.map((hospital) => (
            <Grid item xs={12} key={hospital.id}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 64,
                            height: 64,
                          }}
                        >
                          <LocalHospital sx={{ fontSize: 36 }} />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {hospital.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Rating value={hospital.rating} precision={0.1} size="small" readOnly />
                            <Typography variant="body2" color="text.secondary">
                              ({hospital.rating})
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {hospital.address}, {hospital.city}
                                {hospital.distance && ` • ${hospital.distance} km`}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {hospital.phone}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {hospital.services.slice(0, 3).map((service) => (
                              <Chip
                                key={service}
                                label={service}
                                size="small"
                                icon={<CheckCircle />}
                                sx={{ borderRadius: 1.5 }}
                              />
                            ))}
                            {hospital.services.length > 3 && (
                              <Chip
                                label={`+${hospital.services.length - 3} autres`}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 1.5 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>

                      <Collapse in={expandedId === hospital.id}>
                        <Box sx={{ mt: 2, pl: 9 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                            Tous les services :
                          </Typography>
                          <List dense>
                            {hospital.services.map((service) => (
                              <ListItem key={service}>
                                <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                                <ListItemText primary={service} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Collapse>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Capacité Urgences
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                flexGrow: 1,
                                height: 8,
                                bgcolor: 'grey.200',
                                borderRadius: 1,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${hospital.emergencyCapacity}%`,
                                  height: '100%',
                                  bgcolor: `${getCapacityColor(hospital.emergencyCapacity)}.main`,
                                  transition: 'width 0.3s',
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {hospital.emergencyCapacity}%
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 'auto' }}>
                          <Button
                            variant="contained"
                            startIcon={<DirectionsRounded />}
                            fullWidth
                            sx={{ borderRadius: 2 }}
                          >
                            Itinéraire
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<Phone />}
                            fullWidth
                            href={`tel:${hospital.phone.replace(/\s/g, '')}`}
                            sx={{ borderRadius: 2 }}
                          >
                            Appeler
                          </Button>
                          <Button
                            variant="text"
                            endIcon={expandedId === hospital.id ? <ExpandLess /> : <ExpandMore />}
                            onClick={() => toggleExpanded(hospital.id)}
                            fullWidth
                            sx={{ borderRadius: 2 }}
                          >
                            {expandedId === hospital.id ? 'Moins' : 'Plus'} de détails
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default HospitalsTab;
