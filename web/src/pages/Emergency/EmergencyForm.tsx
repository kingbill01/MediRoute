import React, { useState, useEffect } from 'react';
import {
  Container, Box, Paper, Typography, Button, Stepper, Step, StepLabel,
  FormControl, FormLabel, RadioGroup, Radio, TextField, Checkbox,
  FormGroup, FormControlLabel, CircularProgress, Alert, List, ListItem,
  ListItemText, Chip, Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import emergencyService, {
  EmergencyFormQuestion,
} from '../../services/emergencyService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SECTION_COLOR: Record<string, string> = {
  'Identité du patient':       '#0F2D52',
  'État de conscience':        '#7B2D8B',
  'Respiration':               '#1565C0',
  'Douleur thoracique':        '#C62828',
  'Blessures & Saignements':   '#E65100',
  'Symptômes principaux':      '#2E7D32',
  'Durée des symptômes':       '#00695C',
  'Antécédents médicaux':      '#4527A0',
  'Médicaments & Allergies':   '#1565C0',
  'Mobilité':                  '#558B2F',
  'Transport':                 '#00838F',
  'Description de la situation': '#4E342E',
  'Localisation':              '#283593',
};

const EmergencyForm: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep]       = useState(0);
  const [questions, setQuestions]         = useState<EmergencyFormQuestion[]>([]);
  const [answers, setAnswers]             = useState<Record<string, any>>({});
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');
  const [result, setResult]               = useState<any>(null);

  useEffect(() => {
    emergencyService.getEmergencyForm()
      .then((data) => setQuestions(data))
      .catch(() => setError('Erreur de chargement du formulaire'))
      .finally(() => setLoading(false));
  }, []);

  const handleAnswer = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMultiple = (key: string, option: string) => {
    const current: string[] = answers[key] || [];
    handleAnswer(key, current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const position = await emergencyService.getUserLocation();
      const { latitude, longitude } = position.coords;

      const payload = {
        patientName:    answers.name     || 'Anonyme',
        patientAge:     answers.age      || null,
        patientGender:  answers.gender   || null,
        patientPhone:   answers.phone    || '',
        bloodGroup:     answers.bloodGroup || null,
        city:           answers.city     || 'Dakar',
        region:         answers.region   || 'Dakar',
        address:        answers.address  || null,
        latitude, longitude,
        consciousness:  answers.consciousness  || null,
        breathing:      answers.breathing      || null,
        chestPain:      answers.chestPain      || null,
        injury:         answers.injury         || null,
        symptoms:       answers.symptoms       || [],
        duration:       answers.duration       || null,
        medicalHistory: answers.medicalHistory || [],
        medications:    answers.medications    || '',
        canMove:        answers.canMove        || null,
        needsAmbulance: answers.needsAmbulance || null,
        description:    answers.description    || '',
        formResponses:  questions.map((q) => ({
          question: q.question,
          answer: answers[q.field || q.id] || '',
        })),
      };

      const res = await emergencyService.submitEmergencyRequest(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q: EmergencyFormQuestion) => {
    const key   = (q as any).field || q.id;
    const color = SECTION_COLOR[(q as any).section] || '#0F2D52';

    // ── patient_info ────────────────────────────────────────────────────
    if (q.type === 'patient_info') {
      return (
        <Box>
          <TextField fullWidth label="Nom complet *" value={answers.name || ''}
            onChange={(e) => handleAnswer('name', e.target.value)} margin="normal" />

          <Box display="flex" gap={2}>
            <TextField label="Âge" type="number" value={answers.age || ''}
              onChange={(e) => handleAnswer('age', e.target.value)} margin="normal" sx={{ flex: 1 }} />
            <TextField label="Téléphone *" value={answers.phone || ''}
              onChange={(e) => handleAnswer('phone', e.target.value)} margin="normal" sx={{ flex: 1 }} />
          </Box>

          <FormControl component="fieldset" sx={{ mt: 1 }}>
            <FormLabel>Sexe</FormLabel>
            <RadioGroup row value={answers.gender || ''}
              onChange={(e) => handleAnswer('gender', e.target.value)}>
              {['Homme', 'Femme', 'Autre'].map((g) => (
                <FormControlLabel key={g} value={g} control={<Radio />} label={g} />
              ))}
            </RadioGroup>
          </FormControl>

          <Box mt={1}>
            <Typography variant="body2" color="text.secondary" mb={1}>Groupe sanguin</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {BLOOD_GROUPS.map((g) => (
                <Chip key={g} label={g} clickable
                  color={answers.bloodGroup === g ? 'primary' : 'default'}
                  onClick={() => handleAnswer('bloodGroup', g)} />
              ))}
            </Stack>
          </Box>
        </Box>
      );
    }

    // ── single_choice ───────────────────────────────────────────────────
    if (q.type === 'single_choice') {
      return (
        <FormControl component="fieldset" fullWidth>
          <RadioGroup value={answers[key] || ''}
            onChange={(e) => handleAnswer(key, e.target.value)}>
            {q.options?.map((opt) => (
              <FormControlLabel key={opt} value={opt} label={opt}
                control={<Radio sx={{ color: color, '&.Mui-checked': { color } }} />}
                sx={{
                  border: '1px solid',
                  borderColor: answers[key] === opt ? color : '#E2E8F0',
                  borderRadius: 2, mb: 1, mx: 0, px: 1,
                  bgcolor: answers[key] === opt ? color + '0D' : 'transparent',
                }} />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }

    // ── multiple_choice ─────────────────────────────────────────────────
    if (q.type === 'multiple_choice') {
      return (
        <FormControl component="fieldset" fullWidth>
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            Plusieurs choix possibles
          </Typography>
          <FormGroup>
            {q.options?.map((opt) => {
              const selected = (answers[key] || []).includes(opt);
              return (
                <FormControlLabel key={opt}
                  control={
                    <Checkbox checked={selected}
                      onChange={() => toggleMultiple(key, opt)}
                      sx={{ color: color, '&.Mui-checked': { color } }} />
                  }
                  label={opt}
                  sx={{
                    border: '1px solid',
                    borderColor: selected ? color : '#E2E8F0',
                    borderRadius: 2, mb: 0.5, mx: 0, px: 1,
                    bgcolor: selected ? color + '0D' : 'transparent',
                  }} />
              );
            })}
          </FormGroup>
        </FormControl>
      );
    }

    // ── text ────────────────────────────────────────────────────────────
    if (q.type === 'text') {
      return (
        <TextField fullWidth multiline rows={4}
          placeholder={(q as any).placeholder || ''}
          value={answers[key] || ''}
          onChange={(e) => handleAnswer(key, e.target.value)}
          sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }} />
      );
    }

    // ── location ────────────────────────────────────────────────────────
    if (q.type === 'location') {
      return (
        <Box>
          <TextField fullWidth label="Ville" value={answers.city || 'Dakar'}
            onChange={(e) => handleAnswer('city', e.target.value)} margin="normal" />
          <TextField fullWidth label="Région" value={answers.region || 'Dakar'}
            onChange={(e) => handleAnswer('region', e.target.value)} margin="normal" />
          <TextField fullWidth label="Adresse précise (optionnel)" value={answers.address || ''}
            onChange={(e) => handleAnswer('address', e.target.value)} margin="normal" />
        </Box>
      );
    }

    return null;
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // ── Résultat ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Demande d'urgence enregistrée — Score de priorité : <strong>{result.priorityScore}/10</strong>
            </Alert>

            {result.assignedHospital ? (
              <>
                <Typography variant="h6" gutterBottom>Hôpital assigné</Typography>
                <List>
                  <ListItem divider>
                    <ListItemText
                      primary={result.assignedHospital.name}
                      secondary={
                        <>
                          {result.assignedHospital.address}<br />
                          Distance : {result.assignedHospital.distance} km ·{' '}
                          Arrivée estimée : {result.assignedHospital.estimatedArrival} min
                        </>
                      } />
                    <Chip label={result.assignedHospital.phone} icon={<span>📞</span>} variant="outlined" />
                  </ListItem>
                </List>
              </>
            ) : (
              <Alert severity="warning">
                Aucun hôpital d'urgence disponible à proximité pour le moment.
              </Alert>
            )}

            <Box mt={3}>
              <Button variant="contained" onClick={() => navigate('/')}>
                Retour à l'accueil
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  const q = questions[activeStep];
  if (!q) return null;
  const sectionColor = SECTION_COLOR[(q as any).section] || '#0F2D52';

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Bandeau urgence */}
          <Box sx={{
            bgcolor: '#C62828', borderRadius: 2, py: 1.5, px: 3, mb: 3,
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Typography variant="h6" color="white" fontWeight={800} letterSpacing={1}>
              🚨 URGENCE MÉDICALE
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3, overflowX: 'auto' }}>
            {questions.map((_, i) => (
              <Step key={i}><StepLabel /></Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Badge section */}
          <Box sx={{
            display: 'inline-block', bgcolor: sectionColor + '18',
            borderRadius: 1, px: 1.5, py: 0.5, mb: 1,
          }}>
            <Typography variant="caption" fontWeight={700} color={sectionColor}
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {(q as any).section}
            </Typography>
          </Box>

          {/* Question */}
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {q.question}
          </Typography>

          <Box my={2}>{renderQuestion(q)}</Box>

          {/* Navigation */}
          <Box display="flex" justifyContent="space-between" mt={4} gap={2}>
            <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)}
              variant="outlined">
              Précédent
            </Button>

            {activeStep === questions.length - 1 ? (
              <Button variant="contained" color="error" onClick={handleSubmit} disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}>
                Envoyer la demande d'urgence
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStep((s) => s + 1)}
                sx={{ bgcolor: sectionColor, '&:hover': { bgcolor: sectionColor } }}>
                Suivant
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmergencyForm;
