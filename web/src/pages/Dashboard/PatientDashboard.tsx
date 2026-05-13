import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Avatar, MenuItem, Divider, Paper, IconButton, Menu,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
} from '@mui/material';
import {
  CalendarMonth, Assignment, Person, LocalHospital, Add,
  CheckCircle, Cancel, Pending, Warning, ExitToApp, MoreVert,
  ArrowForward, AccessTime, FiberManualRecord, Science, Receipt,
  Visibility, VisibilityOff, Save, Lock,
  Chat, Send, CardMembership, ChildCare,
} from '@mui/icons-material';
import SubscriptionTab, { SubscriptionBanner } from '../Subscription/SubscriptionTab';
import subscriptionService from '../../services/subscriptionService';
import DependentsTab from './tabs/DependentsTab';
import ChatbotWidget from '../../components/ChatbotWidget';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { ROUTES } from '../../config/constants';

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 0, icon: <CalendarMonth />,   label: 'Rendez-vous' },
  { id: 1, icon: <Assignment />,      label: 'Dossier médical' },
  { id: 2, icon: <Science />,         label: 'Résultats labo' },
  { id: 3, icon: <Receipt />,         label: 'Factures' },
  { id: 4, icon: <Chat />,            label: 'Messagerie' },
  { id: 5, icon: <ChildCare />,       label: 'Mes dépendants' },
  { id: 6, icon: <CardMembership />,  label: 'Souscription' },
  { id: 7, icon: <Person />,          label: 'Mon profil' },
];

const Sidebar: React.FC<{ tab: number; setTab: (n: number) => void }> = ({ tab, setTab }) => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  return (
    <Box sx={{
      width: 240, flexShrink: 0, bgcolor: '#0F2D52', display: 'flex',
      flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: '#00A896', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LocalHospital sx={{ color: '#fff', fontSize: 21 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>MediRoute</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Espace Patient</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      {/* Nav */}
      <Box sx={{ p: 1.5, flex: 1, mt: 1 }}>
        {NAV.map(n => (
          <Box
            key={n.id}
            onClick={() => setTab(n.id)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 2, py: 1.4, borderRadius: 2, cursor: 'pointer', mb: 0.5,
              bgcolor: tab === n.id ? 'rgba(0,168,150,0.18)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
              transition: 'background 0.15s',
            }}
          >
            {React.cloneElement(n.icon, {
              sx: { fontSize: 19, color: tab === n.id ? '#00A896' : 'rgba(255,255,255,0.5)' },
            })}
            <Typography sx={{ fontSize: 13.5, fontWeight: tab === n.id ? 600 : 400, color: tab === n.id ? '#fff' : 'rgba(255,255,255,0.55)' }}>
              {n.label}
            </Typography>
            {tab === n.id && (
              <Box sx={{ ml: 'auto', width: 4, height: 4, borderRadius: '50%', bgcolor: '#00A896' }} />
            )}
          </Box>
        ))}

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

        <Box
          onClick={() => navigate(ROUTES.EMERGENCY)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.4, borderRadius: 2, cursor: 'pointer',
            bgcolor: 'rgba(229,62,62,0.15)', '&:hover': { bgcolor: 'rgba(229,62,62,0.25)' },
          }}
        >
          <Warning sx={{ fontSize: 19, color: '#FC8181' }} />
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#FC8181' }}>Urgence médicale</Typography>
        </Box>
      </Box>

      {/* User footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#00A896', fontSize: 13, fontWeight: 700 }}>
            {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.profile?.firstName} {user?.profile?.lastName}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Patient</Typography>
          </Box>
          <IconButton size="small" onClick={() => { authService.logout(); navigate('/login'); }} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#FC8181' } }}>
            <ExitToApp sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

// ── Status chip ───────────────────────────────────────────────────────────────
const statusChip = (s: string) => {
  const m: Record<string, any> = {
    CONFIRMED: { label: 'Confirmé',   color: 'success', icon: <CheckCircle sx={{ fontSize: '14px !important' }} /> },
    PENDING:   { label: 'En attente', color: 'warning', icon: <Pending sx={{ fontSize: '14px !important' }} /> },
    CANCELLED: { label: 'Annulé',     color: 'error',   icon: <Cancel sx={{ fontSize: '14px !important' }} /> },
    COMPLETED: { label: 'Terminé',    color: 'default', icon: <CheckCircle sx={{ fontSize: '14px !important' }} /> },
  };
  const c = m[s] ?? { label: s, color: 'default', icon: null };
  return <Chip icon={c.icon} label={c.label} color={c.color} size="small" sx={{ fontWeight: 600 }} />;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode; onClick?: () => void }> = ({ label, value, color, icon, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      cursor: onClick ? 'pointer' : 'default', transition: 'all .18s',
      ...(onClick && { '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }),
    }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '18px !important' }}>
      <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.cloneElement(icon as React.ReactElement, { sx: { color: '#fff', fontSize: 24 } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0F2D52', lineHeight: 1 }}>{value}</Typography>
        <Typography sx={{ fontSize: 12.5, color: '#64748B', mt: 0.3 }}>{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── Rendez-vous ───────────────────────────────────────────────────────────────
const AppointmentsTab: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [bookDialog, setBookDialog] = useState(false);
  const [form, setForm] = useState({ doctorId: '', date: '', time: '09:00', reason: '', type: 'CONSULTATION' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    api.get('/appointments/patient').then(r => setAppointments(r.data.data)).finally(() => setLoading(false));
    api.get('/appointments/doctors/approved').then(r => setDoctors(r.data.data)).catch(() => {});
  }, []);

  const book = async () => {
    if (!form.doctorId || !form.date || !form.reason) return toast.error('Remplissez tous les champs');
    try {
      await api.post('/appointments', { ...form, appointmentDate: form.date, appointmentTime: form.time });
      toast.success('Rendez-vous demandé !');
      setBookDialog(false);
      setForm({ doctorId: '', date: '', time: '09:00', reason: '', type: 'CONSULTATION' });
      const r = await api.get('/appointments/patient');
      setAppointments(r.data.data);
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Erreur'); }
  };

  const cancel = async (id: string) => {
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(as => as.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a));
      toast.success('Rendez-vous annulé');
    } catch { toast.error('Erreur'); }
    setAnchorEl(null);
  };

  const upcoming = appointments.filter(a => !['CANCELLED', 'COMPLETED'].includes(a.status));
  const past = appointments.filter(a => ['CANCELLED', 'COMPLETED'].includes(a.status));

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Mes rendez-vous</Typography>
          <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{appointments.length} rendez-vous au total</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setBookDialog(true)} sx={{ borderRadius: 2 }}>
          Nouveau rendez-vous
        </Button>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="À venir" value={upcoming.length} color="#0F2D52" icon={<CalendarMonth />} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Confirmés" value={appointments.filter(a => a.status === 'CONFIRMED').length} color="#00A896" icon={<CheckCircle />} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Total" value={appointments.length} color="#4A5568" icon={<Assignment />} />
        </Grid>
      </Grid>

      {/* Table à venir */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#0F2D52' }}>Prochains rendez-vous</Typography>
          <Chip label={upcoming.length} size="small" sx={{ bgcolor: '#EEF3FF', color: '#0F2D52', fontWeight: 700 }} />
        </Box>
        {upcoming.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CalendarMonth sx={{ fontSize: 40, color: '#CBD5E0', mb: 1 }} />
            <Typography sx={{ color: '#9CA3AF', fontSize: 13.5 }}>Aucun rendez-vous à venir</Typography>
            <Button size="small" sx={{ mt: 1.5, color: '#0F2D52', fontWeight: 600 }} onClick={() => setBookDialog(true)}>
              Prendre un rendez-vous <ArrowForward sx={{ fontSize: 14, ml: 0.5 }} />
            </Button>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Médecin</TableCell>
                <TableCell>Date & Heure</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcoming.map(a => (
                <TableRow key={a.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 12, fontWeight: 700 }}>
                        {a.doctor?.firstName?.[0]}{a.doctor?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>{a.doctor?.doctorInfo?.specialization}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 500 }}>{new Date(a.appointmentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                      <AccessTime sx={{ fontSize: 12, color: '#9CA3AF' }} />
                      <Typography sx={{ fontSize: 12, color: '#64748B' }}>{a.appointmentTime}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: 13, color: '#64748B' }}>{a.type}</Typography></TableCell>
                  <TableCell>{statusChip(a.status)}</TableCell>
                  <TableCell align="right">
                    {a.status !== 'CANCELLED' && (
                      <>
                        <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedId(a.id); }}>
                          <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && selectedId === a.id} onClose={() => setAnchorEl(null)}>
                          <MenuItem onClick={() => cancel(a.id)} sx={{ color: '#E53E3E', fontSize: 13.5 }}>
                            <Cancel sx={{ fontSize: 17, mr: 1 }} /> Annuler
                          </MenuItem>
                        </Menu>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Historique */}
      {past.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#64748B' }}>Historique</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Médecin</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {past.map(a => (
                <TableRow key={a.id} sx={{ opacity: 0.7 }}>
                  <TableCell>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 500 }}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{new Date(a.appointmentDate).toLocaleDateString('fr-FR')}</Typography>
                  </TableCell>
                  <TableCell>{statusChip(a.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Dialog prise de RDV */}
      <Dialog open={bookDialog} onClose={() => setBookDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52', pb: 1 }}>Nouveau rendez-vous</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Médecin *</Typography>
              <TextField fullWidth size="small" select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                <MenuItem value=""><em>Choisir un médecin…</em></MenuItem>
                {doctors.map((d: any) => (
                  <MenuItem key={d.userId} value={d.userId}>
                    Dr. {d.firstName} {d.lastName} — {d.doctorInfo?.specialization}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Date *</Typography>
              <TextField fullWidth size="small" type="date" value={form.date} InputLabelProps={{ shrink: true }}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Heure *</Typography>
              <TextField fullWidth size="small" type="time" value={form.time} InputLabelProps={{ shrink: true }}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Type</Typography>
              <TextField fullWidth size="small" select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {[['CONSULTATION', 'Consultation'], ['FOLLOW_UP', 'Suivi'], ['ROUTINE_CHECKUP', 'Bilan routine'], ['TELECONSULTATION', 'Téléconsultation (vidéo)']].map(([v, l]) => (
                  <MenuItem key={v} value={v}>{l}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Motif *</Typography>
              <TextField fullWidth size="small" multiline rows={3} value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Décrivez votre motif de consultation…" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setBookDialog(false)} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={book}>Confirmer le rendez-vous</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Dossier médical ───────────────────────────────────────────────────────────
const MedicalRecordsTab: React.FC = () => {
  const user = authService.getCurrentUser();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    api.get(`/medical-records/patient/${user.userId}`).then(r => setRecords(r.data.data)).finally(() => setLoading(false));
  }, [user?.userId]);

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Dossier médical</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{records.length} entrée(s)</Typography>
      </Box>

      {records.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 8, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 48, color: '#CBD5E0', mb: 1.5 }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucun dossier médical enregistré</Typography>
          <Typography sx={{ color: '#CBD5E0', fontSize: 12.5, mt: 0.5 }}>Vos médecins pourront y ajouter des informations</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {records.map(r => (
            <Paper key={r.id} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <FiberManualRecord sx={{ fontSize: 10, color: '#00A896' }} />
                <Chip label={r.recordType} size="small" sx={{ bgcolor: '#EEF3FF', color: '#0F2D52', fontWeight: 700, fontSize: 11 }} />
                <Typography sx={{ fontSize: 12.5, color: '#9CA3AF', ml: 'auto' }}>
                  {new Date(r.recordDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
              <Box sx={{ px: 3, py: 2 }}>
                {r.diagnosis && (
                  <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnostic</Typography>
                    <Typography sx={{ fontSize: 14, color: '#1A202C', mt: 0.3 }}>{r.diagnosis}</Typography>
                  </Box>
                )}
                {r.symptoms && (
                  <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Symptômes</Typography>
                    <Typography sx={{ fontSize: 14, color: '#1A202C', mt: 0.3 }}>{r.symptoms}</Typography>
                  </Box>
                )}
                {r.notes && (
                  <Box>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</Typography>
                    <Typography sx={{ fontSize: 13.5, color: '#4A5568', mt: 0.3 }}>{r.notes}</Typography>
                  </Box>
                )}
                {r.followUpRequired && (
                  <Box sx={{ mt: 1.5 }}>
                    <Chip
                      icon={<Warning sx={{ fontSize: '14px !important' }} />}
                      label={`Suivi requis${r.followUpDate ? ' — ' + new Date(r.followUpDate).toLocaleDateString('fr-FR') : ''}`}
                      color="warning" size="small" sx={{ fontWeight: 600 }}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ── Résultats labo ────────────────────────────────────────────────────────────
const LabResultsTab: React.FC = () => {
  const user = authService.getCurrentUser();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    api.get(`/lab-results/patient/${user.userId}`).then(r => setResults(r.data.data)).finally(() => setLoading(false));
  }, [user?.userId]);

  const statusColor = (s: string): any => ({ NORMAL: 'success', ABNORMAL: 'warning', CRITICAL: 'error', PENDING: 'default' }[s] ?? 'default');
  const statusLabel = (s: string) => ({ NORMAL: 'Normal', ABNORMAL: 'Anormal', CRITICAL: 'Critique', PENDING: 'En attente' }[s] ?? s);

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Résultats de laboratoire</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{results.length} résultat(s)</Typography>
      </Box>

      {results.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 8, textAlign: 'center' }}>
          <Science sx={{ fontSize: 48, color: '#CBD5E0', mb: 1.5 }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucun résultat de laboratoire</Typography>
          <Typography sx={{ color: '#CBD5E0', fontSize: 12.5, mt: 0.5 }}>Vos résultats seront ajoutés par votre médecin</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {results.map(r => (
            <Paper key={r.id} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Science sx={{ fontSize: 18, color: '#00A896' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F2D52' }}>{r.testName}</Typography>
                  {r.testCode && <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>{r.testCode}</Typography>}
                </Box>
                <Chip label={statusLabel(r.status)} color={statusColor(r.status)} size="small" sx={{ fontWeight: 600 }} />
                <Typography sx={{ fontSize: 12, color: '#9CA3AF', ml: 1 }}>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</Typography>
              </Box>
              <Box sx={{ px: 3, py: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.result && (
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.3 }}>Résultat</Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#0F2D52' }}>
                      {r.result}
                      {r.unit && <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: '#64748B', ml: 0.5 }}>{r.unit}</Typography>}
                    </Typography>
                  </Box>
                )}
                {r.referenceRange && (
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.3 }}>Valeurs normales</Typography>
                    <Typography sx={{ fontSize: 14, color: '#4A5568' }}>{r.referenceRange}</Typography>
                  </Box>
                )}
              </Box>
              {r.notes && (
                <Box sx={{ px: 3, pb: 2 }}>
                  <Typography sx={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>{r.notes}</Typography>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ── Factures ──────────────────────────────────────────────────────────────────
const InvoicesTab: React.FC = () => {
  const user = authService.getCurrentUser();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    api.get(`/invoices/patient/${user.userId}`).then(r => setInvoices(r.data.data)).finally(() => setLoading(false));
  }, [user?.userId]);

  const statusColor = (s: string): any => ({ PAID: 'success', PENDING: 'warning', OVERDUE: 'error', CANCELLED: 'default' }[s] ?? 'default');
  const statusLabel = (s: string) => ({ PAID: 'Payée', PENDING: 'En attente', OVERDUE: 'En retard', CANCELLED: 'Annulée' }[s] ?? s);

  const total = invoices.reduce((acc, inv) => acc + (inv.totalAmount ?? 0), 0);
  const unpaid = invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').reduce((acc, inv) => acc + (inv.totalAmount ?? 0), 0);

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Mes factures</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{invoices.length} facture(s)</Typography>
      </Box>

      {/* Summary cards */}
      {invoices.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: '18px !important' }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.5 }}>Total facturé</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F2D52' }}>{total.toLocaleString('fr-FR')} <Typography component="span" sx={{ fontSize: 14, fontWeight: 400, color: '#64748B' }}>FCFA</Typography></Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', bgcolor: unpaid > 0 ? '#FFF5F5' : '#F0FFF4' }}>
              <CardContent sx={{ p: '18px !important' }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.5 }}>Solde dû</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: unpaid > 0 ? '#E53E3E' : '#38A169' }}>{unpaid.toLocaleString('fr-FR')} <Typography component="span" sx={{ fontSize: 14, fontWeight: 400, color: '#64748B' }}>FCFA</Typography></Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {invoices.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 8, textAlign: 'center' }}>
          <Receipt sx={{ fontSize: 48, color: '#CBD5E0', mb: 1.5 }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucune facture</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>N° Facture</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0F2D52', fontFamily: 'monospace' }}>{inv.invoiceNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{new Date(inv.issueDate ?? inv.createdAt).toLocaleDateString('fr-FR')}</Typography>
                    {inv.dueDate && (
                      <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>Échéance : {new Date(inv.dueDate).toLocaleDateString('fr-FR')}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: '#4A5568', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.description ?? (inv.items?.length ? `${inv.items.length} prestation(s)` : '—')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0F2D52' }}>{(inv.totalAmount ?? 0).toLocaleString('fr-FR')} FCFA</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={statusLabel(inv.status)} color={statusColor(inv.status)} size="small" sx={{ fontWeight: 600 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

// ── Label helper ──────────────────────────────────────────────────────────────
const FL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>{children}</Typography>
);

// ── Profil éditable ───────────────────────────────────────────────────────────
const ProfileTab: React.FC = () => {
  const user = authService.getCurrentUser();

  const [prof, setProf] = useState({
    firstName: user?.profile?.firstName ?? '',
    lastName:  user?.profile?.lastName  ?? '',
    phone:     user?.profile?.phone     ?? '',
    city:      user?.profile?.city      ?? '',
    region:    user?.profile?.region    ?? '',
  });

  const pi = (user as any)?.patientInfo ?? {};
  const [medical, setMedical] = useState({
    bloodGroup:                   pi.bloodGroup                   ?? '',
    allergies:                    pi.allergies                    ?? '',
    chronicConditions:            pi.chronicConditions            ?? '',
    emergencyContactName:         pi.emergencyContactName         ?? '',
    emergencyContactPhone:        pi.emergencyContactPhone        ?? '',
    emergencyContactRelationship: pi.emergencyContactRelationship ?? '',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({ profile: prof, patientInfo: medical });
      toast.success('Profil mis à jour');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Erreur lors de la mise à jour');
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pw.next !== pw.confirm) return void toast.error('Les mots de passe ne correspondent pas');
    if (pw.next.length < 8)    return void toast.error('Minimum 8 caractères requis');
    setSavingPw(true);
    try {
      await authService.changePassword(pw.current, pw.next);
      toast.success('Mot de passe mis à jour');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Mot de passe actuel incorrect');
    } finally { setSavingPw(false); }
  };

  const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 18, color: '#00A896' } })}
      <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: '#0F2D52' }}>{title}</Typography>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52', mb: 3 }}>Mon profil</Typography>

      {/* ── Informations personnelles ── */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <SectionHeader icon={<Person />} title="Informations personnelles" />
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FL>Prénom</FL>
              <TextField fullWidth size="small" value={prof.firstName}
                onChange={e => setProf(p => ({ ...p, firstName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FL>Nom</FL>
              <TextField fullWidth size="small" value={prof.lastName}
                onChange={e => setProf(p => ({ ...p, lastName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FL>Téléphone</FL>
              <TextField fullWidth size="small" value={prof.phone}
                onChange={e => setProf(p => ({ ...p, phone: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FL>Ville</FL>
              <TextField fullWidth size="small" value={prof.city}
                onChange={e => setProf(p => ({ ...p, city: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FL>Région</FL>
              <TextField fullWidth size="small" value={prof.region}
                onChange={e => setProf(p => ({ ...p, region: e.target.value }))} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={saving ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : <Save />}
              onClick={saveProfile} disabled={saving} sx={{ borderRadius: 2 }}>
              Enregistrer
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Informations médicales ── */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <SectionHeader icon={<Assignment />} title="Informations médicales" />
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <FL>Groupe sanguin</FL>
              <TextField fullWidth size="small" select value={medical.bloodGroup}
                onChange={e => setMedical(m => ({ ...m, bloodGroup: e.target.value }))}>
                <MenuItem value=""><em>Non renseigné</em></MenuItem>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                  <MenuItem key={g} value={g}>{g}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}>
              <FL>Allergies</FL>
              <TextField fullWidth size="small" value={medical.allergies}
                onChange={e => setMedical(m => ({ ...m, allergies: e.target.value }))}
                placeholder="ex. Pénicilline, Arachides…" />
            </Grid>
            <Grid item xs={12}>
              <FL>Maladies chroniques</FL>
              <TextField fullWidth size="small" value={medical.chronicConditions}
                onChange={e => setMedical(m => ({ ...m, chronicConditions: e.target.value }))}
                placeholder="ex. Diabète type 2, HTA…" />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', px: 1 }}>
                  Contact d'urgence
                </Typography>
              </Divider>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FL>Nom</FL>
                  <TextField fullWidth size="small" value={medical.emergencyContactName}
                    onChange={e => setMedical(m => ({ ...m, emergencyContactName: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FL>Téléphone</FL>
                  <TextField fullWidth size="small" value={medical.emergencyContactPhone}
                    onChange={e => setMedical(m => ({ ...m, emergencyContactPhone: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FL>Relation</FL>
                  <TextField fullWidth size="small" value={medical.emergencyContactRelationship}
                    onChange={e => setMedical(m => ({ ...m, emergencyContactRelationship: e.target.value }))}
                    placeholder="ex. Époux/Épouse, Parent…" />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={saving ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : <Save />}
              onClick={saveProfile} disabled={saving} sx={{ borderRadius: 2 }}>
              Enregistrer
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Mot de passe ── */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
        <SectionHeader icon={<Lock />} title="Changer le mot de passe" />
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2.5} sx={{ maxWidth: 500 }}>
            <Grid item xs={12}>
              <FL>Mot de passe actuel</FL>
              <TextField fullWidth size="small"
                type={showPw.current ? 'text' : 'password'}
                value={pw.current}
                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}>
                      {showPw.current ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )}} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FL>Nouveau mot de passe</FL>
              <TextField fullWidth size="small"
                type={showPw.next ? 'text' : 'password'}
                value={pw.next}
                onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                error={pw.next.length > 0 && pw.next.length < 8}
                helperText={pw.next.length > 0 && pw.next.length < 8 ? 'Minimum 8 caractères' : ''}
                InputProps={{ endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw(s => ({ ...s, next: !s.next }))}>
                      {showPw.next ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )}} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FL>Confirmer le nouveau mot de passe</FL>
              <TextField fullWidth size="small"
                type="password"
                value={pw.confirm}
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                error={pw.confirm.length > 0 && pw.next !== pw.confirm}
                helperText={pw.confirm.length > 0 && pw.next !== pw.confirm ? 'Les mots de passe ne correspondent pas' : ''} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained"
              onClick={savePassword}
              disabled={savingPw || !pw.current || pw.next.length < 8 || pw.next !== pw.confirm}
              startIcon={savingPw ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : <Lock />}
              sx={{ borderRadius: 2 }}>
              Changer le mot de passe
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

// ── Messagerie ────────────────────────────────────────────────────────────────
const MessagingTab: React.FC = () => {
  const me = authService.getCurrentUser();
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newDialog, setNewDialog] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const pollRef   = React.useRef<any>(null);

  const loadConversations = React.useCallback(() => {
    api.get('/messages/conversations')
      .then(r => setConversations(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadConversations();
    api.get('/messages/contacts').then(r => setContacts(r.data.data)).catch(() => {});
  }, [loadConversations]);

  const openThread = React.useCallback((p: any) => {
    setPartner(p);
    clearInterval(pollRef.current);
    const fetch = () =>
      api.get(`/messages/${p.id}`).then(r => {
        setMessages(r.data.data);
        loadConversations();
      }).catch(() => {});
    fetch();
    pollRef.current = setInterval(fetch, 5000);
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const send = async () => {
    if (!text.trim() || !partner) return;
    setSending(true);
    try {
      await api.post('/messages', { receiverId: partner.id, content: text.trim() });
      setText('');
      const r = await api.get(`/messages/${partner.id}`);
      setMessages(r.data.data);
      loadConversations();
    } catch { toast.error("Erreur lors de l'envoi"); }
    finally { setSending(false); }
  };

  const initConversation = (contact: any) => {
    setNewDialog(false);
    setPartner(contact);
    openThread(contact);
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toDateString() === new Date().toDateString()
      ? "Aujourd'hui"
      : dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Messagerie</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>Communication sécurisée avec vos médecins</Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', display: 'flex', height: 'calc(100vh - 220px)', minHeight: 480 }}>
        {/* Left panel */}
        <Box sx={{ width: 300, flexShrink: 0, borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F8FAFC' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#0F2D52' }}>Conversations</Typography>
            <IconButton size="small" onClick={() => setNewDialog(true)} sx={{ bgcolor: '#00A896', color: '#fff', width: 28, height: 28, '&:hover': { bgcolor: '#008f7e' } }}>
              <Add sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box textAlign="center" py={4}><CircularProgress size={24} /></Box>
            ) : conversations.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Chat sx={{ fontSize: 36, color: '#CBD5E0', mb: 1 }} />
                <Typography sx={{ fontSize: 12.5, color: '#9CA3AF' }}>Aucune conversation</Typography>
                <Typography sx={{ fontSize: 11.5, color: '#CBD5E0' }}>Cliquez + pour commencer</Typography>
              </Box>
            ) : conversations.map((c: any) => (
              <Box key={c.partner.id} onClick={() => openThread(c.partner)}
                sx={{
                  px: 2, py: 1.5, cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                  bgcolor: partner?.id === c.partner.id ? '#EFF6FF' : 'transparent',
                  '&:hover': { bgcolor: partner?.id === c.partner.id ? '#EFF6FF' : '#F8FAFC' },
                }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar sx={{ width: 38, height: 38, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 13, fontWeight: 700 }}>
                      {c.partner.firstName?.[0]}{c.partner.lastName?.[0]}
                    </Avatar>
                    {c.unreadCount > 0 && (
                      <Box sx={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', bgcolor: '#E53E3E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ fontSize: 9, color: '#fff', fontWeight: 800 }}>{c.unreadCount}</Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: c.unreadCount > 0 ? 700 : 600, color: '#0F2D52', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                        Dr. {c.partner.firstName} {c.partner.lastName}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#9CA3AF', flexShrink: 0 }}>
                        {formatDate(c.lastMessage.createdAt)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 11.5, color: c.unreadCount > 0 ? '#374151' : '#9CA3AF', fontWeight: c.unreadCount > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.lastMessage.senderId === me?.userId ? 'Vous : ' : ''}{c.lastMessage.content}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right: chat */}
        {!partner ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Chat sx={{ fontSize: 56, color: '#CBD5E0', mb: 2 }} />
            <Typography sx={{ fontSize: 15, color: '#9CA3AF', fontWeight: 500 }}>Sélectionnez une conversation</Typography>
            <Typography sx={{ fontSize: 13, color: '#CBD5E0', mt: 0.5 }}>ou commencez-en une nouvelle avec le bouton +</Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 12, fontWeight: 700 }}>
                {partner.firstName?.[0]}{partner.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F2D52' }}>
                  Dr. {partner.firstName} {partner.lastName}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>Médecin</Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.length === 0 && (
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>Aucun message — commencez la conversation !</Typography>
                </Box>
              )}
              {messages.map((m: any, i: number) => {
                const isMine = m.senderId === me?.userId;
                const showDate = i === 0 || formatDate(messages[i-1].createdAt) !== formatDate(m.createdAt);
                return (
                  <Box key={m.id}>
                    {showDate && (
                      <Box sx={{ textAlign: 'center', my: 1 }}>
                        <Chip label={formatDate(m.createdAt)} size="small" sx={{ bgcolor: '#E2E8F0', color: '#64748B', fontSize: 11 }} />
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{
                        maxWidth: '70%', px: 2, py: 1.25,
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        bgcolor: isMine ? '#0F2D52' : '#F1F5F9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}>
                        <Typography sx={{ fontSize: 13.5, color: isMine ? '#fff' : '#1A202C', lineHeight: 1.5 }}>{m.content}</Typography>
                        <Typography sx={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.55)' : '#9CA3AF', mt: 0.25, textAlign: 'right' }}>
                          {formatTime(m.createdAt)}{isMine && (m.isRead ? ' · Lu' : ' · Envoyé')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              <div ref={bottomRef} />
            </Box>

            <Box sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 1.5, alignItems: 'flex-end', bgcolor: '#F8FAFC' }}>
              <TextField
                fullWidth multiline maxRows={4} size="small"
                placeholder="Écrivez votre message…"
                value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
              />
              <IconButton onClick={send} disabled={sending || !text.trim()}
                sx={{ bgcolor: '#00A896', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: '#008f7e' }, '&.Mui-disabled': { bgcolor: '#E2E8F0' } }}>
                {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Send sx={{ fontSize: 19 }} />}
              </IconButton>
            </Box>
          </Box>
        )}
      </Paper>

      {/* New conversation dialog */}
      <Dialog open={newDialog} onClose={() => setNewDialog(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>Nouvelle conversation</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: '#64748B', mb: 2 }}>Choisissez un médecin avec qui vous avez eu un rendez-vous</Typography>
          {contacts.length === 0 ? (
            <Typography sx={{ fontSize: 13.5, color: '#9CA3AF', textAlign: 'center', py: 2 }}>Aucun médecin disponible</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 300 }}>
              {contacts.map((c: any) => (
                <Box key={c.id} onClick={() => initConversation(c)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderRadius: 2, cursor: 'pointer', border: '1px solid #E2E8F0', '&:hover': { bgcolor: '#F8FAFC', borderColor: '#00A896' } }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 12, fontWeight: 700 }}>
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Dr. {c.firstName} {c.lastName}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>Médecin</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewDialog(false)} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Dashboard principal ───────────────────────────────────────────────────────
const PatientDashboard: React.FC = () => {
  const [tab, setTab]           = useState(0);
  const [hasActiveSub, setHasActiveSub] = useState<boolean | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    subscriptionService.getMySubscription()
      .then(res => setHasActiveSub(res.data?.isActive ?? false))
      .catch(() => setHasActiveSub(false));
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F4F6F9' }}>
      <Sidebar tab={tab} setTab={setTab} />
      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {hasActiveSub === false && tab !== 6 && (
          <SubscriptionBanner onSubscribe={() => setTab(6)} />
        )}
        {tab === 0 && <AppointmentsTab />}
        {tab === 1 && <MedicalRecordsTab />}
        {tab === 2 && <LabResultsTab />}
        {tab === 3 && <InvoicesTab />}
        {tab === 4 && <MessagingTab />}
        {tab === 5 && <DependentsTab />}
        {tab === 6 && <SubscriptionTab />}
        {tab === 7 && <ProfileTab />}
      </Box>
      <ChatbotWidget />
    </Box>
  );
};

export default PatientDashboard;
