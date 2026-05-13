import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  CircularProgress, Alert, TextField, Divider, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Switch,
  FormControlLabel, LinearProgress,
} from '@mui/material';
import {
  CheckCircle, Star, CreditCard, Phone, Cancel,
  Refresh, VerifiedUser, AccessTime, CalendarMonth,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import subscriptionService, { Subscription, PAYMENT_METHODS } from '../../services/subscriptionService';
import authService from '../../services/authService';

// ── Features par plan ─────────────────────────────────────────────────────────
const PATIENT_FEATURES = [
  'Rendez-vous médicaux illimités',
  'Messagerie avec les médecins',
  'Ordonnances électroniques',
  'Dossier médical complet',
  'Résultats de laboratoire en ligne',
  'Accès téléconsultation',
  'Urgences médicales prioritaires',
];

const DOCTOR_FEATURES = [
  'Gestion de l\'agenda complet',
  'Messagerie patients illimitée',
  'Prescriptions électroniques',
  'Dossiers médicaux patients',
  'Téléconsultations vidéo',
  'Statistiques & rapports',
  'Gestion des disponibilités',
];

// ── Couleurs par méthode ──────────────────────────────────────────────────────
const METHOD_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  ORANGE_MONEY: { bg: '#FFF3E0', border: '#FF6600', text: '#E65100' },
  WAVE:         { bg: '#E3F2FD', border: '#1877F2', text: '#0D47A1' },
  CARD:         { bg: '#EEF3FF', border: '#0F2D52', text: '#0F2D52' },
  APPLE_PAY:    { bg: '#F5F5F5', border: '#000',    text: '#000' },
  GOOGLE_PAY:   { bg: '#E8F5E9', border: '#4285F4', text: '#1565C0' },
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

// ── Composant principal ───────────────────────────────────────────────────────
const SubscriptionTab: React.FC = () => {
  const user = authService.getCurrentUser();
  const role = (user as any)?.role?.toUpperCase();
  const isDoctor = role === 'DOCTOR';
  const planKey  = isDoctor ? 'DOCTOR' : 'PATIENT';
  const price    = isDoctor ? 15000 : 5000;
  const features = isDoctor ? DOCTOR_FEATURES : PATIENT_FEATURES;

  const [sub,       setSub]       = useState<Subscription | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);
  const [method,    setMethod]    = useState('ORANGE_MONEY');
  const [autoRenew, setAutoRenew] = useState(false);
  const [cancelDlg, setCancelDlg] = useState(false);

  // Champs selon la méthode
  const [phone,     setPhone]     = useState('');
  const [cardNum,   setCardNum]   = useState('');
  const [cardExp,   setCardExp]   = useState('');
  const [cardCvv,   setCardCvv]   = useState('');
  const [cardName,  setCardName]  = useState('');

  useEffect(() => { loadSub(); }, []);

  const loadSub = async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.getMySubscription();
      setSub(res.data);
    } catch {
      // pas de souscription
    } finally { setLoading(false); }
  };

  const handleSubscribe = async () => {
    // Validation minimale
    if (['ORANGE_MONEY', 'WAVE'].includes(method) && !phone) {
      toast.error('Veuillez saisir votre numéro de téléphone'); return;
    }
    if (method === 'CARD' && (!cardNum || !cardExp || !cardCvv || !cardName)) {
      toast.error('Veuillez remplir tous les champs de carte'); return;
    }

    setPaying(true);
    try {
      // Simulation : délai de 1.5s pour l'expérience de paiement
      await new Promise(r => setTimeout(r, 1500));

      const ref = method === 'ORANGE_MONEY' || method === 'WAVE'
        ? `TEL-${phone.replace(/\s/g, '')}`
        : method === 'CARD'
        ? `CARD-${cardNum.slice(-4)}`
        : `${method}-SIM`;

      const res = await subscriptionService.subscribe({ paymentMethod: method, paymentReference: ref, autoRenew });
      toast.success(`✅ Souscription activée — N° ${res.data.subscriptionNumber}`);
      loadSub();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Échec du paiement');
    } finally { setPaying(false); }
  };

  const handleCancel = async () => {
    try {
      await subscriptionService.cancel();
      toast.info('Souscription annulée. L\'accès reste actif jusqu\'à expiration.');
      setCancelDlg(false);
      loadSub();
    } catch { toast.error('Erreur'); }
  };

  if (loading) return <Box textAlign="center" py={10}><CircularProgress /></Box>;

  const isActive = sub?.isActive;
  const daysLeft = sub?.daysLeft ?? 0;
  const expiringSoon = daysLeft > 0 && daysLeft <= 30;

  // ── Vue : souscription ACTIVE ─────────────────────────────────────────────
  if (isActive && sub) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52', mb: 3 }}>
          Ma souscription
        </Typography>

        {/* Status card */}
        <Card elevation={0} sx={{
          border: `2px solid ${expiringSoon ? '#D97706' : '#16A34A'}`,
          borderRadius: 3, mb: 3,
          background: expiringSoon
            ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
            : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VerifiedUser sx={{ color: expiringSoon ? '#D97706' : '#16A34A', fontSize: 22 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: 17, color: expiringSoon ? '#92400E' : '#15803D' }}>
                    Souscription active — Plan {planKey === 'DOCTOR' ? 'Médecin' : 'Patient'}
                  </Typography>
                </Box>

                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1,
                  bgcolor: '#fff', borderRadius: 2, px: 2, py: 1, mb: 2,
                  border: '1px solid #E2E8F0',
                }}>
                  <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>N° de souscription :</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#0F2D52', fontFamily: 'monospace', letterSpacing: 1 }}>
                    {sub.subscriptionNumber}
                  </Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {[
                    { label: 'Date de début',    value: fmtDate(sub.startDate),  icon: <CalendarMonth sx={{ fontSize: 16 }} /> },
                    { label: 'Date d\'expiration', value: fmtDate(sub.endDate),  icon: <AccessTime sx={{ fontSize: 16 }} /> },
                    { label: 'Méthode de paiement', value: PAYMENT_METHODS.find(m => m.value === sub.paymentMethod)?.label || sub.paymentMethod, icon: <CreditCard sx={{ fontSize: 16 }} /> },
                    { label: 'Montant annuel',   value: `${sub.amount.toLocaleString('fr-FR')} FCFA`, icon: <Star sx={{ fontSize: 16 }} /> },
                  ].map(({ label, value, icon }) => (
                    <Grid item xs={6} sm={3} key={label}>
                      <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 1.5, border: '1px solid #E2E8F0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B', mb: 0.5 }}>
                          {icon}
                          <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                            {label}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Barre de progression */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: '#64748B' }}>Durée restante</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: expiringSoon ? '#D97706' : '#15803D' }}>
                      {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (daysLeft / 365) * 100)}
                    sx={{
                      height: 8, borderRadius: 4,
                      bgcolor: '#E2E8F0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: expiringSoon ? '#D97706' : '#16A34A',
                        borderRadius: 4,
                      },
                    }} />
                </Box>

                {expiringSoon && (
                  <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
                    Votre souscription expire dans <strong>{daysLeft} jours</strong>. Renouvelez dès maintenant.
                  </Alert>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<Refresh />} onClick={() => setSub(null)}
                sx={{ bgcolor: '#0F2D52' }}>
                Renouveler maintenant
              </Button>
              <Button variant="outlined" startIcon={<Cancel />} color="error"
                onClick={() => setCancelDlg(true)}>
                Annuler la souscription
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Features reminder */}
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, p: 3 }}>
          <Typography sx={{ fontWeight: 700, color: '#0F2D52', mb: 2 }}>
            Fonctionnalités incluses dans votre plan
          </Typography>
          <Grid container spacing={1}>
            {features.map((f) => (
              <Grid item xs={12} sm={6} key={f}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 16, color: '#16A34A' }} />
                  <Typography sx={{ fontSize: 13.5, color: '#374151' }}>{f}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Annulation dialog */}
        <Dialog open={cancelDlg} onClose={() => setCancelDlg(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, color: '#DC2626' }}>Annuler la souscription</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: 14 }}>
              Êtes-vous sûr de vouloir annuler ? Vous conserverez l'accès jusqu'au <strong>{fmtDate(sub.endDate)}</strong>, mais votre souscription ne sera pas renouvelée.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={() => setCancelDlg(false)} variant="outlined">Garder ma souscription</Button>
            <Button onClick={handleCancel} variant="contained" color="error">Confirmer l'annulation</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ── Vue : pas de souscription / expirée ──────────────────────────────────
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52', mb: 0.5 }}>
        Souscription MediRoute
      </Typography>
      <Typography sx={{ color: '#64748B', fontSize: 14, mb: 3 }}>
        Accédez à toutes les fonctionnalités de la plateforme avec un abonnement annuel.
      </Typography>

      {sub?.status === 'EXPIRED' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Votre souscription a expiré le <strong>{fmtDate(sub.endDate)}</strong>. Renouvelez pour retrouver l'accès complet.
        </Alert>
      )}
      {sub?.status === 'CANCELLED' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Votre souscription a été annulée. Souscrivez à nouveau pour accéder aux fonctionnalités.
        </Alert>
      )}

      <Grid container spacing={3} alignItems="flex-start">
        {/* Carte plan */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{
            border: '2px solid #0F2D52', borderRadius: 3,
            background: 'linear-gradient(160deg, #0F2D52 0%, #1E4D8C 100%)',
            color: '#fff', position: 'relative', overflow: 'hidden',
          }}>
            <Box sx={{
              position: 'absolute', top: -20, right: -20, width: 100, height: 100,
              borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)',
            }} />
            <CardContent sx={{ p: 3 }}>
              <Chip label="Votre plan" size="small"
                sx={{ bgcolor: '#00A896', color: '#fff', fontWeight: 700, mb: 2 }} />
              <Typography sx={{ fontSize: 22, fontWeight: 800, mb: 0.5 }}>
                Plan {planKey === 'DOCTOR' ? 'Médecin' : 'Patient'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 3 }}>
                <Typography sx={{ fontSize: 34, fontWeight: 900 }}>
                  {price.toLocaleString('fr-FR')}
                </Typography>
                <Typography sx={{ fontSize: 14, opacity: 0.7 }}>FCFA / an</Typography>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 2 }} />

              {features.map((f) => (
                <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircle sx={{ fontSize: 16, color: '#00A896' }} />
                  <Typography sx={{ fontSize: 13, opacity: 0.9 }}>{f}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Formulaire de paiement */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, p: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0F2D52', mb: 2 }}>
              Choisissez votre méthode de paiement
            </Typography>

            {/* Sélecteur méthode */}
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              {PAYMENT_METHODS.map((pm) => {
                const sel = method === pm.value;
                const ms = METHOD_STYLE[pm.value];
                return (
                  <Grid item xs={6} sm={4} key={pm.value}>
                    <Box onClick={() => setMethod(pm.value)} sx={{
                      border: `2px solid ${sel ? ms.border : '#E2E8F0'}`,
                      borderRadius: 2, p: 1.5, textAlign: 'center', cursor: 'pointer',
                      bgcolor: sel ? ms.bg : '#fff',
                      transition: 'all .15s',
                      '&:hover': { borderColor: ms.border, bgcolor: ms.bg },
                    }}>
                      <Typography sx={{ fontSize: 22, mb: 0.5 }}>{pm.icon}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? ms.text : '#475569' }}>
                        {pm.label}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Champs selon méthode */}
            {(method === 'ORANGE_MONEY' || method === 'WAVE') && (
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#374151', mb: 1.5, fontSize: 14 }}>
                  {method === 'ORANGE_MONEY' ? '🟠 Orange Money' : '🔵 Wave'} — Paiement par mobile money
                </Typography>
                <TextField fullWidth label="Numéro de téléphone *"
                  placeholder="Ex : 77 123 45 67 ou +221 77 123 45 67"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: '#94A3B8', fontSize: 20 }} /> }}
                  helperText="Un code de confirmation vous sera envoyé par SMS"
                  sx={{ mb: 2 }} />
                <Alert severity="info" sx={{ fontSize: 13 }}>
                  Après confirmation, vous recevrez un prompt {method === 'ORANGE_MONEY' ? 'Orange Money' : 'Wave'} sur votre téléphone pour valider le paiement de <strong>{price.toLocaleString('fr-FR')} FCFA</strong>.
                </Alert>
              </Box>
            )}

            {method === 'CARD' && (
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#374151', mb: 1.5, fontSize: 14 }}>
                  💳 Paiement par carte bancaire
                </Typography>
                <TextField fullWidth label="Nom du titulaire *"
                  value={cardName} onChange={e => setCardName(e.target.value)} sx={{ mb: 2 }} />
                <TextField fullWidth label="Numéro de carte *"
                  value={cardNum} onChange={e => setCardNum(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="1234 5678 9012 3456"
                  inputProps={{ maxLength: 16 }} sx={{ mb: 2 }} />
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Date d'expiration *" placeholder="MM/AA"
                      value={cardExp} onChange={e => setCardExp(e.target.value)} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="CVV *" placeholder="123"
                      value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputProps={{ maxLength: 4 }} type="password" />
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ fontSize: 13 }}>
                  Vos données de carte sont sécurisées et ne sont pas stockées sur nos serveurs.
                </Alert>
              </Box>
            )}

            {(method === 'APPLE_PAY' || method === 'GOOGLE_PAY') && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography sx={{ fontSize: 40, mb: 2 }}>
                  {method === 'APPLE_PAY' ? '🍎' : '🔴'}
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                  {method === 'APPLE_PAY' ? 'Apple Pay' : 'Google Pay'}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#64748B', mb: 2 }}>
                  Cliquez sur "Souscrire maintenant" pour ouvrir{' '}
                  {method === 'APPLE_PAY' ? 'Apple Pay' : 'Google Pay'} et confirmer le paiement de{' '}
                  <strong>{price.toLocaleString('fr-FR')} FCFA</strong>.
                </Typography>
                <Alert severity="info" sx={{ fontSize: 13 }}>
                  Vous serez redirigé vers {method === 'APPLE_PAY' ? 'Apple Pay' : 'Google Pay'} pour finaliser le paiement de façon sécurisée.
                </Alert>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Renouvellement auto */}
            <FormControlLabel
              control={<Switch checked={autoRenew} onChange={e => setAutoRenew(e.target.checked)} color="primary" />}
              label={
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Renouvellement automatique</Typography>
                  <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                    Votre souscription sera renouvelée automatiquement avant expiration
                  </Typography>
                </Box>
              }
              sx={{ mb: 2, alignItems: 'flex-start' }} />

            {/* Récapitulatif */}
            <Box sx={{
              bgcolor: '#F8FAFC', borderRadius: 2, p: 2, mb: 3,
              border: '1px solid #E2E8F0',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: 13, color: '#64748B' }}>
                  Plan {planKey === 'DOCTOR' ? 'Médecin' : 'Patient'} — 1 an
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {price.toLocaleString('fr-FR')} FCFA
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: '#64748B' }}>Méthode</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {PAYMENT_METHODS.find(m => m.value === method)?.label}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#0F2D52' }}>Total</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#0F2D52' }}>
                  {price.toLocaleString('fr-FR')} FCFA
                </Typography>
              </Box>
            </Box>

            <Button fullWidth variant="contained" size="large"
              onClick={handleSubscribe} disabled={paying}
              sx={{
                bgcolor: '#0F2D52', py: 1.5, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #1E4D8C 0%, #0F2D52 100%)',
                borderRadius: 2,
              }}>
              {paying ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={20} sx={{ color: '#fff' }} />
                  Traitement en cours…
                </Box>
              ) : (
                `Souscrire maintenant — ${price.toLocaleString('fr-FR')} FCFA`
              )}
            </Button>

            <Typography sx={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center', mt: 1.5 }}>
              Paiement sécurisé · Souscription valable 12 mois · Remboursement sous 7 jours si insatisfait
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// ── Bannière souscription (à afficher dans chaque dashboard si non abonné) ────
export const SubscriptionBanner: React.FC<{ onSubscribe: () => void }> = ({ onSubscribe }) => (
  <Paper elevation={0} sx={{
    border: '1px solid #FCA5A5', borderRadius: 2, p: 2, mb: 2.5,
    background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
    display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
  }}>
    <Star sx={{ color: '#DC2626', fontSize: 22 }} />
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#991B1B' }}>
        Souscription requise
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: '#7F1D1D' }}>
        Activez votre souscription annuelle pour accéder à toutes les fonctionnalités de MediRoute.
      </Typography>
    </Box>
    <Button variant="contained" size="small" onClick={onSubscribe}
      sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, whiteSpace: 'nowrap', borderRadius: 2 }}>
      S'abonner maintenant
    </Button>
  </Paper>
);

export default SubscriptionTab;
