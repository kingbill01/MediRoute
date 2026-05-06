import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Avatar, MenuItem, Divider, Paper, IconButton, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tab,
} from '@mui/material';
import {
  CalendarMonth, People, Person, LocalHospital, Add,
  CheckCircle, Pending, Assignment, ExitToApp,
  AccessTime, FiberManualRecord, ArrowForward,
  MonitorHeart, Science, Videocam, OpenInNew, ContentCopy,
  Visibility, VisibilityOff, Save, Lock,
  Chat, Send, CardMembership,
} from '@mui/icons-material';
import SubscriptionTab, { SubscriptionBanner } from '../Subscription/SubscriptionTab';
import ChatbotWidget from '../../components/ChatbotWidget';
import subscriptionService from '../../services/subscriptionService';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import { toast } from 'react-toastify';

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 0, icon: <CalendarMonth />,  label: 'Rendez-vous' },
  { id: 1, icon: <People />,         label: 'DPI Patients' },
  { id: 2, icon: <Videocam />,       label: 'Télémédecine' },
  { id: 3, icon: <Chat />,           label: 'Messagerie' },
  { id: 4, icon: <CardMembership />, label: 'Souscription' },
  { id: 5, icon: <Person />,         label: 'Mon profil' },
];

const Sidebar: React.FC<{ tab: number; setTab: (n: number) => void }> = ({ tab, setTab }) => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  return (
    <Box sx={{
      width: 240, flexShrink: 0, bgcolor: '#0F2D52', display: 'flex',
      flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: '#00A896', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LocalHospital sx={{ color: '#fff', fontSize: 21 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>MediRoute</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Espace Médecin</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      <Box sx={{ p: 1.5, flex: 1, mt: 1 }}>
        {NAV.map(n => (
          <Box key={n.id} onClick={() => setTab(n.id)} sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.4, borderRadius: 2, cursor: 'pointer', mb: 0.5,
            bgcolor: tab === n.id ? 'rgba(0,168,150,0.18)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
            transition: 'background 0.15s',
          }}>
            {React.cloneElement(n.icon, {
              sx: { fontSize: 19, color: tab === n.id ? '#00A896' : 'rgba(255,255,255,0.5)' },
            })}
            <Typography sx={{ fontSize: 13.5, fontWeight: tab === n.id ? 600 : 400, color: tab === n.id ? '#fff' : 'rgba(255,255,255,0.55)' }}>
              {n.label}
            </Typography>
            {tab === n.id && <Box sx={{ ml: 'auto', width: 4, height: 4, borderRadius: '50%', bgcolor: '#00A896' }} />}
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#00A896', fontSize: 13, fontWeight: 700 }}>
            {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Dr. {user?.profile?.firstName} {user?.profile?.lastName}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Médecin</Typography>
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
    CONFIRMED: { label: 'Confirmé',   color: 'success' },
    PENDING:   { label: 'En attente', color: 'warning' },
    CANCELLED: { label: 'Annulé',     color: 'error' },
    COMPLETED: { label: 'Terminé',    color: 'default' },
  };
  const c = m[s] ?? { label: s, color: 'default' };
  return <Chip label={c.label} color={c.color} size="small" sx={{ fontWeight: 600 }} />;
};

const StatCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
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

// ── Vital chip helper ─────────────────────────────────────────────────────────
const VitalChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, border: '1px solid #E2E8F0' }}>
    <Typography sx={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>{label}</Typography>
    <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0F2D52' }}>{value}</Typography>
  </Box>
);

// ── Rendez-vous ───────────────────────────────────────────────────────────────
const AppointmentsTab: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; appt: any }>({ open: false, appt: null });
  const [doctorNote, setDoctorNote] = useState('');

  useEffect(() => {
    api.get('/appointments/doctor').then(r => setAppointments(r.data.data)).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await api.put(`/appointments/${id}`, { status, ...(notes && { doctorNotes: notes }) });
      setAppointments(as => as.map(a => a.id === id ? { ...a, status, doctorNotes: notes ?? a.doctorNotes } : a));
      toast.success('Rendez-vous mis à jour');
      setNoteDialog({ open: false, appt: null });
    } catch { toast.error('Erreur'); }
  };

  const stats = {
    today: appointments.filter(a => new Date(a.appointmentDate).toDateString() === new Date().toDateString()).length,
    pending: appointments.filter(a => a.status === 'PENDING').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
  };

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Rendez-vous</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{appointments.length} rendez-vous au total</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><StatCard label="Aujourd'hui" value={stats.today} color="#0F2D52" icon={<CalendarMonth />} /></Grid>
        <Grid item xs={12} sm={4}><StatCard label="En attente" value={stats.pending} color="#D69E2E" icon={<Pending />} /></Grid>
        <Grid item xs={12} sm={4}><StatCard label="Confirmés" value={stats.confirmed} color="#00A896" icon={<CheckCircle />} /></Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#0F2D52' }}>Liste des rendez-vous</Typography>
          <Chip label={appointments.length} size="small" sx={{ bgcolor: '#EEF3FF', color: '#0F2D52', fontWeight: 700 }} />
        </Box>
        {appointments.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CalendarMonth sx={{ fontSize: 40, color: '#CBD5E0', mb: 1 }} />
            <Typography sx={{ color: '#9CA3AF', fontSize: 13.5 }}>Aucun rendez-vous</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Date & Heure</TableCell>
                <TableCell>Motif</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map(a => (
                <TableRow key={a.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 12, fontWeight: 700 }}>
                        {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{a.patient?.firstName} {a.patient?.lastName}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>
                          {a.patient?.patientInfo?.bloodGroup && `Gr. ${a.patient.patientInfo.bloodGroup}`}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 500 }}>
                      {new Date(a.appointmentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                      <AccessTime sx={{ fontSize: 12, color: '#9CA3AF' }} />
                      <Typography sx={{ fontSize: 12, color: '#64748B' }}>{a.appointmentTime}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: '#4A5568', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason}</Typography>
                  </TableCell>
                  <TableCell>{statusChip(a.status)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                      {a.status === 'PENDING' && (
                        <Button size="small" variant="contained" color="success" onClick={() => updateStatus(a.id, 'CONFIRMED')}
                          sx={{ borderRadius: 1.5, fontSize: 12, py: 0.5 }}>
                          Confirmer
                        </Button>
                      )}
                      {a.status === 'CONFIRMED' && (
                        <Button size="small" variant="contained" onClick={() => { setNoteDialog({ open: true, appt: a }); setDoctorNote(a.doctorNotes ?? ''); }}
                          sx={{ borderRadius: 1.5, fontSize: 12, py: 0.5 }}>
                          Terminer
                        </Button>
                      )}
                      {!['CANCELLED', 'COMPLETED'].includes(a.status) && (
                        <Button size="small" variant="outlined" color="error" onClick={() => updateStatus(a.id, 'CANCELLED')}
                          sx={{ borderRadius: 1.5, fontSize: 12, py: 0.5 }}>
                          Annuler
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={noteDialog.open} onClose={() => setNoteDialog({ open: false, appt: null })} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>Terminer la consultation</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: '#64748B', mb: 2 }}>
            Patient : {noteDialog.appt?.patient?.firstName} {noteDialog.appt?.patient?.lastName}
          </Typography>
          <TextField fullWidth label="Notes de consultation" multiline rows={4} value={doctorNote}
            onChange={e => setDoctorNote(e.target.value)} size="small" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setNoteDialog({ open: false, appt: null })} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={() => updateStatus(noteDialog.appt.id, 'COMPLETED', doctorNote)}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Patients – DPI 360° ───────────────────────────────────────────────────────
const PatientsTab: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [subTab, setSubTab] = useState(0);
  const [records, setRecords] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [addRecordDialog, setAddRecordDialog] = useState(false);
  const [newRecord, setNewRecord] = useState({ recordType: 'CONSULTATION', diagnosis: '', notes: '', symptoms: '', followUpRequired: false });
  const [addVitalsDialog, setAddVitalsDialog] = useState(false);
  const [newVital, setNewVital] = useState({ heartRate: '', systolic: '', diastolic: '', temperature: '', weight: '', height: '', oxygenSaturation: '', glucoseLevel: '', notes: '' });
  const [addLabDialog, setAddLabDialog] = useState(false);
  const [newLab, setNewLab] = useState({ testName: '', testCode: '', result: '', unit: '', referenceRange: '', status: 'NORMAL', notes: '' });

  useEffect(() => {
    api.get('/medical-records/my-patients').then(r => setPatients(r.data.data)).finally(() => setLoading(false));
  }, []);

  const loadPatientData = async (patientId: string) => {
    try {
      const [r, v, l] = await Promise.all([
        api.get(`/medical-records/patient/${patientId}`),
        api.get(`/vital-signs/patient/${patientId}`),
        api.get(`/lab-results/patient/${patientId}`),
      ]);
      setRecords(r.data.data);
      setVitals(v.data.data);
      setLabResults(l.data.data);
    } catch {}
  };

  const selectPatient = (p: any) => { setSelected(p); setSubTab(0); loadPatientData(p.userId ?? p.id); };

  const createRecord = async () => {
    try {
      await api.post('/medical-records', { ...newRecord, patientId: selected.userId ?? selected.id });
      toast.success('Dossier créé');
      setAddRecordDialog(false);
      setNewRecord({ recordType: 'CONSULTATION', diagnosis: '', notes: '', symptoms: '', followUpRequired: false });
      loadPatientData(selected.userId ?? selected.id);
    } catch { toast.error('Erreur'); }
  };

  const createVitals = async () => {
    const body: any = { patientId: selected.userId ?? selected.id };
    if (newVital.heartRate) body.heartRate = Number(newVital.heartRate);
    if (newVital.systolic) body.bloodPressureSystolic = Number(newVital.systolic);
    if (newVital.diastolic) body.bloodPressureDiastolic = Number(newVital.diastolic);
    if (newVital.temperature) body.temperature = Number(newVital.temperature);
    if (newVital.weight) body.weight = Number(newVital.weight);
    if (newVital.height) body.height = Number(newVital.height);
    if (newVital.oxygenSaturation) body.oxygenSaturation = Number(newVital.oxygenSaturation);
    if (newVital.glucoseLevel) body.glucoseLevel = Number(newVital.glucoseLevel);
    if (newVital.notes) body.notes = newVital.notes;
    try {
      await api.post('/vital-signs', body);
      toast.success('Signes vitaux enregistrés');
      setAddVitalsDialog(false);
      setNewVital({ heartRate: '', systolic: '', diastolic: '', temperature: '', weight: '', height: '', oxygenSaturation: '', glucoseLevel: '', notes: '' });
      loadPatientData(selected.userId ?? selected.id);
    } catch { toast.error('Erreur'); }
  };

  const createLabResult = async () => {
    try {
      await api.post('/lab-results', { ...newLab, patientId: selected.userId ?? selected.id });
      toast.success('Résultat enregistré');
      setAddLabDialog(false);
      setNewLab({ testName: '', testCode: '', result: '', unit: '', referenceRange: '', status: 'NORMAL', notes: '' });
      loadPatientData(selected.userId ?? selected.id);
    } catch { toast.error('Erreur'); }
  };

  const labStatusColor = (s: string): any => ({ NORMAL: 'success', ABNORMAL: 'warning', CRITICAL: 'error', PENDING: 'default' }[s] ?? 'default');

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>DPI Patients</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{patients.length} patient(s) suivi(s)</Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Patient list */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
              <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: '#0F2D52' }}>Liste ({patients.length})</Typography>
            </Box>
            {patients.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <People sx={{ fontSize: 36, color: '#CBD5E0', mb: 1 }} />
                <Typography sx={{ color: '#9CA3AF', fontSize: 13 }}>Aucun patient pour l'instant</Typography>
              </Box>
            ) : patients.map(p => (
              <Box key={p.userId ?? p.id} onClick={() => selectPatient(p)} sx={{
                px: 2.5, py: 2, cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                bgcolor: selected?.userId === p.userId ? '#EEF3FF' : '#fff',
                '&:hover': { bgcolor: '#F8FAFC' }, transition: 'background 0.1s',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#00A896', fontSize: 13, fontWeight: 700 }}>
                    {p.firstName[0]}{p.lastName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#1A202C' }}>{p.firstName} {p.lastName}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>{p._count?.medicalRecords ?? 0} dossier(s)</Typography>
                  </Box>
                  {selected?.userId === p.userId && <ArrowForward sx={{ fontSize: 14, color: '#0F2D52' }} />}
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* DPI 360° */}
        <Grid item xs={12} md={8}>
          {!selected ? (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 10, textAlign: 'center' }}>
              <People sx={{ fontSize: 52, color: '#CBD5E0', mb: 2 }} />
              <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Sélectionnez un patient pour afficher le DPI</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Patient header card */}
              <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 46, height: 46, bgcolor: '#00A896', fontWeight: 700 }}>
                      {selected.firstName[0]}{selected.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0F2D52' }}>{selected.firstName} {selected.lastName}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: '#64748B' }}>
                        {selected.patientInfo?.bloodGroup && `Gr. ${selected.patientInfo.bloodGroup}`}
                        {selected.patientInfo?.allergies && ` · ${selected.patientInfo.allergies}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {subTab === 0 && <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setAddRecordDialog(true)} sx={{ borderRadius: 2 }}>Dossier</Button>}
                    {subTab === 1 && <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setAddVitalsDialog(true)} sx={{ borderRadius: 2 }}>Signes vitaux</Button>}
                    {subTab === 2 && <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setAddLabDialog(true)} sx={{ borderRadius: 2 }}>Résultat labo</Button>}
                  </Box>
                </Box>
              </Paper>

              {/* DPI sub-tabs */}
              <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{
                  borderBottom: '1px solid #E2E8F0', px: 1, minHeight: 44,
                  '& .MuiTab-root': { minHeight: 44, fontSize: 12.5, fontWeight: 600, textTransform: 'none' },
                  '& .Mui-selected': { color: '#0F2D52' },
                  '& .MuiTabs-indicator': { bgcolor: '#00A896' },
                }}>
                  <Tab label={`Dossiers (${records.length})`} icon={<Assignment sx={{ fontSize: 15 }} />} iconPosition="start" />
                  <Tab label={`Vitaux (${vitals.length})`} icon={<MonitorHeart sx={{ fontSize: 15 }} />} iconPosition="start" />
                  <Tab label={`Labo (${labResults.length})`} icon={<Science sx={{ fontSize: 15 }} />} iconPosition="start" />
                </Tabs>

                {/* Medical records */}
                {subTab === 0 && (
                  <Box sx={{ p: 2 }}>
                    {records.length === 0 ? (
                      <Box sx={{ py: 5, textAlign: 'center' }}>
                        <Assignment sx={{ fontSize: 36, color: '#CBD5E0', mb: 1 }} />
                        <Typography sx={{ color: '#9CA3AF', fontSize: 13 }}>Aucun dossier médical</Typography>
                      </Box>
                    ) : records.map(r => (
                      <Paper key={r.id} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', mb: 1.5 }}>
                        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <FiberManualRecord sx={{ fontSize: 8, color: '#00A896' }} />
                          <Chip label={r.recordType} size="small" sx={{ bgcolor: '#EEF3FF', color: '#0F2D52', fontWeight: 700, fontSize: 11 }} />
                          <Typography sx={{ fontSize: 12, color: '#9CA3AF', ml: 'auto' }}>
                            {new Date(r.recordDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </Typography>
                        </Box>
                        <Box sx={{ px: 2.5, py: 1.5 }}>
                          {r.diagnosis && <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#1A202C' }}>{r.diagnosis}</Typography>}
                          {r.notes && <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.5 }}>{r.notes}</Typography>}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}

                {/* Vital signs */}
                {subTab === 1 && (
                  <Box sx={{ p: 2 }}>
                    {vitals.length === 0 ? (
                      <Box sx={{ py: 5, textAlign: 'center' }}>
                        <MonitorHeart sx={{ fontSize: 36, color: '#CBD5E0', mb: 1 }} />
                        <Typography sx={{ color: '#9CA3AF', fontSize: 13 }}>Aucun signe vital enregistré</Typography>
                      </Box>
                    ) : vitals.map((v, i) => (
                      <Paper key={v.id} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2, mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <FiberManualRecord sx={{ fontSize: 8, color: i === 0 ? '#00A896' : '#CBD5E0' }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                            {new Date(v.recordedAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          {i === 0 && <Chip label="Dernier" size="small" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 700, fontSize: 10, ml: 'auto' }} />}
                        </Box>
                        <Grid container spacing={1.5}>
                          {v.heartRate && <Grid item xs={6} sm={3}><VitalChip label="Rythme card." value={`${v.heartRate} bpm`} /></Grid>}
                          {(v.bloodPressureSystolic || v.bloodPressureDiastolic) && (
                            <Grid item xs={6} sm={3}><VitalChip label="Tension" value={`${v.bloodPressureSystolic ?? '?'}/${v.bloodPressureDiastolic ?? '?'} mmHg`} /></Grid>
                          )}
                          {v.temperature && <Grid item xs={6} sm={3}><VitalChip label="Température" value={`${v.temperature} °C`} /></Grid>}
                          {v.oxygenSaturation && <Grid item xs={6} sm={3}><VitalChip label="SpO₂" value={`${v.oxygenSaturation} %`} /></Grid>}
                          {v.weight && <Grid item xs={6} sm={3}><VitalChip label="Poids" value={`${v.weight} kg`} /></Grid>}
                          {v.glucoseLevel && <Grid item xs={6} sm={3}><VitalChip label="Glycémie" value={`${v.glucoseLevel} g/L`} /></Grid>}
                        </Grid>
                        {v.notes && <Typography sx={{ fontSize: 12.5, color: '#64748B', mt: 1.5, fontStyle: 'italic' }}>{v.notes}</Typography>}
                      </Paper>
                    ))}
                  </Box>
                )}

                {/* Lab results */}
                {subTab === 2 && (
                  <Box sx={{ p: 2 }}>
                    {labResults.length === 0 ? (
                      <Box sx={{ py: 5, textAlign: 'center' }}>
                        <Science sx={{ fontSize: 36, color: '#CBD5E0', mb: 1 }} />
                        <Typography sx={{ color: '#9CA3AF', fontSize: 13 }}>Aucun résultat de laboratoire</Typography>
                      </Box>
                    ) : labResults.map(l => (
                      <Paper key={l.id} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', mb: 1.5 }}>
                        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#0F2D52' }}>{l.testName}</Typography>
                          {l.testCode && <Typography sx={{ fontSize: 11.5, color: '#9CA3AF' }}>{l.testCode}</Typography>}
                          <Chip label={l.status} color={labStatusColor(l.status)} size="small" sx={{ fontWeight: 600, ml: 'auto' }} />
                        </Box>
                        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          {l.result && (
                            <Box>
                              <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Résultat</Typography>
                              <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#0F2D52' }}>{l.result} <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: '#64748B' }}>{l.unit}</Typography></Typography>
                            </Box>
                          )}
                          {l.referenceRange && (
                            <Box>
                              <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Valeurs normales</Typography>
                              <Typography sx={{ fontSize: 13.5, color: '#4A5568' }}>{l.referenceRange}</Typography>
                            </Box>
                          )}
                          <Typography sx={{ fontSize: 11.5, color: '#9CA3AF', ml: 'auto' }}>{new Date(l.createdAt).toLocaleDateString('fr-FR')}</Typography>
                        </Box>
                        {l.notes && <Box sx={{ px: 2.5, pb: 1.5 }}><Typography sx={{ fontSize: 12.5, color: '#64748B', fontStyle: 'italic' }}>{l.notes}</Typography></Box>}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Add record dialog */}
      <Dialog open={addRecordDialog} onClose={() => setAddRecordDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          Nouveau dossier — {selected?.firstName} {selected?.lastName}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Type *</Typography>
              <TextField fullWidth size="small" select value={newRecord.recordType} onChange={e => setNewRecord(n => ({ ...n, recordType: e.target.value }))}>
                {[['CONSULTATION','Consultation'],['PRESCRIPTION','Prescription'],['LAB_RESULT','Résultat labo'],['IMAGING','Imagerie'],['FOLLOW_UP','Suivi']].map(([v, l]) => (
                  <MenuItem key={v} value={v}>{l}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Diagnostic</Typography>
              <TextField fullWidth size="small" value={newRecord.diagnosis} onChange={e => setNewRecord(n => ({ ...n, diagnosis: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Symptômes</Typography>
              <TextField fullWidth size="small" value={newRecord.symptoms} onChange={e => setNewRecord(n => ({ ...n, symptoms: e.target.value }))} placeholder="Séparés par des virgules" />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Notes *</Typography>
              <TextField fullWidth size="small" multiline rows={4} value={newRecord.notes} onChange={e => setNewRecord(n => ({ ...n, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAddRecordDialog(false)} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={createRecord} disabled={!newRecord.recordType || !newRecord.notes}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Add vitals dialog */}
      <Dialog open={addVitalsDialog} onClose={() => setAddVitalsDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          Signes vitaux — {selected?.firstName} {selected?.lastName}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Rythme cardiaque (bpm)</Typography>
              <TextField fullWidth size="small" type="number" value={newVital.heartRate} onChange={e => setNewVital(v => ({ ...v, heartRate: e.target.value }))} />
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Systolique</Typography>
              <TextField fullWidth size="small" type="number" value={newVital.systolic} onChange={e => setNewVital(v => ({ ...v, systolic: e.target.value }))} />
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Diastolique</Typography>
              <TextField fullWidth size="small" type="number" value={newVital.diastolic} onChange={e => setNewVital(v => ({ ...v, diastolic: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Température (°C)</Typography>
              <TextField fullWidth size="small" type="number" inputProps={{ step: '0.1' }} value={newVital.temperature} onChange={e => setNewVital(v => ({ ...v, temperature: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>SpO₂ (%)</Typography>
              <TextField fullWidth size="small" type="number" value={newVital.oxygenSaturation} onChange={e => setNewVital(v => ({ ...v, oxygenSaturation: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Glycémie (g/L)</Typography>
              <TextField fullWidth size="small" type="number" inputProps={{ step: '0.01' }} value={newVital.glucoseLevel} onChange={e => setNewVital(v => ({ ...v, glucoseLevel: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Poids (kg)</Typography>
              <TextField fullWidth size="small" type="number" inputProps={{ step: '0.1' }} value={newVital.weight} onChange={e => setNewVital(v => ({ ...v, weight: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Taille (cm)</Typography>
              <TextField fullWidth size="small" type="number" value={newVital.height} onChange={e => setNewVital(v => ({ ...v, height: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Notes</Typography>
              <TextField fullWidth size="small" multiline rows={2} value={newVital.notes} onChange={e => setNewVital(v => ({ ...v, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAddVitalsDialog(false)} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={createVitals}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Add lab result dialog */}
      <Dialog open={addLabDialog} onClose={() => setAddLabDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          Résultat labo — {selected?.firstName} {selected?.lastName}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={8}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Nom du test *</Typography>
              <TextField fullWidth size="small" value={newLab.testName} onChange={e => setNewLab(l => ({ ...l, testName: e.target.value }))} placeholder="ex. Glycémie à jeun" />
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Code</Typography>
              <TextField fullWidth size="small" value={newLab.testCode} onChange={e => setNewLab(l => ({ ...l, testCode: e.target.value }))} placeholder="ex. GLU" />
            </Grid>
            <Grid item xs={5}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Résultat</Typography>
              <TextField fullWidth size="small" value={newLab.result} onChange={e => setNewLab(l => ({ ...l, result: e.target.value }))} />
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Unité</Typography>
              <TextField fullWidth size="small" value={newLab.unit} onChange={e => setNewLab(l => ({ ...l, unit: e.target.value }))} placeholder="mg/dL" />
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Statut</Typography>
              <TextField fullWidth size="small" select value={newLab.status} onChange={e => setNewLab(l => ({ ...l, status: e.target.value }))}>
                {[['NORMAL','Normal'],['ABNORMAL','Anormal'],['CRITICAL','Critique'],['PENDING','En attente']].map(([v, label]) => (
                  <MenuItem key={v} value={v}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Valeurs de référence</Typography>
              <TextField fullWidth size="small" value={newLab.referenceRange} onChange={e => setNewLab(l => ({ ...l, referenceRange: e.target.value }))} placeholder="ex. 70–100 mg/dL" />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Notes / Interprétation</Typography>
              <TextField fullWidth size="small" multiline rows={3} value={newLab.notes} onChange={e => setNewLab(l => ({ ...l, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAddLabDialog(false)} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={createLabResult} disabled={!newLab.testName}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Label helper ──────────────────────────────────────────────────────────────
const FL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>{children}</Typography>
);

// ── Profil médecin éditable ───────────────────────────────────────────────────
const ProfileTab: React.FC = () => {
  const user = authService.getCurrentUser();
  const di = (user as any)?.doctorInfo ?? {};

  const [prof, setProf] = useState({
    firstName: user?.profile?.firstName ?? '',
    lastName:  user?.profile?.lastName  ?? '',
    phone:     user?.profile?.phone     ?? '',
    city:      user?.profile?.city      ?? '',
    region:    user?.profile?.region    ?? '',
  });

  const [doctorInfo, setDoctorInfo] = useState({
    bio:                 di.bio                 ?? '',
    hospitalAffiliation: di.hospitalAffiliation ?? '',
    consultationFee:     di.consultationFee     ?? '',
    yearsOfExperience:   di.yearsOfExperience   ?? '',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({
        profile: prof,
        doctorInfo: {
          ...doctorInfo,
          consultationFee:   doctorInfo.consultationFee   ? Number(doctorInfo.consultationFee)   : undefined,
          yearsOfExperience: doctorInfo.yearsOfExperience ? Number(doctorInfo.yearsOfExperience) : undefined,
        },
      });
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

      {/* ── Informations professionnelles ── */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <SectionHeader icon={<Assignment />} title="Informations professionnelles" />
        <Box sx={{ p: 3 }}>
          {/* Champs non modifiables */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {di.specialization && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.3 }}>Spécialisation</Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#0F2D52' }}>{di.specialization}</Typography>
                </Box>
              </Grid>
            )}
            {di.licenseNumber && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.3 }}>N° Licence</Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#0F2D52', fontFamily: 'monospace' }}>{di.licenseNumber}</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ mb: 2.5 }} />

          {/* Champs modifiables */}
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FL>Bio / Présentation</FL>
              <TextField fullWidth size="small" multiline rows={3} value={doctorInfo.bio}
                onChange={e => setDoctorInfo(d => ({ ...d, bio: e.target.value }))}
                placeholder="Décrivez votre parcours et votre approche thérapeutique…" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FL>Établissement hospitalier</FL>
              <TextField fullWidth size="small" value={doctorInfo.hospitalAffiliation}
                onChange={e => setDoctorInfo(d => ({ ...d, hospitalAffiliation: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FL>Tarif consultation (FCFA)</FL>
              <TextField fullWidth size="small" type="number" value={doctorInfo.consultationFee}
                onChange={e => setDoctorInfo(d => ({ ...d, consultationFee: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FL>Années d'expérience</FL>
              <TextField fullWidth size="small" type="number" value={doctorInfo.yearsOfExperience}
                onChange={e => setDoctorInfo(d => ({ ...d, yearsOfExperience: e.target.value }))} />
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
                helperText={pw.confirm.length > 0 && pw.next !== pw.confirm ? 'Ne correspond pas' : ''} />
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

// ── Télémédecine ──────────────────────────────────────────────────────────────
const TelemedicineTab: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    api.get('/appointments/doctor')
      .then(r => {
        const tele = (r.data.data as any[]).filter(a => a.type === 'TELECONSULTATION');
        setAppointments(tele);
        return tele;
      })
      .then(async tele => {
        const sessionMap: Record<string, any> = {};
        await Promise.allSettled(
          tele.filter(a => a.status === 'CONFIRMED').map(async a => {
            try {
              const s = await api.get(`/telemedicine/appointment/${a.id}`);
              sessionMap[a.id] = s.data.data;
            } catch {}
          })
        );
        setSessions(sessionMap);
      })
      .finally(() => setLoading(false));
  }, []);

  const createSession = async (apptId: string) => {
    setCreating(apptId);
    try {
      const r = await api.post('/telemedicine', { appointmentId: apptId });
      setSessions(s => ({ ...s, [apptId]: r.data.data }));
      toast.success('Session créée — partagez le lien avec le patient');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Erreur lors de la création');
    } finally {
      setCreating(null);
    }
  };

  const jitsiUrl = (roomId: string) => `https://meet.jit.si/mediroute-${roomId}`;

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Lien copié !');
  };

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Télémédecine</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>
          {appointments.length} rendez-vous de téléconsultation
        </Typography>
      </Box>

      {appointments.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 10, textAlign: 'center' }}>
          <Videocam sx={{ fontSize: 52, color: '#CBD5E0', mb: 2 }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucune téléconsultation planifiée</Typography>
          <Typography sx={{ color: '#CBD5E0', fontSize: 12.5, mt: 0.5 }}>
            Les patients doivent choisir le type "Téléconsultation" lors de la prise de rendez-vous
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {appointments.map(a => {
            const session = sessions[a.id];
            const url = session ? jitsiUrl(session.roomId) : null;
            return (
              <Paper key={a.id} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Videocam sx={{ fontSize: 20, color: '#00A896' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F2D52' }}>
                      {a.patient?.firstName} {a.patient?.lastName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.2 }}>
                      <AccessTime sx={{ fontSize: 12, color: '#9CA3AF' }} />
                      <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                        {new Date(a.appointmentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à {a.appointmentTime}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={a.status === 'CONFIRMED' ? 'Confirmé' : a.status === 'PENDING' ? 'En attente' : a.status}
                    color={a.status === 'CONFIRMED' ? 'success' : 'warning'}
                    size="small" sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Box sx={{ px: 3, py: 2.5 }}>
                  {a.reason && (
                    <Typography sx={{ fontSize: 13.5, color: '#4A5568', mb: 2 }}>
                      <strong>Motif :</strong> {a.reason}
                    </Typography>
                  )}

                  {a.status !== 'CONFIRMED' ? (
                    <Typography sx={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
                      Confirmez le rendez-vous pour créer la session vidéo.
                    </Typography>
                  ) : !session ? (
                    <Button
                      variant="contained"
                      startIcon={creating === a.id ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Videocam />}
                      onClick={() => createSession(a.id)}
                      disabled={creating === a.id}
                      sx={{ borderRadius: 2 }}
                    >
                      Créer la session vidéo
                    </Button>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <FiberManualRecord sx={{ fontSize: 10, color: '#38A169' }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#276749' }}>Session active</Typography>
                        <Chip label={session.status} size="small" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: 10 }} />
                      </Box>

                      <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, p: 2, mb: 2 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.5 }}>Lien de la session</Typography>
                        <Typography sx={{ fontSize: 12.5, color: '#4A5568', fontFamily: 'monospace', wordBreak: 'break-all' }}>{url}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<OpenInNew />}
                          onClick={() => window.open(url!, '_blank')}
                          sx={{ borderRadius: 2 }}
                        >
                          Rejoindre
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<ContentCopy />}
                          onClick={() => copyLink(url!)}
                          sx={{ borderRadius: 2, borderColor: '#E2E8F0', color: '#374151' }}
                        >
                          Copier le lien patient
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
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
    } catch { toast.error('Erreur lors de l\'envoi'); }
    finally { setSending(false); }
  };

  const initConversation = (contact: any) => {
    setNewDialog(false);
    setPartner(contact);
    openThread(contact);
  };

  const formatTime = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (d: string) => {
    const dt = new Date(d);
    const today = new Date();
    if (dt.toDateString() === today.toDateString()) return "Aujourd'hui";
    return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Messagerie</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>Communication sécurisée avec vos patients</Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', display: 'flex', height: 'calc(100vh - 220px)', minHeight: 480 }}>
        {/* Left: conversation list */}
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
                        {c.partner.firstName} {c.partner.lastName}
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

        {/* Right: chat window */}
        {!partner ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CBD5E0' }}>
            <Chat sx={{ fontSize: 56, mb: 2 }} />
            <Typography sx={{ fontSize: 15, color: '#9CA3AF', fontWeight: 500 }}>Sélectionnez une conversation</Typography>
            <Typography sx={{ fontSize: 13, color: '#CBD5E0', mt: 0.5 }}>ou commencez-en une nouvelle avec le bouton +</Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Chat header */}
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 12, fontWeight: 700 }}>
                {partner.firstName?.[0]}{partner.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F2D52' }}>
                  {partner.firstName} {partner.lastName}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>
                  {partner.role === 'PATIENT' ? 'Patient' : partner.role === 'DOCTOR' ? 'Médecin' : partner.role}
                </Typography>
              </Box>
            </Box>

            {/* Messages */}
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
                        maxWidth: '70%', px: 2, py: 1.25, borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
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

            {/* Input */}
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
          <Typography sx={{ fontSize: 13, color: '#64748B', mb: 2 }}>Choisissez un patient avec qui vous avez eu un rendez-vous</Typography>
          {contacts.length === 0 ? (
            <Typography sx={{ fontSize: 13.5, color: '#9CA3AF', textAlign: 'center', py: 2 }}>Aucun contact disponible</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 300 }}>
              {contacts.map((c: any) => (
                <Box key={c.id} onClick={() => initConversation(c)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderRadius: 2, cursor: 'pointer', border: '1px solid #E2E8F0', '&:hover': { bgcolor: '#F8FAFC', borderColor: '#00A896' } }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 12, fontWeight: 700 }}>
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{c.firstName} {c.lastName}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>Patient</Typography>
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
const DoctorDashboard: React.FC = () => {
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
        {hasActiveSub === false && tab !== 4 && (
          <SubscriptionBanner onSubscribe={() => setTab(4)} />
        )}
        {tab === 0 && <AppointmentsTab />}
        {tab === 1 && <PatientsTab />}
        {tab === 2 && <TelemedicineTab />}
        {tab === 3 && <MessagingTab />}
        {tab === 4 && <SubscriptionTab />}
        {tab === 5 && <ProfileTab />}
      </Box>
      <ChatbotWidget />
    </Box>
  );
};

export default DoctorDashboard;
