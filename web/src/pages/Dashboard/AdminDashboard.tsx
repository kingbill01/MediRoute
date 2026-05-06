import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Avatar, MenuItem, Divider, Paper, IconButton, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, Select, FormControl,
} from '@mui/material';
import {
  LocalHospital, People, ExitToApp,
  Pending, BarChart, MedicalServices,
  CalendarMonth, FiberManualRecord,
  Hotel, Inventory2, Warning, Add, Edit, AccessTime,
  Person, Visibility, VisibilityOff, Save, Lock,
  Delete, Search, FilterList, History, TrendingDown,
  AttachMoney, EventBusy, CardMembership,
} from '@mui/icons-material';
import subscriptionService from '../../services/subscriptionService';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import { toast } from 'react-toastify';

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 0, icon: <BarChart />,        label: 'Tableau de bord' },
  { id: 1, icon: <MedicalServices />, label: 'Médecins' },
  { id: 2, icon: <People />,          label: 'Patients' },
  { id: 3, icon: <LocalHospital />,   label: 'Hôpitaux' },
  { id: 4, icon: <Hotel />,           label: 'Gestion des lits' },
  { id: 5, icon: <Inventory2 />,      label: 'Inventaire' },
  { id: 6, icon: <CardMembership />,  label: 'Souscriptions' },
  { id: 7, icon: <Person />,          label: 'Mon profil' },
];

const Sidebar: React.FC<{ tab: number; setTab: (n: number) => void }> = ({ tab, setTab }) => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  return (
    <Box sx={{
      width: 240, flexShrink: 0, bgcolor: '#0F2D52',
      display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: '#00A896', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LocalHospital sx={{ color: '#fff', fontSize: 21 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>MediRoute</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Administration</Typography>
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
              {user?.profile?.firstName} {user?.profile?.lastName}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Administrateur</Typography>
          </Box>
          <IconButton size="small" onClick={() => { authService.logout(); navigate('/login'); }} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#FC8181' } }}>
            <ExitToApp sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: number | string; sub?: string; color: string; icon: React.ReactNode }> = ({ label, value, sub, color, icon }) => (
  <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
    <CardContent sx={{ p: '20px !important' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 500, mb: 0.5 }}>{label}</Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 800, color: '#0F2D52', lineHeight: 1 }}>{value}</Typography>
          {sub && <Typography sx={{ fontSize: 12, color: '#9CA3AF', mt: 0.5 }}>{sub}</Typography>}
        </Box>
        <Box sx={{ width: 46, height: 46, borderRadius: '12px', bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon as React.ReactElement, { sx: { color: '#fff', fontSize: 22 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ── Tableau de bord ───────────────────────────────────────────────────────────
const StatsTab: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;
  if (!stats) return null;

  const { users, hospitals, appointments } = stats;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Tableau de bord</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>Vue d'ensemble de la plateforme</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <KpiCard label="Patients" value={users?.patients ?? 0} color="#0F2D52" icon={<People />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Médecins approuvés" value={users?.approvedDoctors ?? 0} sub={`${users?.pendingDoctors ?? 0} en attente`} color="#00A896" icon={<MedicalServices />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Hôpitaux" value={hospitals?.total ?? 0} color="#4A5568" icon={<LocalHospital />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Rendez-vous" value={appointments?.total ?? 0} sub={`${appointments?.pending ?? 0} en attente`} color="#D69E2E" icon={<CalendarMonth />} />
        </Grid>
      </Grid>

      {/* Alertes */}
      {(users?.pendingDoctors ?? 0) > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #FED7AA', borderRadius: 3, p: 2.5, mb: 2, bgcolor: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Pending sx={{ color: '#D69E2E', fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#92400E' }}>
              {users.pendingDoctors} médecin(s) en attente de validation
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#B45309' }}>Rendez-vous dans l'onglet Médecins pour approuver ou rejeter</Typography>
          </Box>
        </Paper>
      )}

      {/* Répartition par région */}
      {hospitals?.byRegion && (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#0F2D52' }}>Hôpitaux par région</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Région</TableCell>
                <TableCell align="right">Hôpitaux</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hospitals.byRegion.map((r: any) => (
                <TableRow key={r.region} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FiberManualRecord sx={{ fontSize: 8, color: '#00A896' }} />
                      <Typography sx={{ fontSize: 13.5 }}>{r.region}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={r._count?.id ?? r.count ?? 0} size="small" sx={{ bgcolor: '#EEF3FF', color: '#0F2D52', fontWeight: 700 }} />
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

// ── Médecins ──────────────────────────────────────────────────────────────────
const DoctorsTab: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; doc: any; action: 'APPROVED' | 'REJECTED' | null }>({ open: false, doc: null, action: null });
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const q = filter !== 'ALL' ? `?status=${filter}` : '';
    api.get(`/admin/doctors${q}`).then(r => setDoctors(r.data.data)).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const verify = async () => {
    try {
      await api.put(`/admin/doctors/${verifyDialog.doc.userId}/verify`, { status: verifyDialog.action, note });
      toast.success(verifyDialog.action === 'APPROVED' ? 'Médecin approuvé' : 'Médecin rejeté');
      setVerifyDialog({ open: false, doc: null, action: null });
      setNote('');
      load();
    } catch { toast.error('Erreur'); }
  };

  const statusColor: Record<string, any> = {
    APPROVED: 'success', PENDING: 'warning', REJECTED: 'error',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Médecins</Typography>
          <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{doctors.length} résultat(s)</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={filter} onChange={e => setFilter(e.target.value)}
            sx={{ borderRadius: 2, fontSize: 13.5, bgcolor: '#fff', border: '1px solid #E2E8F0' }}>
            <MenuItem value="ALL">Tous</MenuItem>
            <MenuItem value="PENDING">En attente</MenuItem>
            <MenuItem value="APPROVED">Approuvés</MenuItem>
            <MenuItem value="REJECTED">Rejetés</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? <Box textAlign="center" py={8}><CircularProgress /></Box> : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Médecin</TableCell>
                <TableCell>Spécialisation</TableCell>
                <TableCell>Licence</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doctors.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: '#9CA3AF' }}>Aucun médecin trouvé</TableCell></TableRow>
              ) : doctors.map(d => (
                <TableRow key={d.userId} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 12, fontWeight: 700 }}>
                        {d.firstName?.[0]}{d.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Dr. {d.firstName} {d.lastName}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>{d.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: 13.5 }}>{d.doctorInfo?.specialization}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>{d.doctorInfo?.licenseNumber}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={d.doctorInfo?.verificationStatus ?? 'PENDING'}
                      color={statusColor[d.doctorInfo?.verificationStatus] ?? 'default'}
                      size="small" sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {d.doctorInfo?.verificationStatus === 'PENDING' && (
                      <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" color="success"
                          onClick={() => setVerifyDialog({ open: true, doc: d, action: 'APPROVED' })}
                          sx={{ borderRadius: 1.5, fontSize: 12, py: 0.5 }}>
                          Approuver
                        </Button>
                        <Button size="small" variant="outlined" color="error"
                          onClick={() => setVerifyDialog({ open: true, doc: d, action: 'REJECTED' })}
                          sx={{ borderRadius: 1.5, fontSize: 12, py: 0.5 }}>
                          Rejeter
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={verifyDialog.open} onClose={() => setVerifyDialog({ open: false, doc: null, action: null })} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: verifyDialog.action === 'APPROVED' ? '#276749' : '#C53030' }}>
          {verifyDialog.action === 'APPROVED' ? '✓ Approuver' : '✕ Rejeter'} Dr. {verifyDialog.doc?.firstName} {verifyDialog.doc?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: '#64748B', mb: 2 }}>
            {verifyDialog.action === 'APPROVED'
              ? 'Le médecin pourra recevoir des rendez-vous immédiatement.'
              : 'Le médecin sera notifié du rejet de son dossier.'}
          </Typography>
          <TextField fullWidth size="small" label="Note (optionnelle)" multiline rows={3} value={note} onChange={e => setNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setVerifyDialog({ open: false, doc: null, action: null })} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" color={verifyDialog.action === 'APPROVED' ? 'success' : 'error'} onClick={verify}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Patients ──────────────────────────────────────────────────────────────────
const PatientsTab: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/patients').then(r => setPatients(r.data.data)).finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (userId: string, current: string) => {
    const next = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/admin/users/${userId}/status`, { status: next });
      setPatients(ps => ps.map(p => p.userId === userId ? { ...p, status: next } : p));
      toast.success('Statut mis à jour');
    } catch { toast.error('Erreur'); }
  };

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Patients</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{patients.length} patient(s) enregistré(s)</Typography>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Localisation</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: '#9CA3AF' }}>Aucun patient</TableCell></TableRow>
            ) : patients.map(p => (
              <TableRow key={p.userId} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: '#EEF3FF', color: '#0F2D52', fontSize: 12, fontWeight: 700 }}>
                      {p.firstName?.[0]}{p.lastName?.[0]}
                    </Avatar>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{p.firstName} {p.lastName}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13 }}>{p.email}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>{p.phone}</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13, color: '#64748B' }}>{p.city}, {p.region}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={p.status} color={p.status === 'ACTIVE' ? 'success' : 'default'} size="small" sx={{ fontWeight: 600 }} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined"
                    color={p.status === 'ACTIVE' ? 'error' : 'success'}
                    onClick={() => toggleStatus(p.userId, p.status)}
                    sx={{ borderRadius: 1.5, fontSize: 12, py: 0.5 }}>
                    {p.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

// ── Hôpitaux ──────────────────────────────────────────────────────────────────
const HospitalsTab: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editDialog, setEditDialog] = useState<{ open: boolean; hospital: any }>({ open: false, hospital: null });
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/hospitals?limit=200').then(r => setHospitals(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    api.get('/hospitals/regions').then(r => setRegions(r.data.data)).catch(() => {});
  }, [load]);

  const filtered = useMemo(() => hospitals.filter(h => {
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase()) && !h.city?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRegion && h.region !== filterRegion) return false;
    if (filterType && h.type !== filterType) return false;
    return true;
  }), [hospitals, search, filterRegion, filterType]);

  const kpi = useMemo(() => ({
    totalHospitals: hospitals.length,
    totalBeds: hospitals.reduce((s, h) => s + (h.liveBedStats?.total ?? h.totalBeds ?? 0), 0),
    availBeds: hospitals.reduce((s, h) => s + (h.liveBedStats?.available ?? h.availableBeds ?? 0), 0),
    emergency: hospitals.filter(h => h.canAcceptEmergency).length,
  }), [hospitals]);

  const splitChips = (str: string | null | undefined) =>
    str ? str.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  const openEdit = (h: any) => {
    setEditForm({
      totalBeds: h.totalBeds ?? '',
      availableBeds: h.availableBeds ?? '',
      specializations: h.specializations ?? '',
      services: h.services ?? '',
      waitingTime: h.waitingTime ?? '',
      canAcceptEmergency: h.canAcceptEmergency ?? false,
    });
    setEditDialog({ open: true, hospital: h });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/hospitals/${editDialog.hospital.id}`, {
        ...editForm,
        totalBeds: editForm.totalBeds !== '' ? Number(editForm.totalBeds) : undefined,
        availableBeds: editForm.availableBeds !== '' ? Number(editForm.availableBeds) : undefined,
        waitingTime: editForm.waitingTime !== '' ? Number(editForm.waitingTime) : undefined,
      });
      toast.success('Hôpital mis à jour');
      setEditDialog({ open: false, hospital: null });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Erreur');
    } finally { setSaving(false); }
  };

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Hôpitaux</Typography>
        <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{hospitals.length} hôpital(aux) référencé(s)</Typography>
      </Box>

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <KpiCard label="Hôpitaux" value={kpi.totalHospitals} color="#0F2D52" icon={<LocalHospital />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Lits total" value={kpi.totalBeds} color="#4A5568" icon={<Hotel />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Lits disponibles" value={kpi.availBeds} color="#00A896" icon={<Hotel />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Urgences actives" value={kpi.emergency} color="#D69E2E" icon={<MedicalServices />} />
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Rechercher par nom ou ville…"
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 220, bgcolor: '#fff', borderRadius: 2, '& fieldset': { borderColor: '#E2E8F0' } }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} displayEmpty
            sx={{ borderRadius: 2, fontSize: 13.5, bgcolor: '#fff', border: '1px solid #E2E8F0' }}>
            <MenuItem value=""><em>Toutes régions</em></MenuItem>
            {regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} displayEmpty
            sx={{ borderRadius: 2, fontSize: 13.5, bgcolor: '#fff', border: '1px solid #E2E8F0' }}>
            <MenuItem value=""><em>Tous types</em></MenuItem>
            {['PUBLIC', 'PRIVATE', 'CLINIC', 'SPECIALIST'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Hospital cards */}
      <Grid container spacing={2}>
        {filtered.map((h: any) => {
          const live = h.liveBedStats;
          const total    = live?.total       ?? h.totalBeds     ?? 0;
          const occupied = live?.occupied    ?? (h.totalBeds && h.availableBeds != null ? h.totalBeds - h.availableBeds : 0);
          const maintenance = live?.maintenance ?? 0;
          const reserved    = live?.reserved    ?? 0;
          const available   = live?.available   ?? h.availableBeds ?? 0;
          const pct = (n: number) => total ? `${(n / total) * 100}%` : '0%';
          const specs = splitChips(h.specializations);
          const svcs  = splitChips(h.services);

          return (
            <Grid item xs={12} sm={6} lg={4} key={h.id}>
              <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ px: 2.5, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LocalHospital sx={{ fontSize: 20, color: '#0F2D52' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#0F2D52', lineHeight: 1.3 }}>{h.name}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>{h.type} · {h.city}, {h.region}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    {h.canAcceptEmergency && (
                      <Chip label="Urgences" color="success" size="small" sx={{ fontWeight: 700, fontSize: 10 }} />
                    )}
                    <IconButton size="small" onClick={() => openEdit(h)} sx={{ color: '#64748B', '&:hover': { color: '#0F2D52' } }}>
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Body */}
                <Box sx={{ px: 2.5, py: 2, flex: 1 }}>
                  {/* Bed capacity bar */}
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>Capacité en lits</Typography>
                      {h.occupancyRate != null && (
                        <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>{h.occupancyRate}% occupé</Typography>
                      )}
                    </Box>
                    {total > 0 ? (
                      <>
                        <Box sx={{ height: 8, borderRadius: 99, bgcolor: '#E2E8F0', overflow: 'hidden', display: 'flex' }}>
                          <Box sx={{ height: '100%', bgcolor: '#E53E3E', width: pct(occupied) }} />
                          <Box sx={{ height: '100%', bgcolor: '#ECC94B', width: pct(maintenance) }} />
                          <Box sx={{ height: '100%', bgcolor: '#A5B4FC', width: pct(reserved) }} />
                          <Box sx={{ height: '100%', bgcolor: '#6EE7B7', width: pct(available) }} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: 10.5, color: '#065F46' }}>✓ {available} disponibles</Typography>
                          <Typography sx={{ fontSize: 10.5, color: '#C53030' }}>● {occupied} occupés</Typography>
                          {maintenance > 0 && <Typography sx={{ fontSize: 10.5, color: '#92400E' }}>⚙ {maintenance} maint.</Typography>}
                          <Typography sx={{ fontSize: 10.5, color: '#9CA3AF' }}>/ {total} total</Typography>
                        </Box>
                      </>
                    ) : (
                      <Typography sx={{ fontSize: 11.5, color: '#CBD5E0', fontStyle: 'italic' }}>Données non renseignées</Typography>
                    )}
                  </Box>

                  {/* Specializations */}
                  {specs.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#64748B', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Spécialisations</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {specs.slice(0, 4).map((s: string) => (
                          <Chip key={s} label={s} size="small" sx={{ bgcolor: '#CCFBF1', color: '#0F766E', fontSize: 10.5, fontWeight: 600, height: 20 }} />
                        ))}
                        {specs.length > 4 && <Chip label={`+${specs.length - 4}`} size="small" sx={{ bgcolor: '#E2E8F0', color: '#64748B', fontSize: 10.5, height: 20 }} />}
                      </Box>
                    </Box>
                  )}

                  {/* Services */}
                  {svcs.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#64748B', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Services</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {svcs.slice(0, 3).map((s: string) => (
                          <Chip key={s} label={s} size="small" sx={{ bgcolor: '#EDE9FE', color: '#5B21B6', fontSize: 10.5, fontWeight: 600, height: 20 }} />
                        ))}
                        {svcs.length > 3 && <Chip label={`+${svcs.length - 3}`} size="small" sx={{ bgcolor: '#E2E8F0', color: '#64748B', fontSize: 10.5, height: 20 }} />}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Footer */}
                {h.waitingTime != null && (
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <AccessTime sx={{ fontSize: 14, color: '#64748B' }} />
                    <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>
                      Attente estimée : <strong>{h.waitingTime} min</strong>
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}

        {filtered.length === 0 && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 8, textAlign: 'center' }}>
              <LocalHospital sx={{ fontSize: 48, color: '#CBD5E0', mb: 1.5 }} />
              <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucun hôpital trouvé pour ces critères</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Edit dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, hospital: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          Modifier — {editDialog.hospital?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>Lits total</Typography>
              <TextField fullWidth size="small" type="number" value={editForm.totalBeds ?? ''}
                onChange={e => setEditForm((f: any) => ({ ...f, totalBeds: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>Lits disponibles</Typography>
              <TextField fullWidth size="small" type="number" value={editForm.availableBeds ?? ''}
                onChange={e => setEditForm((f: any) => ({ ...f, availableBeds: e.target.value }))} />
            </Grid>
            <Grid item xs={8}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>Temps d'attente (min)</Typography>
              <TextField fullWidth size="small" type="number" value={editForm.waitingTime ?? ''}
                onChange={e => setEditForm((f: any) => ({ ...f, waitingTime: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>Urgences</Typography>
              <TextField fullWidth size="small" select value={editForm.canAcceptEmergency ? 'true' : 'false'}
                onChange={e => setEditForm((f: any) => ({ ...f, canAcceptEmergency: e.target.value === 'true' }))}>
                <MenuItem value="true">Oui</MenuItem>
                <MenuItem value="false">Non</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>Spécialisations (séparées par virgule)</Typography>
              <TextField fullWidth size="small" multiline rows={2} value={editForm.specializations ?? ''}
                onChange={e => setEditForm((f: any) => ({ ...f, specializations: e.target.value }))}
                placeholder="ex. Cardiologie, Neurologie, Oncologie" />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>Services (séparés par virgule)</Typography>
              <TextField fullWidth size="small" multiline rows={2} value={editForm.services ?? ''}
                onChange={e => setEditForm((f: any) => ({ ...f, services: e.target.value }))}
                placeholder="ex. Radiologie, Laboratoire, Pharmacie" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setEditDialog({ open: false, hospital: null })} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Save />}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Gestion des lits ─────────────────────────────────────────────────────────
const BedManagementTab: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [hospitalId, setHospitalId] = useState('');
  const [beds, setBeds] = useState<any[]>([]);
  const [wardStats, setWardStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [newBed, setNewBed] = useState({ bedNumber: '', ward: '', bedType: 'STANDARD' });
  const [updateDialog, setUpdateDialog] = useState<{ open: boolean; bed: any }>({ open: false, bed: null });
  const [updateForm, setUpdateForm] = useState({ status: '', patientName: '', notes: '' });

  useEffect(() => { api.get('/hospitals').then(r => setHospitals(r.data.data)); }, []);

  const loadBeds = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await api.get(`/beds/hospital/${id}`);
      setBeds(r.data.data);
      setWardStats(r.data.stats ?? {});
    } finally { setLoading(false); }
  }, []);

  const selectHospital = (id: string) => { setHospitalId(id); loadBeds(id); };

  const addBed = async () => {
    try {
      await api.post('/beds', { ...newBed, hospitalId });
      toast.success('Lit créé');
      setAddDialog(false);
      setNewBed({ bedNumber: '', ward: '', bedType: 'STANDARD' });
      loadBeds(hospitalId);
    } catch { toast.error('Erreur'); }
  };

  const updateBed = async () => {
    try {
      await api.put(`/beds/${updateDialog.bed.id}`, updateForm);
      toast.success('Statut mis à jour');
      setUpdateDialog({ open: false, bed: null });
      loadBeds(hospitalId);
    } catch { toast.error('Erreur'); }
  };

  const statusBg: Record<string, string> = { AVAILABLE: '#D1FAE5', OCCUPIED: '#FEE2E2', MAINTENANCE: '#FEF3C7', RESERVED: '#EEF3FF' };
  const statusBorder: Record<string, string> = { AVAILABLE: '#6EE7B7', OCCUPIED: '#FCA5A5', MAINTENANCE: '#FCD34D', RESERVED: '#A5B4FC' };
  const statusLabel: Record<string, string> = { AVAILABLE: 'Disponible', OCCUPIED: 'Occupé', MAINTENANCE: 'Maintenance', RESERVED: 'Réservé' };

  const byWard = beds.reduce((acc: Record<string, any[]>, b) => { (acc[b.ward] ??= []).push(b); return acc; }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Gestion des lits</Typography>
          <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>{beds.length} lit(s) au total</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select value={hospitalId} onChange={e => selectHospital(e.target.value)} displayEmpty
              sx={{ borderRadius: 2, fontSize: 13.5, bgcolor: '#fff', border: '1px solid #E2E8F0' }}>
              <MenuItem value=""><em>Choisir un hôpital</em></MenuItem>
              {hospitals.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
            </Select>
          </FormControl>
          {hospitalId && <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialog(true)} sx={{ borderRadius: 2 }}>Ajouter un lit</Button>}
        </Box>
      </Box>

      {!hospitalId ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 10, textAlign: 'center' }}>
          <Hotel sx={{ fontSize: 52, color: '#CBD5E0', mb: 2 }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Sélectionnez un hôpital pour afficher ses lits</Typography>
        </Paper>
      ) : loading ? (
        <Box textAlign="center" py={8}><CircularProgress /></Box>
      ) : beds.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 8, textAlign: 'center' }}>
          <Hotel sx={{ fontSize: 48, color: '#CBD5E0', mb: 1.5 }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucun lit enregistré pour cet hôpital</Typography>
        </Paper>
      ) : (
        <>
          {/* Ward summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.entries(wardStats).map(([ward, s]: [string, any]) => (
              <Grid item xs={12} sm={6} md={3} key={ward}>
                <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                  <CardContent sx={{ p: '16px !important' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0F2D52', mb: 1 }}>{ward}</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#38A169' }}>{s.available}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#9CA3AF' }}>Libres</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#E53E3E' }}>{s.occupied}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#9CA3AF' }}>Occupés</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#D69E2E' }}>{s.maintenance}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#9CA3AF' }}>Maint.</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', ml: 'auto' }}>
                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#4A5568' }}>{s.total}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#9CA3AF' }}>Total</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ height: 5, borderRadius: 99, bgcolor: '#E2E8F0', overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', borderRadius: 99, bgcolor: '#E53E3E', width: `${s.total ? (s.occupied / s.total) * 100 : 0}%` }} />
                    </Box>
                    <Typography sx={{ fontSize: 10.5, color: '#9CA3AF', mt: 0.3 }}>
                      {s.total ? Math.round((s.occupied / s.total) * 100) : 0}% d'occupation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Beds by ward */}
          {Object.entries(byWard).map(([ward, wardBeds]) => (
            <Paper key={ward} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden', mb: 2 }}>
              <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0F2D52' }}>Service : {ward}</Typography>
                <Chip label={`${wardBeds.length} lits`} size="small" sx={{ bgcolor: '#EEF3FF', color: '#0F2D52', fontWeight: 700 }} />
                <Chip label={`${wardBeds.filter(b => b.status === 'AVAILABLE').length} libres`} size="small" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 700 }} />
              </Box>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={1.5}>
                  {wardBeds.map(b => (
                    <Grid item xs={6} sm={4} md={3} key={b.id}>
                      <Box onClick={() => { setUpdateDialog({ open: true, bed: b }); setUpdateForm({ status: b.status, patientName: b.patientName ?? '', notes: b.notes ?? '' }); }}
                        sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${statusBorder[b.status] ?? '#E2E8F0'}`, bgcolor: statusBg[b.status] ?? '#F8FAFC', cursor: 'pointer', '&:hover': { filter: 'brightness(0.97)' } }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#0F2D52' }}>Lit {b.bedNumber}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#64748B' }}>{b.bedType}</Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 600, mt: 0.5, color: b.status === 'AVAILABLE' ? '#065F46' : b.status === 'OCCUPIED' ? '#C53030' : '#92400E' }}>
                          {statusLabel[b.status] ?? b.status}
                        </Typography>
                        {b.patientName && <Typography sx={{ fontSize: 10.5, color: '#4A5568', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.patientName}</Typography>}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          ))}
        </>
      )}

      <Dialog open={addDialog} onClose={() => setAddDialog(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>Ajouter un lit</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0, minWidth: 380 }}>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>N° lit *</Typography>
              <TextField fullWidth size="small" value={newBed.bedNumber} onChange={e => setNewBed(b => ({ ...b, bedNumber: e.target.value }))} placeholder="ex. 101" />
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Service *</Typography>
              <TextField fullWidth size="small" value={newBed.ward} onChange={e => setNewBed(b => ({ ...b, ward: e.target.value }))} placeholder="ex. Cardiologie" />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Type</Typography>
              <TextField fullWidth size="small" select value={newBed.bedType} onChange={e => setNewBed(b => ({ ...b, bedType: e.target.value }))}>
                {[['STANDARD','Standard'],['ICU','Soins intensifs'],['PEDIATRIC','Pédiatrique'],['MATERNITY','Maternité'],['ISOLATION','Isolement'],['EMERGENCY','Urgences']].map(([v, l]) => (
                  <MenuItem key={v} value={v}>{l}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAddDialog(false)} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={addBed} disabled={!newBed.bedNumber || !newBed.ward}>Créer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={updateDialog.open} onClose={() => setUpdateDialog({ open: false, bed: null })} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          Lit {updateDialog.bed?.bedNumber} · {updateDialog.bed?.ward}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0, minWidth: 360 }}>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Statut</Typography>
              <TextField fullWidth size="small" select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}>
                {[['AVAILABLE','Disponible'],['OCCUPIED','Occupé'],['MAINTENANCE','Maintenance'],['RESERVED','Réservé']].map(([v, l]) => (
                  <MenuItem key={v} value={v}>{l}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {updateForm.status === 'OCCUPIED' && (
              <Grid item xs={12}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Nom du patient</Typography>
                <TextField fullWidth size="small" value={updateForm.patientName} onChange={e => setUpdateForm(f => ({ ...f, patientName: e.target.value }))} />
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75, color: '#374151' }}>Notes</Typography>
              <TextField fullWidth size="small" multiline rows={2} value={updateForm.notes} onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setUpdateDialog({ open: false, bed: null })} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={updateBed}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Inventaire ────────────────────────────────────────────────────────────────
// ── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'MEDICAMENT',  label: 'Médicament',   color: '#E0F2FE', text: '#0369A1' },
  { value: 'CONSOMMABLE', label: 'Consommable',   color: '#DCFCE7', text: '#15803D' },
  { value: 'EQUIPEMENT',  label: 'Équipement',    color: '#F3E8FF', text: '#7C3AED' },
  { value: 'REACTIF',     label: 'Réactif',       color: '#FEF9C3', text: '#A16207' },
];

const MOVEMENT_TYPES = [
  { value: 'IN',         label: 'Entrée (réapprovisionnement)', color: '#16A34A' },
  { value: 'OUT',        label: 'Sortie (consommation)',         color: '#DC2626' },
  { value: 'RETURNED',   label: 'Retour fournisseur',           color: '#D97706' },
  { value: 'ADJUSTMENT', label: 'Ajustement inventaire',        color: '#6366F1' },
  { value: 'EXPIRED',    label: 'Périmé / retiré',              color: '#64748B' },
];

const catMeta = (cat: string) =>
  CATEGORIES.find(c => c.value === cat) ?? { label: cat, color: '#F1F5F9', text: '#475569' };

const movMeta = (type: string) =>
  MOVEMENT_TYPES.find(t => t.value === type) ?? { label: type, color: '#64748B' };

const isExpiringSoon = (d: string | null) => {
  if (!d) return false;
  const days = (new Date(d).getTime() - Date.now()) / 86400000;
  return days > 0 && days <= 90;
};
const isExpired = (d: string | null) =>
  d ? new Date(d) < new Date() : false;

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const BLANK_FORM = {
  name: '', reference: '', category: 'MEDICAMENT', unit: 'unité',
  quantity: '', minThreshold: '10', supplier: '', unitCost: '', expiryDate: '',
};

const InventoryTab: React.FC = () => {
  const [hospitals,     setHospitals]     = useState<any[]>([]);
  const [hospitalId,    setHospitalId]    = useState('');
  const [items,         setItems]         = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading,       setLoading]       = useState(false);

  // Filters
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('ALL');
  const [onlyLow,      setOnlyLow]      = useState(false);

  // Dialogs
  const [formDialog,  setFormDialog]  = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [form,        setForm]        = useState({ ...BLANK_FORM });
  const [movDialog,   setMovDialog]   = useState<{ open: boolean; item: any }>({ open: false, item: null });
  const [movement,    setMovement]    = useState({ type: 'IN', quantity: '', reason: '' });
  const [histDialog,  setHistDialog]  = useState<{ open: boolean; item: any }>({ open: false, item: null });
  const [delConfirm,  setDelConfirm]  = useState<{ open: boolean; item: any }>({ open: false, item: null });

  useEffect(() => {
    api.get('/hospitals').then(r => setHospitals(r.data.data));
  }, []);

  const loadInventory = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const r = await api.get(`/inventory/hospital/${id}`);
      setItems(r.data.data);
      setLowStockCount(r.data.lowStockCount ?? 0);
    } finally { setLoading(false); }
  }, []);

  const selectHospital = (id: string) => { setHospitalId(id); loadInventory(id); };

  // KPIs
  const kpi = useMemo(() => {
    const totalVal = items.reduce((s, i) => s + (i.unitCost ?? 0) * i.quantity, 0);
    const expiredSoon = items.filter(i => isExpiringSoon(i.expiryDate)).length;
    const expired     = items.filter(i => isExpired(i.expiryDate)).length;
    return { total: items.length, totalVal, lowStockCount, expiredSoon, expired };
  }, [items, lowStockCount]);

  // Filtered list
  const filtered = useMemo(() => items.filter(i => {
    if (catFilter !== 'ALL' && i.category !== catFilter) return false;
    if (onlyLow && !i.isLowStock) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) &&
        !(i.reference ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, catFilter, onlyLow, search]);

  // Open create / edit dialog
  const openCreate = () => {
    setForm({ ...BLANK_FORM });
    setFormDialog({ open: true, item: null });
  };
  const openEdit = (item: any) => {
    setForm({
      name: item.name ?? '', reference: item.reference ?? '',
      category: item.category ?? 'MEDICAMENT', unit: item.unit ?? 'unité',
      quantity: String(item.quantity ?? 0), minThreshold: String(item.minThreshold ?? 10),
      supplier: item.supplier ?? '', unitCost: item.unitCost != null ? String(item.unitCost) : '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
    });
    setFormDialog({ open: true, item });
  };

  const saveItem = async () => {
    const payload = {
      name: form.name, reference: form.reference || null, category: form.category,
      unit: form.unit, quantity: Number(form.quantity), minThreshold: Number(form.minThreshold),
      supplier: form.supplier || null,
      unitCost: form.unitCost !== '' ? Number(form.unitCost) : null,
      expiryDate: form.expiryDate || null,
    };
    try {
      if (formDialog.item) {
        await api.put(`/inventory/${formDialog.item.id}`, payload);
        toast.success('Article mis à jour');
      } else {
        await api.post('/inventory', { ...payload, hospitalId });
        toast.success('Article créé');
      }
      setFormDialog({ open: false, item: null });
      loadInventory(hospitalId);
    } catch { toast.error('Erreur lors de la sauvegarde'); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/inventory/${delConfirm.item.id}`);
      toast.success('Article supprimé');
      setDelConfirm({ open: false, item: null });
      loadInventory(hospitalId);
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const recordMovement = async () => {
    try {
      await api.post('/inventory/movement', {
        itemId: movDialog.item.id, type: movement.type,
        quantity: Number(movement.quantity), reason: movement.reason,
      });
      toast.success('Mouvement enregistré');
      setMovDialog({ open: false, item: null });
      setMovement({ type: 'IN', quantity: '', reason: '' });
      loadInventory(hospitalId);
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Erreur'); }
  };

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Inventaire des hôpitaux</Typography>
          <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>
            Gestion des stocks, mouvements et alertes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select value={hospitalId} onChange={e => selectHospital(e.target.value)} displayEmpty
              sx={{ borderRadius: 2, fontSize: 13.5, bgcolor: '#fff', border: '1px solid #E2E8F0' }}>
              <MenuItem value=""><em>Choisir un hôpital</em></MenuItem>
              {hospitals.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
            </Select>
          </FormControl>
          {hospitalId && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}
              sx={{ borderRadius: 2, bgcolor: '#0F2D52' }}>
              Nouvel article
            </Button>
          )}
        </Box>
      </Box>

      {!hospitalId ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 10, textAlign: 'center' }}>
          <Inventory2 sx={{ fontSize: 52, color: '#CBD5E0', mb: 2 }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>
            Sélectionnez un hôpital pour afficher l'inventaire
          </Typography>
        </Paper>
      ) : loading ? (
        <Box textAlign="center" py={8}><CircularProgress /></Box>
      ) : (
        <>
          {/* KPI cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Articles en stock', value: kpi.total, icon: <Inventory2 />, color: '#0F2D52', bg: '#EEF3FF' },
              { label: 'Valeur totale estimée', value: `${kpi.totalVal.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} FCFA`, icon: <AttachMoney />, color: '#15803D', bg: '#DCFCE7' },
              { label: 'Stock faible / rupture', value: kpi.lowStockCount, icon: <TrendingDown />, color: '#DC2626', bg: '#FEE2E2', alert: kpi.lowStockCount > 0 },
              { label: 'Expiration imminente', value: kpi.expiredSoon, icon: <EventBusy />, color: '#D97706', bg: '#FEF9C3', alert: kpi.expiredSoon > 0 },
            ].map((k, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card elevation={0} sx={{ border: `1px solid ${k.alert ? k.color + '50' : '#E2E8F0'}`, borderRadius: 3, bgcolor: k.alert ? k.bg : '#fff' }}>
                  <CardContent sx={{ p: '16px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {React.cloneElement(k.icon, { sx: { fontSize: 20, color: k.color } })}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{k.label}</Typography>
                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Alert banners */}
          {kpi.lowStockCount > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid #FED7AA', borderRadius: 2, p: 2, mb: 1.5, bgcolor: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Warning sx={{ color: '#D69E2E', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: '#92400E' }}>
                {kpi.lowStockCount} article(s) sous le seuil minimum — réapprovisionnement requis
              </Typography>
            </Paper>
          )}
          {kpi.expired > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid #FECACA', borderRadius: 2, p: 2, mb: 2, bgcolor: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EventBusy sx={{ color: '#DC2626', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: '#991B1B' }}>
                {kpi.expired} article(s) périmé(s) — à retirer immédiatement
              </Typography>
            </Paper>
          )}

          {/* Filter bar */}
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 1.5, mb: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Rechercher nom ou référence…"
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94A3B8' }} /></InputAdornment> }}
              sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13.5 } }} />

            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {[{ value: 'ALL', label: 'Tous' }, ...CATEGORIES].map(c => (
                <Chip key={c.value} label={c.label} size="small" clickable
                  onClick={() => setCatFilter(c.value)}
                  sx={{
                    fontWeight: catFilter === c.value ? 700 : 400,
                    bgcolor: catFilter === c.value ? '#0F2D52' : '#F1F5F9',
                    color: catFilter === c.value ? '#fff' : '#475569',
                    '&:hover': { bgcolor: catFilter === c.value ? '#0F2D52' : '#E2E8F0' },
                  }} />
              ))}
            </Box>

            <Chip label="Stock faible" size="small" clickable icon={<FilterList sx={{ fontSize: 15 }} />}
              onClick={() => setOnlyLow(v => !v)}
              sx={{
                fontWeight: onlyLow ? 700 : 400,
                bgcolor: onlyLow ? '#FEE2E2' : '#F1F5F9',
                color: onlyLow ? '#DC2626' : '#475569',
                ml: 'auto',
              }} />
          </Paper>

          {/* Table */}
          {filtered.length === 0 ? (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 6, textAlign: 'center' }}>
              <Inventory2 sx={{ fontSize: 40, color: '#CBD5E0', mb: 1 }} />
              <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucun article correspondant</Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Article</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Catégorie</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Stock</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Fournisseur</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Coût unit.</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Expiration</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, color: '#64748B' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map(item => {
                    const expSoon = isExpiringSoon(item.expiryDate);
                    const expired = isExpired(item.expiryDate);
                    const cat = catMeta(item.category);
                    const stockPct = Math.min(100, item.minThreshold > 0
                      ? (item.quantity / (item.minThreshold * 2)) * 100
                      : 100);
                    return (
                      <TableRow key={item.id} sx={{
                        '&:hover': { bgcolor: '#F8FAFC' },
                        bgcolor: expired ? 'rgba(254,226,226,0.4)' : item.isLowStock ? 'rgba(254,243,199,0.4)' : 'transparent',
                      }}>
                        {/* Article */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            {item.isLowStock && <Warning sx={{ fontSize: 15, color: '#D69E2E', mt: 0.3 }} />}
                            {expired && <EventBusy sx={{ fontSize: 15, color: '#DC2626', mt: 0.3 }} />}
                            <Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{item.name}</Typography>
                              {item.reference && (
                                <Typography sx={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                                  Réf. {item.reference}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Catégorie */}
                        <TableCell>
                          <Chip label={cat.label} size="small"
                            sx={{ bgcolor: cat.color, color: cat.text, fontWeight: 600, fontSize: 11 }} />
                        </TableCell>

                        {/* Stock */}
                        <TableCell sx={{ minWidth: 130 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ height: 5, borderRadius: 3, bgcolor: '#E2E8F0', overflow: 'hidden', mb: 0.5 }}>
                                <Box sx={{
                                  height: '100%', borderRadius: 3,
                                  width: `${stockPct}%`,
                                  bgcolor: item.isLowStock ? '#DC2626' : '#16A34A',
                                  transition: 'width .3s',
                                }} />
                              </Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: item.isLowStock ? '#DC2626' : '#0F2D52' }}>
                                {item.quantity} <span style={{ fontWeight: 400, color: '#94A3B8' }}>{item.unit}</span>
                              </Typography>
                              <Typography sx={{ fontSize: 10.5, color: '#94A3B8' }}>
                                min. {item.minThreshold} {item.unit}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Fournisseur */}
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5, color: '#475569' }}>
                            {item.supplier || '—'}
                          </Typography>
                        </TableCell>

                        {/* Coût */}
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5, color: '#475569' }}>
                            {item.unitCost != null ? `${item.unitCost.toLocaleString('fr-FR')} F` : '—'}
                          </Typography>
                        </TableCell>

                        {/* Expiration */}
                        <TableCell>
                          <Typography sx={{
                            fontSize: 12.5,
                            color: expired ? '#DC2626' : expSoon ? '#D97706' : '#475569',
                            fontWeight: (expired || expSoon) ? 600 : 400,
                          }}>
                            {fmtDate(item.expiryDate)}
                          </Typography>
                          {expired && <Typography sx={{ fontSize: 10.5, color: '#DC2626' }}>Périmé</Typography>}
                          {!expired && expSoon && <Typography sx={{ fontSize: 10.5, color: '#D97706' }}>Bientôt</Typography>}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <IconButton size="small" title="Historique"
                              onClick={() => setHistDialog({ open: true, item })}
                              sx={{ color: '#6366F1' }}>
                              <History sx={{ fontSize: 17 }} />
                            </IconButton>
                            <IconButton size="small" title="Mouvement de stock"
                              onClick={() => { setMovDialog({ open: true, item }); setMovement({ type: 'IN', quantity: '', reason: '' }); }}
                              sx={{ color: '#16A34A' }}>
                              <Add sx={{ fontSize: 17 }} />
                            </IconButton>
                            <IconButton size="small" title="Modifier" onClick={() => openEdit(item)}
                              sx={{ color: '#0F2D52' }}>
                              <Edit sx={{ fontSize: 17 }} />
                            </IconButton>
                            <IconButton size="small" title="Supprimer"
                              onClick={() => setDelConfirm({ open: true, item })}
                              sx={{ color: '#DC2626' }}>
                              <Delete sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}

      {/* ── Créer / Modifier article ─────────────────────────────────────────── */}
      <Dialog open={formDialog.open} onClose={() => setFormDialog({ open: false, item: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          {formDialog.item ? 'Modifier l\'article' : 'Nouvel article'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={8}>
              <TextField fullWidth size="small" label="Nom *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth size="small" label="Référence" value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" select label="Catégorie *" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Unité" value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="boîtes, flacons, ampoules…" />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth size="small" label="Quantité *" type="number" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth size="small" label="Seuil min. *" type="number" value={form.minThreshold}
                onChange={e => setForm(f => ({ ...f, minThreshold: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth size="small" label="Coût unitaire (FCFA)" type="number" value={form.unitCost}
                onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Fournisseur" value={form.supplier}
                onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Date d'expiration" type="date"
                value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setFormDialog({ open: false, item: null })} variant="outlined"
            sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={saveItem}
            disabled={!form.name || !form.quantity || !form.minThreshold}
            sx={{ bgcolor: '#0F2D52' }}>
            {formDialog.item ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Mouvement de stock ────────────────────────────────────────────────── */}
      <Dialog open={movDialog.open} onClose={() => setMovDialog({ open: false, item: null })}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          Mouvement — {movDialog.item?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontSize: 13, color: '#64748B' }}>
              Stock actuel : <strong style={{ color: movDialog.item?.isLowStock ? '#DC2626' : '#0F2D52' }}>
                {movDialog.item?.quantity} {movDialog.item?.unit}
              </strong>
              {' '}· Seuil min. : {movDialog.item?.minThreshold} {movDialog.item?.unit}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" select label="Type de mouvement *" value={movement.type}
                onChange={e => setMovement(m => ({ ...m, type: e.target.value }))}>
                {MOVEMENT_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color }} />
                      {t.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Quantité *" type="number" value={movement.quantity}
                onChange={e => setMovement(m => ({ ...m, quantity: e.target.value }))} />
              {movement.quantity && movDialog.item && (
                <Typography sx={{ fontSize: 11.5, color: '#64748B', mt: 0.5 }}>
                  Nouveau stock estimé :{' '}
                  <strong>
                    {['IN', 'RETURNED'].includes(movement.type)
                      ? movDialog.item.quantity + Number(movement.quantity)
                      : Math.max(0, movDialog.item.quantity - Number(movement.quantity))
                    } {movDialog.item.unit}
                  </strong>
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Motif / Commentaire" value={movement.reason}
                onChange={e => setMovement(m => ({ ...m, reason: e.target.value }))}
                placeholder="Livraison fournisseur, Bloc opératoire, Ajustement…" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setMovDialog({ open: false, item: null })} variant="outlined"
            sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={recordMovement} disabled={!movement.quantity}
            sx={{ bgcolor: movMeta(movement.type).color }}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Historique des mouvements ─────────────────────────────────────────── */}
      <Dialog open={histDialog.open} onClose={() => setHistDialog({ open: false, item: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          Historique — {histDialog.item?.name}
        </DialogTitle>
        <DialogContent>
          {(histDialog.item?.movements ?? []).length === 0 ? (
            <Typography sx={{ color: '#94A3B8', fontSize: 13.5, py: 2, textAlign: 'center' }}>
              Aucun mouvement enregistré
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Qté</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Motif</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(histDialog.item?.movements ?? []).map((mv: any) => {
                  const mt = movMeta(mv.type);
                  return (
                    <TableRow key={mv.id}>
                      <TableCell sx={{ fontSize: 12 }}>
                        {new Date(mv.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Chip label={mt.label} size="small"
                          sx={{ bgcolor: mt.color + '22', color: mt.color, fontWeight: 600, fontSize: 10.5 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: mt.color }}>
                          {['IN', 'RETURNED'].includes(mv.type) ? '+' : '-'}{mv.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#64748B' }}>
                        {mv.reason || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHistDialog({ open: false, item: null })}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmation suppression ─────────────────────────────────────────── */}
      <Dialog open={delConfirm.open} onClose={() => setDelConfirm({ open: false, item: null })}
        maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626' }}>Supprimer l'article</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#374151' }}>
            Êtes-vous sûr de vouloir supprimer <strong>«{delConfirm.item?.name}»</strong> ?
            Cette action supprimera aussi tout l'historique de ses mouvements.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDelConfirm({ open: false, item: null })} variant="outlined"
            sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" color="error" onClick={doDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Souscriptions (Admin) ─────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Active',    color: '#15803D', bg: '#DCFCE7' },
  EXPIRED:   { label: 'Expirée',   color: '#DC2626', bg: '#FEE2E2' },
  CANCELLED: { label: 'Annulée',   color: '#D97706', bg: '#FEF9C3' },
  PENDING:   { label: 'En attente',color: '#6366F1', bg: '#EEF2FF' },
};

const METHOD_LABELS: Record<string, string> = {
  ORANGE_MONEY: '🟠 Orange Money',
  WAVE:         '🔵 Wave',
  CARD:         '💳 Carte',
  APPLE_PAY:    '🍎 Apple Pay',
  GOOGLE_PAY:   '🔴 Google Pay',
};

const SubscriptionsTab: React.FC = () => {
  const [subs,    setSubs]    = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusF, setStatusF] = useState('');
  const [planF,   setPlanF]   = useState('');
  const [updDlg,  setUpdDlg]  = useState<{ open: boolean; sub: any }>({ open: false, sub: null });
  const [newStatus, setNewStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await subscriptionService.getAll({
        ...(statusF && { status: statusF }),
        ...(planF   && { plan: planF }),
        limit: 50,
      });
      setSubs(r.data);
      setTotal(r.total);
      setRevenue(r.revenue ?? 0);
    } finally { setLoading(false); }
  }, [statusF, planF]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async () => {
    try {
      await subscriptionService.updateStatus(updDlg.sub.id, newStatus);
      toast.success('Statut mis à jour');
      setUpdDlg({ open: false, sub: null });
      load();
    } catch { toast.error('Erreur'); }
  };

  const kpi = useMemo(() => ({
    active:    subs.filter(s => s.status === 'ACTIVE').length,
    expired:   subs.filter(s => s.status === 'EXPIRED').length,
    cancelled: subs.filter(s => s.status === 'CANCELLED').length,
    doctors:   subs.filter(s => s.plan === 'DOCTOR').length,
    patients:  subs.filter(s => s.plan === 'PATIENT').length,
  }), [subs]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52' }}>Souscriptions</Typography>
          <Typography sx={{ color: '#64748B', fontSize: 13.5, mt: 0.3 }}>
            {total} souscription(s) · Revenus : {revenue.toLocaleString('fr-FR')} FCFA
          </Typography>
        </Box>
      </Box>

      {/* KPI */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total',         value: total,        color: '#0F2D52', bg: '#EEF3FF' },
          { label: 'Actives',       value: kpi.active,   color: '#15803D', bg: '#DCFCE7' },
          { label: 'Revenus FCFA',  value: revenue.toLocaleString('fr-FR'), color: '#D97706', bg: '#FEF9C3' },
          { label: 'Expirées',      value: kpi.expired,  color: '#DC2626', bg: '#FEE2E2' },
          { label: 'Médecins',      value: kpi.doctors,  color: '#7C3AED', bg: '#F3E8FF' },
          { label: 'Patients',      value: kpi.patients, color: '#0891B2', bg: '#E0F7FA' },
        ].map((k, i) => (
          <Grid item xs={6} sm={4} md={2} key={i}>
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, bgcolor: k.bg }}>
              <CardContent sx={{ p: '14px !important', textAlign: 'center' }}>
                <Typography sx={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filtres */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 1.5, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select value={statusF} onChange={e => setStatusF(e.target.value)} displayEmpty
            sx={{ fontSize: 13.5, borderRadius: 2 }}>
            <MenuItem value=""><em>Tous les statuts</em></MenuItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={planF} onChange={e => setPlanF(e.target.value)} displayEmpty
            sx={{ fontSize: 13.5, borderRadius: 2 }}>
            <MenuItem value=""><em>Tous les plans</em></MenuItem>
            <MenuItem value="PATIENT">Patient (5 000 F)</MenuItem>
            <MenuItem value="DOCTOR">Médecin (15 000 F)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      {loading ? (
        <Box textAlign="center" py={8}><CircularProgress /></Box>
      ) : subs.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, py: 8, textAlign: 'center' }}>
          <CardMembership sx={{ fontSize: 48, color: '#CBD5E0', mb: 1 }} />
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucune souscription</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['Utilisateur', 'Plan', 'N° Souscription', 'Montant', 'Méthode', 'Début', 'Fin', 'Statut', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11.5, color: '#64748B' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {subs.map(s => {
                const st = STATUS_LABELS[s.status] ?? { label: s.status, color: '#64748B', bg: '#F1F5F9' };
                const daysLeft = s.endDate
                  ? Math.max(0, Math.floor((new Date(s.endDate).getTime() - Date.now()) / 86400000))
                  : 0;
                return (
                  <TableRow key={s.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {s.user?.firstName} {s.user?.lastName}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>{s.user?.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small"
                        label={s.plan === 'DOCTOR' ? 'Médecin' : 'Patient'}
                        sx={{ bgcolor: s.plan === 'DOCTOR' ? '#F3E8FF' : '#E0F7FA', color: s.plan === 'DOCTOR' ? '#7C3AED' : '#0891B2', fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#0F2D52', letterSpacing: 0.5 }}>
                        {s.subscriptionNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {s.amount.toLocaleString('fr-FR')} F
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12.5 }}>
                      {METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#64748B' }}>
                      {s.startDate ? new Date(s.startDate).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, color: daysLeft <= 30 && s.status === 'ACTIVE' ? '#D97706' : '#64748B', fontWeight: daysLeft <= 30 && s.status === 'ACTIVE' ? 700 : 400 }}>
                        {s.endDate ? new Date(s.endDate).toLocaleDateString('fr-FR') : '—'}
                      </Typography>
                      {s.status === 'ACTIVE' && daysLeft <= 30 && (
                        <Typography sx={{ fontSize: 10.5, color: '#D97706' }}>{daysLeft}j restants</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={st.label}
                        sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setUpdDlg({ open: true, sub: s }); setNewStatus(s.status); }}
                        sx={{ borderRadius: 1.5, fontSize: 11.5 }}>
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Update status dialog */}
      <Dialog open={updDlg.open} onClose={() => setUpdDlg({ open: false, sub: null })}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F2D52' }}>
          Modifier le statut — {updDlg.sub?.user?.firstName} {updDlg.sub?.user?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12, color: '#64748B', mb: 1.5 }}>
            N° {updDlg.sub?.subscriptionNumber}
          </Typography>
          <TextField fullWidth size="small" select label="Nouveau statut" value={newStatus}
            onChange={e => setNewStatus(e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <MenuItem key={v} value={v}>{l.label}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setUpdDlg({ open: false, sub: null })} variant="outlined"
            sx={{ borderColor: '#E2E8F0', color: '#374151' }}>Annuler</Button>
          <Button variant="contained" onClick={updateStatus} sx={{ bgcolor: '#0F2D52' }}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Profil Admin éditable ─────────────────────────────────────────────────────
const ProfileTab: React.FC = () => {
  const user = authService.getCurrentUser();

  const [prof, setProf] = useState({
    firstName: user?.profile?.firstName ?? '',
    lastName:  user?.profile?.lastName  ?? '',
    phone:     user?.profile?.phone     ?? '',
    city:      user?.profile?.city      ?? '',
    region:    user?.profile?.region    ?? '',
  });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false });
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const FL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: '#374151' }}>{children}</Typography>
  );

  const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 18, color: '#00A896' } })}
      <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: '#0F2D52' }}>{title}</Typography>
    </Box>
  );

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({ profile: prof });
      toast.success('Profil mis à jour');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Erreur');
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

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F2D52', mb: 3 }}>Mon profil</Typography>

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
            <Grid item xs={12}>
              <FL>Email (non modifiable)</FL>
              <TextField fullWidth size="small" value={user?.email ?? ''} disabled
                sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#9CA3AF' } }} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained"
              startIcon={saving ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : <Save />}
              onClick={saveProfile} disabled={saving} sx={{ borderRadius: 2 }}>
              Enregistrer
            </Button>
          </Box>
        </Box>
      </Paper>

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

// ── Dashboard Admin ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F4F6F9' }}>
      <Sidebar tab={tab} setTab={setTab} />
      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {tab === 0 && <StatsTab />}
        {tab === 1 && <DoctorsTab />}
        {tab === 2 && <PatientsTab />}
        {tab === 3 && <HospitalsTab />}
        {tab === 4 && <BedManagementTab />}
        {tab === 5 && <InventoryTab />}
        {tab === 6 && <SubscriptionsTab />}
        {tab === 7 && <ProfileTab />}
      </Box>
    </Box>
  );
};

export default AdminDashboard;
