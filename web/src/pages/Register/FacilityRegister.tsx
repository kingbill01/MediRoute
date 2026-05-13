import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, MenuItem, Grid, Paper,
  Stepper, Step, StepLabel, Alert, CircularProgress, Chip, Divider,
  Switch, FormControlLabel, InputAdornment, IconButton,
} from '@mui/material';
import {
  LocalHospital, ArrowBack, ArrowForward, Business, Person,
  Visibility, VisibilityOff, CheckCircle,
} from '@mui/icons-material';
import facilityService, { FacilityType } from '../../services/facilityService';
import { toast } from 'react-toastify';

const SENEGAL_REGIONS = [
  'Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kolda', 'Louga',
  'Matam', 'Saint-Louis', 'Sédhiou', 'Tambacounda', 'Kaffrine', 'Kédougou', 'Ziguinchor',
];

const COMMON_SERVICES = [
  'Consultations générales', 'Urgences 24/7', 'Hospitalisation', 'Maternité',
  'Pédiatrie', 'Chirurgie', 'Imagerie médicale', 'Laboratoire', 'Pharmacie',
  'Soins intensifs', 'Dialyse', 'Cardiologie', 'Dermatologie', 'Ophtalmologie',
  'Vaccination', 'Soins dentaires', 'Kinésithérapie',
];

const COMMON_FACILITIES = [
  'Salle d\'opération', 'Salle de réanimation', 'Bloc maternité', 'Radiologie',
  'Scanner', 'IRM', 'Échographie', 'Laboratoire', 'Pharmacie', 'Cafétéria',
  'Parking', 'Ambulance', 'Service mortuaire',
];

const STEPS = ['Type d\'établissement', 'Informations établissement', 'Compte administrateur'];

const FacilityRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [types, setTypes] = useState<FacilityType[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    // Facility
    type: '', name: '', region: 'Dakar', city: '', address: '',
    phone: '', emergencyPhone: '', email: '', website: '', description: '',
    registrationNumber: '', taxNumber: '',
    services: [] as string[], specializations: '', facilities: [] as string[],
    totalBeds: 0, ambulanceAvailable: false, canAcceptEmergency: true,
    // Admin
    adminFirstName: '', adminLastName: '', adminEmail: '', adminPhone: '', adminPassword: '',
  });

  useEffect(() => { facilityService.getTypes().then(setTypes).catch(() => {}); }, []);

  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));
  const toggleArray = (k: 'services' | 'facilities', v: string) => setForm(p => ({
    ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v],
  }));

  const validateStep = (): boolean => {
    setError('');
    if (step === 0 && !form.type) { setError('Veuillez choisir un type d\'établissement'); return false; }
    if (step === 1) {
      if (!form.name || !form.region || !form.city || !form.address || !form.phone || !form.emergencyPhone) {
        setError('Tous les champs marqués * sont obligatoires'); return false;
      }
    }
    if (step === 2) {
      if (!form.adminFirstName || !form.adminLastName || !form.adminEmail || !form.adminPhone || !form.adminPassword) {
        setError('Tous les champs administrateur sont obligatoires'); return false;
      }
      if (form.adminPassword.length < 8) {
        setError('Le mot de passe doit faire au moins 8 caractères'); return false;
      }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true); setError('');
    try {
      await facilityService.register({
        facility: {
          name: form.name, type: form.type, region: form.region, city: form.city,
          address: form.address, phone: form.phone, emergencyPhone: form.emergencyPhone,
          email: form.email || undefined, website: form.website || undefined,
          description: form.description || undefined,
          registrationNumber: form.registrationNumber || undefined,
          taxNumber: form.taxNumber || undefined,
          services: form.services,
          specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean),
          facilities: form.facilities,
          totalBeds: form.totalBeds || 0,
          ambulanceAvailable: form.ambulanceAvailable,
          canAcceptEmergency: form.canAcceptEmergency,
        },
        admin: {
          firstName: form.adminFirstName, lastName: form.adminLastName,
          email: form.adminEmail, phone: form.adminPhone, password: form.adminPassword,
        },
      });
      toast.success('Inscription réussie ! En attente de validation par l\'administrateur.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F4F6F9', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 880, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/register')} sx={{ bgcolor: '#fff' }}><ArrowBack /></IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#00A896', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Business sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#0F2D52">Inscription Établissement de Santé</Typography>
              <Typography variant="caption" color="text.secondary">Hôpital · Clinique · Centre · District sanitaire</Typography>
            </Box>
          </Box>
        </Box>

        <Paper sx={{ p: 4, borderRadius: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
            {STEPS.map(label => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {/* Step 0 — Type d'établissement */}
          {step === 0 && (
            <Box>
              <Typography fontWeight={700} mb={2} color="#0F2D52">Type d'établissement *</Typography>
              <Grid container spacing={2}>
                {types.map(t => (
                  <Grid item xs={12} sm={6} key={t.value}>
                    <Box
                      onClick={() => setForm(p => ({ ...p, type: t.value }))}
                      sx={{
                        p: 2.5, borderRadius: 2, cursor: 'pointer',
                        border: '2px solid', borderColor: form.type === t.value ? '#00A896' : '#e0e0e0',
                        bgcolor: form.type === t.value ? '#e8f5e9' : '#fff',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        transition: 'all .2s',
                        '&:hover': { borderColor: '#00A896' },
                      }}>
                      <LocalHospital sx={{ color: form.type === t.value ? '#00A896' : '#999', fontSize: 28 }} />
                      <Typography fontWeight={form.type === t.value ? 700 : 500}>{t.label}</Typography>
                      {form.type === t.value && <CheckCircle sx={{ ml: 'auto', color: '#00A896' }} />}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Step 1 — Informations établissement */}
          {step === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Nom de l'établissement *" value={form.name} onChange={f('name')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="N° d'enregistrement officiel" value={form.registrationNumber} onChange={f('registrationNumber')} placeholder="ex: AGR-2026-001" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Région *" value={form.region} onChange={f('region')}>
                  {SENEGAL_REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Ville *" value={form.city} onChange={f('city')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Adresse complète *" value={form.address} onChange={f('address')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Téléphone principal *" value={form.phone} onChange={f('phone')} placeholder="+221 77 000 00 00" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Téléphone urgences *" value={form.emergencyPhone} onChange={f('emergencyPhone')} placeholder="+221 33 000 00 00" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" type="email" value={form.email} onChange={f('email')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Site web" value={form.website} onChange={f('website')} placeholder="https://..." />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="NINEA / N° fiscal" value={form.taxNumber} onChange={f('taxNumber')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nombre de lits total" type="number" value={form.totalBeds} onChange={f('totalBeds')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={f('description')} />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}><Chip label="Services proposés" size="small" /></Divider>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {COMMON_SERVICES.map(s => (
                    <Chip key={s} label={s} clickable
                      onClick={() => toggleArray('services', s)}
                      color={form.services.includes(s) ? 'success' : 'default'}
                      variant={form.services.includes(s) ? 'filled' : 'outlined'} size="small" />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label="Spécialisations (séparées par virgules)" value={form.specializations} onChange={f('specializations')}
                  placeholder="ex: Cardiologie, Pédiatrie, Neurologie" />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}><Chip label="Infrastructures" size="small" /></Divider>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {COMMON_FACILITIES.map(s => (
                    <Chip key={s} label={s} clickable
                      onClick={() => toggleArray('facilities', s)}
                      color={form.facilities.includes(s) ? 'primary' : 'default'}
                      variant={form.facilities.includes(s) ? 'filled' : 'outlined'} size="small" />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={form.ambulanceAvailable} onChange={e => setForm(p => ({ ...p, ambulanceAvailable: e.target.checked }))} />}
                  label="Service ambulance disponible" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={form.canAcceptEmergency} onChange={e => setForm(p => ({ ...p, canAcceptEmergency: e.target.checked }))} />}
                  label="Accepte les urgences" />
              </Grid>
            </Grid>
          )}

          {/* Step 2 — Compte administrateur */}
          {step === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2"><strong>Compte administrateur</strong> : cette personne pourra gérer l'établissement, les lits, l'inventaire et les affiliations médecins.</Typography>
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Prénom *" value={form.adminFirstName} onChange={f('adminFirstName')}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Nom *" value={form.adminLastName} onChange={f('adminLastName')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email *" type="email" value={form.adminEmail} onChange={f('adminEmail')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Téléphone *" value={form.adminPhone} onChange={f('adminPhone')} placeholder="+221 77 000 00 00" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Mot de passe * (min 8 caractères)" type={showPwd ? 'text' : 'password'}
                    value={form.adminPassword} onChange={f('adminPassword')}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">
                        <IconButton onClick={() => setShowPwd(!showPwd)} size="small">{showPwd ? <VisibilityOff /> : <Visibility />}</IconButton>
                      </InputAdornment>,
                    }} />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={step === 0} onClick={handleBack} startIcon={<ArrowBack />}>Précédent</Button>
            {step < 2 ? (
              <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />}
                sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' }, px: 4 }}>
                Suivant
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit} disabled={loading}
                sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' }, px: 4 }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Créer l\'établissement'}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default FacilityRegister;
