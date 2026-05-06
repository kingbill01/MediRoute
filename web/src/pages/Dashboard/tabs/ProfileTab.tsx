import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  Cake,
  LocationCity,
  Wc,
  Bloodtype,
  LocalHospital,
  ContactEmergency,
} from '@mui/icons-material';
import authService from '../../../services/authService';

const ProfileTab: React.FC = () => {
  const [editMode, setEditMode] = useState(false);
  const user = authService.getCurrentUser();
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.profile?.phone || '',
    email: user?.email || '',
    dateOfBirth: user?.profile?.dateOfBirth || '',
    gender: user?.profile?.gender || '',
    city: user?.profile?.city || '',
    region: user?.profile?.region || '',
    bloodGroup: user?.patientInfo?.bloodGroup || '',
    allergies: user?.patientInfo?.allergies || '',
    chronicConditions: user?.patientInfo?.chronicConditions || '',
    emergencyContactName: user?.patientInfo?.emergencyContactName || '',
    emergencyContactPhone: user?.patientInfo?.emergencyContactPhone || '',
    emergencyContactRelationship: user?.patientInfo?.emergencyContactRelationship || '',
  });

  const handleSave = () => {
    // TODO: Implémenter la sauvegarde
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    // Reset form data
  };

  return (
    <Grid container spacing={3}>
      {/* En-tête profil */}
      <Grid item xs={12}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '4px solid rgba(255,255,255,0.3)',
                  fontSize: '3rem',
                }}
              >
                {user?.profile?.firstName?.charAt(0)}
                {user?.profile?.lastName?.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip
                    label={user?.role === 'PATIENT' ? 'Patient' : 'Médecin'}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={user?.status || 'ACTIVE'}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {user?.email}
                </Typography>
              </Box>
              <Box>
                {!editMode ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                    }}
                  >
                    Modifier
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      sx={{
                        bgcolor: 'white',
                        color: 'success.main',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                      }}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                      }}
                    >
                      Annuler
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Informations personnelles */}
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            height: '100%',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Informations Personnelles
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Person fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Person fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Email fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de naissance"
                type="date"
                value={formData.dateOfBirth?.split('T')[0] || ''}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Cake fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Genre"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <Wc fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ville"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <LocationCity fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Région"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <LocationCity fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Informations médicales */}
      {user?.role === 'PATIENT' && (
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Informations Médicales
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Groupe sanguin"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Bloodtype fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  disabled={!editMode}
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: <LocalHospital fontSize="small" sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />,
                  }}
                  placeholder="Ex: Pénicilline, Arachides..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Conditions chroniques"
                  value={formData.chronicConditions}
                  onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                  disabled={!editMode}
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: <LocalHospital fontSize="small" sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />,
                  }}
                  placeholder="Ex: Diabète, Hypertension..."
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}

      {/* Contact d'urgence */}
      {user?.role === 'PATIENT' && (
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
              Contact d'Urgence
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Nom du contact"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <ContactEmergency fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Téléphone du contact"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Relation"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Person fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  placeholder="Ex: Épouse, Frère..."
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default ProfileTab;
