import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  LocalHospital,
  DirectionsCar,
  MyLocation,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import emergencyService from '../services/emergencyService';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

type Severity = 'CRITICAL' | 'URGENT' | 'SEMI_URGENT';

const QuickEmergencyDialog: React.FC<Props> = ({ open, onClose, onSubmitted }) => {
  const [severity, setSeverity] = useState<Severity>('URGENT');
  const [needsAmbulance, setNeedsAmbulance] = useState(true);
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const reset = () => {
    setSeverity('URGENT');
    setNeedsAmbulance(true);
    setDescription('');
    setCoords(null);
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const detectLocation = () => {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setError(`Localisation impossible : ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    if (!coords) {
      setError('Veuillez activer la géolocalisation avant d\'envoyer.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await emergencyService.submitQuickRequest({
        latitude: coords.lat,
        longitude: coords.lng,
        description,
        needsAmbulance,
        severity,
      });
      setResult(r.data);
      onSubmitted?.();
    } catch (e: any) {
      const code = e?.response?.data?.code;
      if (code === 'EMERGENCY_LIMIT_REACHED') {
        setError(e.response.data.message);
      } else if (code === 'SUBSCRIPTION_REQUIRED') {
        setError('Souscription active requise pour les urgences prioritaires.');
      } else {
        setError(e?.response?.data?.message || 'Erreur lors de l\'envoi de la demande.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LocalHospital />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Urgence prioritaire
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Prise en charge accélérée — abonné MediRoute
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {result ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Demande envoyée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Référence : {result.requestId}
            </Typography>
            {result.assignedHospital && (
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, textAlign: 'left', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.dark' }}>
                  Hôpital assigné
                </Typography>
                <Typography variant="body2">{result.assignedHospital.name}</Typography>
                <Typography variant="body2">{result.assignedHospital.address}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>
                  📞 {result.assignedHospital.phone} · ~{result.assignedHospital.estimatedArrival} min · {result.assignedHospital.distance} km
                </Typography>
              </Box>
            )}
            <Chip
              label={`${result.active}/${result.limit} urgences actives`}
              color={result.active >= result.limit ? 'error' : 'default'}
              size="small"
            />
          </Box>
        ) : (
          <>
            <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
              Cette demande sera traitée en priorité grâce à votre souscription. Maximum 4 urgences actives simultanées.
            </Alert>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Niveau de gravité
            </Typography>
            <ToggleButtonGroup
              value={severity}
              exclusive
              onChange={(_, v) => v && setSeverity(v)}
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="CRITICAL" sx={{ color: '#b71c1c', fontWeight: 600 }}>
                Critique
              </ToggleButton>
              <ToggleButton value="URGENT" sx={{ color: '#e65100', fontWeight: 600 }}>
                Urgent
              </ToggleButton>
              <ToggleButton value="SEMI_URGENT" sx={{ color: '#f57c00', fontWeight: 600 }}>
                Semi-urgent
              </ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Ambulance nécessaire ?
            </Typography>
            <ToggleButtonGroup
              value={needsAmbulance ? 'yes' : 'no'}
              exclusive
              onChange={(_, v) => v && setNeedsAmbulance(v === 'yes')}
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="yes" sx={{ fontWeight: 600 }}>
                <DirectionsCar sx={{ mr: 1 }} fontSize="small" /> Oui, ambulance
              </ToggleButton>
              <ToggleButton value="no" sx={{ fontWeight: 600 }}>
                Non, prise en charge sur place
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Description (optionnel)"
              fullWidth
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : douleur thoracique soudaine, malaise…"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Button
                variant={coords ? 'outlined' : 'contained'}
                color={coords ? 'success' : 'primary'}
                startIcon={locating ? <CircularProgress size={16} /> : <MyLocation />}
                onClick={detectLocation}
                disabled={locating}
              >
                {coords ? 'Position détectée' : 'Détecter ma position'}
              </Button>
              {coords && (
                <Typography variant="caption" color="text.secondary">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {result ? (
          <Button onClick={handleClose} variant="contained" fullWidth>
            Fermer
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={submitting}>
              Annuler
            </Button>
            <Button
              onClick={submit}
              variant="contained"
              color="error"
              disabled={submitting || !coords}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <LocalHospital />}
            >
              {submitting ? 'Envoi…' : 'Envoyer l\'urgence'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuickEmergencyDialog;
