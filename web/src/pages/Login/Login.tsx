import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert,
  CircularProgress, InputAdornment, IconButton, Divider, Link,
} from '@mui/material';
import {
  Email, Lock, Visibility, VisibilityOff,
  LocalHospital, CalendarMonth, Assignment, Shield, ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { ROUTES } from '../../config/constants';

const FEATURES = [
  { icon: <CalendarMonth />, title: 'Rendez-vous en ligne', desc: 'Planification intelligente entre patients et médecins' },
  { icon: <Assignment />, title: 'Dossiers médicaux', desc: 'Centralisation sécurisée de toutes les données de santé' },
  { icon: <Shield />, title: 'Données sécurisées', desc: 'Chiffrement bout-en-bout conforme aux normes médicales' },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login({ email, password });
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Panneau gauche ─────────────────────────────────────── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '55%',
        background: 'linear-gradient(155deg, #0F2D52 0%, #1E4D8C 55%, #0F3D6E 100%)',
        p: 6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* motif décoratif */}
        {[...Array(3)].map((_, i) => (
          <Box key={i} sx={{
            position: 'absolute',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.06)',
            width: 300 + i * 180,
            height: 300 + i * 180,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
        ))}

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '10px',
            bgcolor: '#00A896', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LocalHospital sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1 }}>MediRoute</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Plateforme médicale</Typography>
          </Box>
        </Box>

        {/* Contenu central */}
        <Box sx={{ zIndex: 1 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800, mb: 2, lineHeight: 1.15, fontSize: { md: '2rem', lg: '2.6rem' } }}>
            La santé numérique<br />
            <Box component="span" sx={{ color: '#00A896' }}>au Sénégal</Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 5, fontSize: 15, lineHeight: 1.7, maxWidth: 420 }}>
            Gérez patients, médecins et hôpitaux depuis une seule interface sécurisée. Simple, rapide, fiable.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {FEATURES.map(f => (
              <Box key={f.title} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                  bgcolor: 'rgba(0,168,150,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {React.cloneElement(f.icon, { sx: { color: '#00A896', fontSize: 20 } })}
                </Box>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{f.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, mt: 0.3 }}>{f.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Stat footer */}
        <Box sx={{ display: 'flex', gap: 4, zIndex: 1 }}>
          {[['6+', 'Hôpitaux'], ['3', 'Rôles utilisateurs'], ['100%', 'Sécurisé']].map(([v, l]) => (
            <Box key={l}>
              <Typography sx={{ color: '#00A896', fontWeight: 800, fontSize: 20 }}>{v}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Panneau droit — formulaire ──────────────────────────── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#F4F6F9',
        p: { xs: 3, sm: 6 },
      }}>
        {/* Logo mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '9px', bgcolor: '#0F2D52', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LocalHospital sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F2D52' }}>MediRoute</Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F2D52', mb: 0.5 }}>Connexion</Typography>
          <Typography sx={{ color: '#64748B', mb: 4, fontSize: 14 }}>
            Accédez à votre espace personnel
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: 13 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75 }}>Adresse email</Typography>
              <TextField
                fullWidth size="small"
                placeholder="vous@exemple.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment>,
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Mot de passe</Typography>
              </Box>
              <TextField
                fullWidth size="small"
                placeholder="••••••••"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPwd(v => !v)} edge="end">
                        {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowForward />}
              sx={{ py: 1.4, mt: 0.5, fontSize: 15 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography sx={{ fontSize: 12, color: '#9CA3AF', px: 1 }}>ou</Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            color="error"
            size="large"
            onClick={() => navigate(ROUTES.EMERGENCY)}
            sx={{ borderRadius: 2, py: 1.3, fontWeight: 700, fontSize: 14 }}
          >
            🚨 Urgence médicale
          </Button>

          <Typography sx={{ textAlign: 'center', mt: 3.5, fontSize: 13, color: '#64748B' }}>
            Pas encore de compte ?{' '}
            <Link
              component="button"
              onClick={() => navigate(ROUTES.REGISTER)}
              sx={{ fontWeight: 700, color: '#0F2D52', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Créer un compte
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
