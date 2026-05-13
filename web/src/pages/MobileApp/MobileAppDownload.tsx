import React from 'react';
import {
  Box, Typography, Paper, Button, Grid, Chip, Divider, IconButton, Container,
} from '@mui/material';
import {
  Android, Apple, QrCode2, Download, CheckCircle, ArrowBack,
  Smartphone, NotificationsActive, OfflineBolt, Speed,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 🔗 Remplacer par votre vrai lien EAS Build ou lien direct du fichier APK
const APK_DOWNLOAD_URL  = 'https://expo.dev/accounts/kingbill01/projects/mediroute/builds';
const IOS_TESTFLIGHT_URL = 'https://testflight.apple.com/join/mediroute';

const FEATURES = [
  { icon: <NotificationsActive />, title: 'Notifications push',  desc: 'Alertes rendez-vous, messages médecin, urgences' },
  { icon: <OfflineBolt />,         title: 'Mode hors-ligne',     desc: 'Consultez vos données sans connexion' },
  { icon: <Speed />,                title: 'Plus rapide',         desc: 'Optimisé pour mobile et tablette' },
  { icon: <Smartphone />,           title: 'Géolocalisation',     desc: 'Hôpitaux les plus proches en urgence' },
];

const MobileAppDownload: React.FC = () => {
  const navigate = useNavigate();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(APK_DOWNLOAD_URL)}&color=0F2D52`;

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2D52 0%, #00A896 100%)',
      py: { xs: 3, md: 6 },
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>
            Application Mobile MediRoute
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Hero */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: '#fff' }}>
              <Chip label="📱 Disponible maintenant" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', mb: 2, fontWeight: 600 }} />
              <Typography variant="h3" fontWeight={800} sx={{ mb: 2, lineHeight: 1.2, fontSize: { xs: 28, md: 40 } }}>
                MediRoute dans votre poche
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400, fontSize: { xs: 15, md: 18 } }}>
                Prenez rendez-vous, suivez votre santé et accédez aux urgences depuis votre smartphone.
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                {FEATURES.map(f => (
                  <Grid item xs={12} sm={6} key={f.title}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {React.cloneElement(f.icon, { sx: { color: '#fff', fontSize: 22 } })}
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{f.title}</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{f.desc}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Boutons store */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained" size="large" startIcon={<Android sx={{ fontSize: 26 }} />}
                  href={APK_DOWNLOAD_URL} target="_blank"
                  sx={{
                    bgcolor: '#3DDC84', color: '#fff', px: 3,
                    '&:hover': { bgcolor: '#2BB870' },
                    textTransform: 'none', fontWeight: 700,
                  }}>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.85, lineHeight: 1 }}>Télécharger pour</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>Android (APK)</Typography>
                  </Box>
                </Button>

                <Button
                  variant="contained" size="large" startIcon={<Apple sx={{ fontSize: 26 }} />}
                  href={IOS_TESTFLIGHT_URL} target="_blank"
                  sx={{
                    bgcolor: '#000', color: '#fff', px: 3,
                    '&:hover': { bgcolor: '#333' },
                    textTransform: 'none', fontWeight: 700,
                  }}>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.85, lineHeight: 1 }}>Disponible sur</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>iOS (TestFlight)</Typography>
                  </Box>
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* QR Code Card */}
          <Grid item xs={12} md={6}>
            <Paper sx={{
              p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: '#0F2D52', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode2 sx={{ color: '#fff', fontSize: 32 }} />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={700} color="#0F2D52" mb={1}>
                Scanner pour télécharger
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Pointez l'appareil photo de votre téléphone sur le QR code
              </Typography>

              <Box sx={{
                display: 'inline-block', p: 2, bgcolor: '#fff', borderRadius: 3,
                border: '1px solid #e0e0e0', mb: 3,
              }}>
                <img src={qrCodeUrl} alt="QR Code MediRoute APK"
                  style={{ display: 'block', width: 240, height: 240 }} />
              </Box>

              <Divider sx={{ my: 2 }}>
                <Chip label="OU" size="small" />
              </Divider>

              <Button
                variant="outlined" fullWidth size="large" startIcon={<Download />}
                href={APK_DOWNLOAD_URL} target="_blank"
                sx={{
                  borderColor: '#00A896', color: '#00A896', borderWidth: 2, py: 1.5,
                  '&:hover': { borderColor: '#008f80', borderWidth: 2, bgcolor: '#e8f5e9' },
                  fontWeight: 700,
                }}>
                Télécharger l'APK directement
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mt: 2 }}>
                <CheckCircle sx={{ color: '#2e7d32', fontSize: 16 }} />
                <Typography variant="caption" color="text.secondary">100% gratuit · Aucune publicité</Typography>
              </Box>
            </Paper>

            {/* Instructions installation Android */}
            <Paper sx={{ p: 3, mt: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.95)' }}>
              <Typography variant="subtitle2" fontWeight={700} color="#0F2D52" mb={1.5}>
                📲 Instructions d'installation Android
              </Typography>
              {[
                'Téléchargez le fichier APK',
                'Ouvrez le fichier téléchargé',
                'Si demandé, autorisez l\'installation depuis les sources inconnues',
                'L\'application MediRoute s\'installe automatiquement',
              ].map((step, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 0.8 }}>
                  <Chip label={i + 1} size="small" sx={{ bgcolor: '#00A896', color: '#fff', fontWeight: 700, minWidth: 24, height: 22 }} />
                  <Typography variant="body2">{step}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 6, color: 'rgba(255,255,255,0.7)' }}>
          <Typography variant="caption">
            Version 1.0 · Compatible Android 8+ et iOS 14+ · Mis à jour automatiquement
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default MobileAppDownload;
