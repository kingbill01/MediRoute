import React, { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Alert,
  CircularProgress, Stepper, Step, StepLabel, MenuItem,
  Grid, Divider, Chip, InputAdornment, Link,
} from '@mui/material';
import {
  PersonOutline, MedicalServices, ArrowForward, ArrowBack,
  LocalHospital, Email, Lock, Phone, LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { ROUTES } from '../../config/constants';

const REGIONS = ['Dakar','Thiès','Saint-Louis','Ziguinchor','Kaolack','Diourbel',
  'Louga','Fatick','Kolda','Matam','Tambacounda','Kaffrine','Kédougou','Sédhiou'];
const SPECIALIZATIONS = ['Médecine générale','Cardiologie','Pédiatrie','Gynécologie',
  'Chirurgie','Neurologie','Ophtalmologie','ORL','Dermatologie','Psychiatrie',
  'Radiologie','Anesthésie','Orthopédie','Urologie','Endocrinologie'];
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75 }}>
    {children}{required && <Box component="span" sx={{ color: '#E53E3E', ml: 0.3 }}>*</Box>}
  </Typography>
);

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: '', city: 'Dakar', region: 'Dakar',
    bloodGroup: '', allergies: '', chronicConditions: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '',
    specialization: '', licenseNumber: '', hospitalAffiliation: '',
    consultationFee: '', yearsOfExperience: '', bio: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const steps = role === 'PATIENT'
    ? ['Type de compte', 'Informations', 'Santé']
    : ['Type de compte', 'Informations', 'Exercice'];

  const validateStep = () => {
    if (step === 1) {
      if (!form.email || !form.password || !form.firstName || !form.lastName || !form.phone) {
        setError('Veuillez remplir tous les champs obligatoires'); return false;
      }
      if (form.password !== form.confirmPassword) {
        setError('Les mots de passe ne correspondent pas'); return false;
      }
      if (form.password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères'); return false;
      }
    }
    if (step === 2 && role === 'DOCTOR') {
      if (!form.specialization || !form.licenseNumber) {
        setError('Spécialisation et numéro de licence requis'); return false;
      }
    }
    setError(''); return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true); setError('');
    try {
      const payload: any = {
        email: form.email, password: form.password, role,
        profile: {
          firstName: form.firstName, lastName: form.lastName,
          phone: form.phone, address: { city: form.city, region: form.region },
        },
      };
      if (role === 'PATIENT') {
        payload.patientInfo = {
          bloodGroup: form.bloodGroup || undefined,
          allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()) : [],
          chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s => s.trim()) : [],
          emergencyContact: form.emergencyContactName ? {
            name: form.emergencyContactName, phone: form.emergencyContactPhone,
            relationship: form.emergencyContactRelationship,
          } : undefined,
        };
      } else {
        payload.doctorInfo = {
          specialization: form.specialization, licenseNumber: form.licenseNumber,
          hospitalAffiliation: form.hospitalAffiliation || undefined,
          consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : undefined,
          yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : undefined,
          bio: form.bio || undefined,
        };
      }
      await authService.register(payload);
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F4F6F9' }}>
      {/* Bande gauche minimaliste */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        width: 280, background: 'linear-gradient(155deg, #0F2D52 0%, #1E4D8C 100%)',
        p: 4, gap: 3,
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: '#00A896', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <LocalHospital sx={{ color: '#fff', fontSize: 30 }} />
          </Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>MediRoute</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, mt: 0.5 }}>Plateforme médicale</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', width: '100%' }} />
        {steps.map((label, i) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', opacity: step === i ? 1 : 0.45 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              bgcolor: step > i ? '#00A896' : step === i ? '#fff' : 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: step === i ? '#0F2D52' : '#fff' }}>
                {step > i ? '✓' : i + 1}
              </Typography>
            </Box>
            <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: step === i ? 600 : 400 }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Formulaire */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 580, p: { xs: 3, sm: 4 }, border: '1px solid #E2E8F0' }}>
          {/* Stepper mobile */}
          <Box sx={{ display: { md: 'none' }, mb: 3 }}>
            <Stepper activeStep={step} alternativeLabel>
              {steps.map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
            </Stepper>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52', mb: 0.5 }}>
            {steps[step]}
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: 13, mb: 3 }}>
            Étape {step + 1} sur {steps.length}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: 13 }}>{error}</Alert>}

          {/* ── Étape 0 : choix du rôle ── */}
          {step === 0 && (
            <Box>
              <Grid container spacing={2}>
                {([
                  { value: 'PATIENT', icon: <PersonOutline sx={{ fontSize: 32 }} />, title: 'Patient', desc: 'Prenez des rendez-vous et gérez votre santé' },
                  { value: 'DOCTOR', icon: <MedicalServices sx={{ fontSize: 32 }} />, title: 'Médecin', desc: 'Gérez vos patients et consultations' },
                ] as const).map(opt => (
                  <Grid item xs={6} key={opt.value}>
                    <Box
                      onClick={() => setRole(opt.value)}
                      sx={{
                        border: '2px solid',
                        borderColor: role === opt.value ? '#0F2D52' : '#E2E8F0',
                        borderRadius: 3, p: 2.5, cursor: 'pointer', textAlign: 'center',
                        bgcolor: role === opt.value ? '#EEF3FF' : '#fff',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: '#0F2D52' },
                      }}
                    >
                      <Box sx={{ color: role === opt.value ? '#0F2D52' : '#9CA3AF', mb: 1 }}>{opt.icon}</Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1A202C' }}>{opt.title}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: '#64748B', mt: 0.5 }}>{opt.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              {role === 'DOCTOR' && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontSize: 12.5 }}>
                  Votre compte sera validé par un administrateur avant activation.
                </Alert>
              )}

              {/* Lien vers inscription établissement */}
              <Box
                onClick={() => navigate('/register/facility')}
                sx={{
                  mt: 3, p: 2, borderRadius: 2, border: '1px dashed #00A896',
                  bgcolor: '#f0fbf9', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 1.5,
                  '&:hover': { bgcolor: '#e8f5e9', borderStyle: 'solid' },
                }}>
                <Box sx={{ fontSize: 28 }}>🏥</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#0F2D52' }}>
                    Inscrire un établissement de santé
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>
                    Hôpital · Clinique · Centre de santé · District sanitaire
                  </Typography>
                </Box>
                <Typography sx={{ color: '#00A896', fontWeight: 700, fontSize: 18 }}>›</Typography>
              </Box>
            </Box>
          )}

          {/* ── Étape 1 : infos personnelles ── */}
          {step === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Label required>Prénom</Label>
                <TextField fullWidth size="small" value={form.firstName} onChange={set('firstName')} placeholder="Amadou" />
              </Grid>
              <Grid item xs={6}>
                <Label required>Nom</Label>
                <TextField fullWidth size="small" value={form.lastName} onChange={set('lastName')} placeholder="Diallo" />
              </Grid>
              <Grid item xs={12}>
                <Label required>Email</Label>
                <TextField fullWidth size="small" type="email" value={form.email} onChange={set('email')}
                  placeholder="vous@exemple.com"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 17, color: '#9CA3AF' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <Label required>Téléphone</Label>
                <TextField fullWidth size="small" value={form.phone} onChange={set('phone')}
                  placeholder="+221 77 000 00 00"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: 17, color: '#9CA3AF' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={6}>
                <Label>Région</Label>
                <TextField fullWidth size="small" select value={form.region} onChange={set('region')}>
                  {REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <Label>Ville</Label>
                <TextField fullWidth size="small" value={form.city} onChange={set('city')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn sx={{ fontSize: 17, color: '#9CA3AF' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}><Divider /></Grid>
              <Grid item xs={12}>
                <Label required>Mot de passe</Label>
                <TextField fullWidth size="small" type="password" value={form.password} onChange={set('password')}
                  placeholder="8 caractères minimum"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 17, color: '#9CA3AF' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <Label required>Confirmer le mot de passe</Label>
                <TextField fullWidth size="small" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 17, color: '#9CA3AF' }} /></InputAdornment> }} />
              </Grid>
            </Grid>
          )}

          {/* ── Étape 2 Patient : santé ── */}
          {step === 2 && role === 'PATIENT' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Label>Groupe sanguin</Label>
                <TextField fullWidth size="small" select value={form.bloodGroup} onChange={set('bloodGroup')}>
                  <MenuItem value="">Non renseigné</MenuItem>
                  {BLOOD_GROUPS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Label>Allergies</Label>
                <TextField fullWidth size="small" value={form.allergies} onChange={set('allergies')}
                  placeholder="Pénicilline, Aspirine…" helperText="Séparez par des virgules" />
              </Grid>
              <Grid item xs={12}>
                <Label>Maladies chroniques</Label>
                <TextField fullWidth size="small" value={form.chronicConditions} onChange={set('chronicConditions')}
                  placeholder="Diabète, Hypertension…" helperText="Séparez par des virgules" />
              </Grid>
              <Grid item xs={12}>
                <Divider><Chip label="Contact d'urgence" size="small" /></Divider>
              </Grid>
              <Grid item xs={12}>
                <Label>Nom du contact</Label>
                <TextField fullWidth size="small" value={form.emergencyContactName} onChange={set('emergencyContactName')} />
              </Grid>
              <Grid item xs={6}>
                <Label>Téléphone</Label>
                <TextField fullWidth size="small" value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
              </Grid>
              <Grid item xs={6}>
                <Label>Relation</Label>
                <TextField fullWidth size="small" value={form.emergencyContactRelationship} onChange={set('emergencyContactRelationship')} placeholder="Parent, Époux/se…" />
              </Grid>
            </Grid>
          )}

          {/* ── Étape 2 Médecin : exercice ── */}
          {step === 2 && role === 'DOCTOR' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Label required>Spécialisation</Label>
                <TextField fullWidth size="small" select value={form.specialization} onChange={set('specialization')}>
                  {SPECIALIZATIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Label required>Numéro de licence</Label>
                <TextField fullWidth size="small" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="SN-2024-XXXXX" />
              </Grid>
              <Grid item xs={12}>
                <Label>Hôpital d'affiliation</Label>
                <TextField fullWidth size="small" value={form.hospitalAffiliation} onChange={set('hospitalAffiliation')} />
              </Grid>
              <Grid item xs={6}>
                <Label>Années d'expérience</Label>
                <TextField fullWidth size="small" type="number" value={form.yearsOfExperience} onChange={set('yearsOfExperience')} />
              </Grid>
              <Grid item xs={6}>
                <Label>Tarif (FCFA)</Label>
                <TextField fullWidth size="small" type="number" value={form.consultationFee} onChange={set('consultationFee')} />
              </Grid>
              <Grid item xs={12}>
                <Label>Biographie</Label>
                <TextField fullWidth size="small" multiline rows={3} value={form.bio} onChange={set('bio')} placeholder="Présentez votre parcours…" />
              </Grid>
            </Grid>
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 4 }}>
            {step > 0 && (
              <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />} sx={{ borderColor: '#E2E8F0', color: '#374151', flex: 1 }}>
                Retour
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />} sx={{ flex: 2 }}>
                Continuer
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit} disabled={loading} endIcon={!loading && <ArrowForward />} sx={{ flex: 2 }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Créer mon compte"}
              </Button>
            )}
          </Box>

          <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 13, color: '#64748B' }}>
            Déjà un compte ?{' '}
            <Link component="button" onClick={() => navigate(ROUTES.LOGIN)}
              sx={{ fontWeight: 700, color: '#0F2D52', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Se connecter
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register;
