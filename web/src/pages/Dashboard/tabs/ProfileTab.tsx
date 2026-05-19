import React, { useEffect, useState } from 'react';
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
  Chip,
  Alert,
  LinearProgress,
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
  Bolt,
  DirectionsCar,
  WorkspacePremium,
} from '@mui/icons-material';
import authService from '../../../services/authService';
import subscriptionService, { Subscription } from '../../../services/subscriptionService';
import emergencyService from '../../../services/emergencyService';
import QuickEmergencyDialog from '../../../components/QuickEmergencyDialog';

const EMERGENCY_NUMBERS = [
  { name: 'SAMU', number: '15', color: '#d32f2f', icon: '🚑' },
  { name: 'Pompiers', number: '18', color: '#ff6f00', icon: '🚒' },
  { name: 'Police', number: '17', color: '#1976d2', icon: '🚓' },
];

const ProfileTab: React.FC = () => {
  const [editMode, setEditMode] = useState(false);
  const user = authService.getCurrentUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activeCount, setActiveCount] = useState<{ active: number; limit: number; remaining: number } | null>(null);
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const isSubscribedPatient = !!(
    user?.role === 'PATIENT' &&
    subscription?.isActive
  );

  useEffect(() => {
    if (user?.role !== 'PATIENT') return;
    subscriptionService.getMySubscription()
      .then((r) => setSubscription(r.data))
      .catch(() => setSubscription(null));
  }, [user?.role]);

  useEffect(() => {
    if (!isSubscribedPatient) return;
    emergencyService.getActiveCount()
      .then(setActiveCount)
      .catch(() => setActiveCount(null));
  }, [isSubscribedPatient, quickDialogOpen]);

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

  const emergencyContactPhone = formData.emergencyContactPhone;
  const limitReached = !!activeCount && activeCount.active >= activeCount.limit;

  return (
    <Grid container spacing={3}>
      {/* Urgences prioritaires — patients souscrits uniquement */}
      {isSubscribedPatient && (
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '2px solid',
              borderColor: '#d32f2f',
              background: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Bolt sx={{ color: '#d32f2f', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#b71c1c' }}>
                      Urgences prioritaires
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Accès rapide pour abonnés MediRoute
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<WorkspacePremium />}
                    label="Abonné"
                    size="small"
                    sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 600 }}
                  />
                  {activeCount && (
                    <Chip
                      label={`${activeCount.active}/${activeCount.limit} actives`}
                      size="small"
                      color={limitReached ? 'error' : 'default'}
                      variant={limitReached ? 'filled' : 'outlined'}
                    />
                  )}
                </Box>
              </Box>

              {activeCount && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(activeCount.active / activeCount.limit) * 100}
                    color={limitReached ? 'error' : 'warning'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              )}

              {limitReached && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Limite de {activeCount?.limit} urgences actives atteinte. Attendez la prise en charge des demandes en cours.
                </Alert>
              )}

              <Grid container spacing={1.5}>
                {EMERGENCY_NUMBERS.map((s) => (
                  <Grid item xs={6} sm={3} key={s.number}>
                    <Button
                      fullWidth
                      variant="contained"
                      href={`tel:${s.number}`}
                      startIcon={<Phone />}
                      sx={{
                        bgcolor: s.color,
                        py: 1.5,
                        fontWeight: 700,
                        '&:hover': { bgcolor: s.color, filter: 'brightness(0.92)' },
                      }}
                    >
                      {s.name} · {s.number}
                    </Button>
                  </Grid>
                ))}
                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    onClick={() => setQuickDialogOpen(true)}
                    disabled={limitReached}
                    startIcon={<DirectionsCar />}
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    Ambulance
                  </Button>
                </Grid>
              </Grid>

              {emergencyContactPhone && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ContactEmergency color="action" fontSize="small" />
                    <Typography variant="body2">
                      Contact d'urgence : <strong>{formData.emergencyContactName || 'Proche'}</strong>
                      {formData.emergencyContactRelationship && ` (${formData.emergencyContactRelationship})`}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Phone />}
                    href={`tel:${emergencyContactPhone}`}
                  >
                    {emergencyContactPhone}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* CTA souscription — patient non souscrit */}
      {user?.role === 'PATIENT' && subscription !== null && !subscription?.isActive && (
        <Grid item xs={12}>
          <Alert
            severity="info"
            icon={<WorkspacePremium />}
            action={
              <Button size="small" href="#" onClick={(e) => { e.preventDefault(); window.location.hash = '#subscription'; }}>
                Souscrire
              </Button>
            }
            sx={{ borderRadius: 2 }}
          >
            <strong>Urgences prioritaires</strong> — Souscrivez pour accéder à l'envoi d'ambulance en 1 clic depuis votre profil.
          </Alert>
        </Grid>
      )}

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

      <QuickEmergencyDialog
        open={quickDialogOpen}
        onClose={() => setQuickDialogOpen(false)}
      />
    </Grid>
  );
};

export default ProfileTab;
