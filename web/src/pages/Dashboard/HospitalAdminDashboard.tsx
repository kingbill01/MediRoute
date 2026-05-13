import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  CircularProgress, TextField, MenuItem, Divider, Paper,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar, Alert,
  Switch, FormControlLabel,
} from '@mui/material';
import {
  Business, Bed, Inventory, LocalHospital, ExitToApp, Save,
  CheckCircle, Pending, Cancel as CancelIcon, Edit, People, Phone,
  LocationOn, Email, Language, FiberManualRecord,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import facilityService from '../../services/facilityService';
import ChatbotWidget from '../../components/ChatbotWidget';
import { toast } from 'react-toastify';
import { ROUTES } from '../../config/constants';

const NAV = [
  { id: 0, icon: <Business />,      label: 'Mon établissement' },
  { id: 1, icon: <Bed />,           label: 'Gestion des lits' },
  { id: 2, icon: <Inventory />,     label: 'Inventaire' },
  { id: 3, icon: <People />,        label: 'Médecins affiliés' },
];

// ── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{ tab: number; setTab: (n: number) => void; facilityName: string }> = ({ tab, setTab, facilityName }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{
      width: 250, flexShrink: 0, bgcolor: '#0F2D52', display: 'flex',
      flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: '#00A896', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LocalHospital sx={{ color: '#fff', fontSize: 21 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>MediRoute</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Espace Hôpital</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      <Box sx={{ px: 2, py: 2 }}>
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13 }} noWrap>{facilityName}</Typography>
      </Box>

      <Box sx={{ p: 1.5, flex: 1 }}>
        {NAV.map(n => (
          <Box key={n.id} onClick={() => setTab(n.id)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, px: 1.8, py: 1.3, borderRadius: 2,
              cursor: 'pointer', mb: 0.5,
              bgcolor: tab === n.id ? 'rgba(0,168,150,0.15)' : 'transparent',
              color: tab === n.id ? '#fff' : 'rgba(255,255,255,0.6)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: '#fff' },
            }}>
            {n.icon}
            <Typography sx={{ fontSize: 13, fontWeight: tab === n.id ? 600 : 400 }}>{n.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 2 }}>
        <Button fullWidth startIcon={<ExitToApp />}
          onClick={() => { authService.logout(); navigate(ROUTES.LOGIN); }}
          sx={{ color: 'rgba(255,255,255,0.6)', justifyContent: 'flex-start', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: '#fff' } }}>
          Déconnexion
        </Button>
      </Box>
    </Box>
  );
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  PENDING:   { bg: '#fff3e0', color: '#e65100', label: 'En attente de validation', icon: <Pending sx={{ fontSize: 16 }} /> },
  APPROVED:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Validé', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
  REJECTED:  { bg: '#ffebee', color: '#c62828', label: 'Rejeté', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
  SUSPENDED: { bg: '#fafafa', color: '#616161', label: 'Suspendu', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
};

// ── Profile Tab ──────────────────────────────────────────────────────────────
const ProfileTab: React.FC<{ facility: any; reload: () => void }> = ({ facility, reload }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({ ...facility });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm({ ...facility }); }, [facility]);

  const save = async () => {
    setSaving(true);
    try {
      await facilityService.updateMyFacility({
        name: form.name, phone: form.phone, emergencyPhone: form.emergencyPhone,
        email: form.email, website: form.website, description: form.description,
        address: form.address, totalBeds: form.totalBeds,
        ambulanceAvailable: form.ambulanceAvailable, canAcceptEmergency: form.canAcceptEmergency,
      });
      toast.success('Mise à jour réussie');
      setEditing(false);
      reload();
    } catch { toast.error('Erreur lors de la mise à jour'); }
    finally { setSaving(false); }
  };

  const status = STATUS_BADGE[facility.registrationStatus] ?? STATUS_BADGE.PENDING;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0F2D52">{facility.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip label={facility.type?.replace(/_/g, ' ')} size="small" />
            <Chip label={status.label} size="small" icon={status.icon as any}
              sx={{ bgcolor: status.bg, color: status.color, fontWeight: 600 }} />
          </Box>
        </Box>
        {!editing ? (
          <Button startIcon={<Edit />} variant="contained" onClick={() => setEditing(true)}
            sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>Modifier</Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => { setEditing(false); setForm({ ...facility }); }}>Annuler</Button>
            <Button startIcon={<Save />} variant="contained" onClick={save} disabled={saving}
              sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
            </Button>
          </Box>
        )}
      </Box>

      {facility.registrationStatus === 'PENDING' && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Votre inscription est <strong>en attente de validation</strong> par l'administrateur MediRoute. Vous pouvez compléter les informations en attendant.
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* KPIs */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="caption" color="text.secondary">Lits enregistrés</Typography>
            <Typography variant="h4" fontWeight={700} color="#0F2D52">{facility.stats?.totalBeds ?? 0}</Typography>
            <Typography variant="caption" color="#00A896">{facility.stats?.availableBeds ?? 0} disponibles</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="caption" color="text.secondary">Articles inventaire</Typography>
            <Typography variant="h4" fontWeight={700} color="#0F2D52">{facility.stats?.inventoryCount ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="caption" color="text.secondary">Médecins affiliés</Typography>
            <Typography variant="h4" fontWeight={700} color="#0F2D52">{facility.stats?.affiliatedDoctors ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="caption" color="text.secondary">Urgences</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <FiberManualRecord sx={{ fontSize: 14, color: facility.canAcceptEmergency ? '#2e7d32' : '#c62828' }} />
              <Typography fontWeight={600}>{facility.canAcceptEmergency ? 'Ouvertes' : 'Fermées'}</Typography>
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Infos détaillées */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="subtitle1" fontWeight={700} color="#0F2D52" mb={2}>Informations générales</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Nom" value={form.name ?? ''} disabled={!editing}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Total lits" type="number" value={form.totalBeds ?? 0} disabled={!editing}
                  onChange={e => setForm({ ...form, totalBeds: parseInt(e.target.value) || 0 })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Adresse" value={form.address ?? ''} disabled={!editing}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  InputProps={{ startAdornment: <LocationOn fontSize="small" sx={{ mr: 1, color: '#999' }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Téléphone" value={form.phone ?? ''} disabled={!editing}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  InputProps={{ startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: '#999' }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Téléphone urgences" value={form.emergencyPhone ?? ''} disabled={!editing}
                  onChange={e => setForm({ ...form, emergencyPhone: e.target.value })}
                  InputProps={{ startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: '#E63946' }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" value={form.email ?? ''} disabled={!editing}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  InputProps={{ startAdornment: <Email fontSize="small" sx={{ mr: 1, color: '#999' }} /> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Site web" value={form.website ?? ''} disabled={!editing}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  InputProps={{ startAdornment: <Language fontSize="small" sx={{ mr: 1, color: '#999' }} /> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" multiline rows={2} value={form.description ?? ''} disabled={!editing}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel disabled={!editing}
                  control={<Switch checked={!!form.ambulanceAvailable} onChange={e => setForm({ ...form, ambulanceAvailable: e.target.checked })} />}
                  label="Service ambulance" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel disabled={!editing}
                  control={<Switch checked={!!form.canAcceptEmergency} onChange={e => setForm({ ...form, canAcceptEmergency: e.target.checked })} />}
                  label="Accepte les urgences" />
              </Grid>
            </Grid>
          </CardContent></Card>
        </Grid>

        {/* Services & spécialisations */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="subtitle2" fontWeight={700} color="#0F2D52" mb={1.5}>Services</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {(facility.services || []).map((s: string) => (
                <Chip key={s} label={s} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
              ))}
              {(facility.services?.length === 0) && <Typography variant="body2" color="text.secondary">Aucun service renseigné</Typography>}
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="subtitle2" fontWeight={700} color="#0F2D52" mb={1.5}>Spécialisations</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {(facility.specializations || []).map((s: string) => (
                <Chip key={s} label={s} size="small" variant="outlined" sx={{ borderColor: '#0F2D52', color: '#0F2D52' }} />
              ))}
              {(facility.specializations?.length === 0) && <Typography variant="body2" color="text.secondary">Aucune spécialisation</Typography>}
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ── Beds Tab ─────────────────────────────────────────────────────────────────
const BedsTab: React.FC<{ hospitalId: string }> = ({ hospitalId }) => {
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/beds/hospital/${hospitalId}`);
      setBeds(r.data.data || []);
    } catch { toast.error('Impossible de charger les lits'); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (bedId: string, newStatus: string) => {
    try {
      await api.put(`/beds/${bedId}`, { status: newStatus });
      toast.success('Statut mis à jour');
      load();
    } catch { toast.error('Erreur'); }
  };

  const STATUS_COLOR: Record<string, string> = {
    AVAILABLE: '#2e7d32', OCCUPIED: '#c62828', MAINTENANCE: '#f57c00', RESERVED: '#1565c0',
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} color="#0F2D52" mb={3}>Gestion des lits ({beds.length})</Typography>
      {loading ? <CircularProgress sx={{ color: '#00A896' }} /> : beds.length === 0 ? (
        <Alert severity="info">Aucun lit enregistré. Contactez l'administrateur pour ajouter des lits.</Alert>
      ) : (
        <Paper sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead><TableRow sx={{ bgcolor: '#f5f7fa' }}>
              {['N°', 'Service', 'Type', 'Statut', 'Patient', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow></TableHead>
            <TableBody>
              {beds.map(b => (
                <TableRow key={b.id} hover>
                  <TableCell><strong>{b.bedNumber}</strong></TableCell>
                  <TableCell>{b.ward}</TableCell>
                  <TableCell>{b.bedType}</TableCell>
                  <TableCell>
                    <Chip label={b.status} size="small" sx={{ bgcolor: `${STATUS_COLOR[b.status]}22`, color: STATUS_COLOR[b.status], fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>{b.patientName || '—'}</TableCell>
                  <TableCell>
                    <TextField select size="small" value={b.status} onChange={e => updateStatus(b.id, e.target.value)}>
                      <MenuItem value="AVAILABLE">Disponible</MenuItem>
                      <MenuItem value="OCCUPIED">Occupé</MenuItem>
                      <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                      <MenuItem value="RESERVED">Réservé</MenuItem>
                    </TextField>
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

// ── Inventory Tab ────────────────────────────────────────────────────────────
const InventoryTab: React.FC<{ hospitalId: string }> = ({ hospitalId }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/hospital/${hospitalId}`)
      .then(r => setItems(r.data.data || []))
      .catch(() => toast.error('Impossible de charger l\'inventaire'))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} color="#0F2D52" mb={3}>Inventaire ({items.length})</Typography>
      {loading ? <CircularProgress sx={{ color: '#00A896' }} /> : items.length === 0 ? (
        <Alert severity="info">Aucun article enregistré.</Alert>
      ) : (
        <Paper sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead><TableRow sx={{ bgcolor: '#f5f7fa' }}>
              {['Article', 'Catégorie', 'Quantité', 'Seuil min', 'Statut'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow></TableHead>
            <TableBody>
              {items.map(i => (
                <TableRow key={i.id} hover>
                  <TableCell><strong>{i.name}</strong>{i.reference && <Typography variant="caption" color="text.secondary" display="block">{i.reference}</Typography>}</TableCell>
                  <TableCell><Chip label={i.category} size="small" /></TableCell>
                  <TableCell>{i.quantity} {i.unit}</TableCell>
                  <TableCell>{i.minThreshold}</TableCell>
                  <TableCell>
                    {i.quantity <= i.minThreshold
                      ? <Chip label="Stock bas" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828' }} />
                      : <Chip label="OK" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />}
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

// ── Doctors Tab ──────────────────────────────────────────────────────────────
const DoctorsTab: React.FC<{ facility: any }> = ({ facility }) => {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} color="#0F2D52" mb={3}>
        Médecins affiliés ({facility.stats?.affiliatedDoctors ?? 0})
      </Typography>
      {(!facility.doctorAffiliations || facility.doctorAffiliations.length === 0) ? (
        <Alert severity="info">Aucun médecin affilié actuellement. L'administrateur MediRoute peut affilier des médecins à votre établissement.</Alert>
      ) : (
        <Paper sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead><TableRow sx={{ bgcolor: '#f5f7fa' }}>
              {['Médecin', 'Rôle', 'Spécialisation', 'Depuis'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow></TableHead>
            <TableBody>
              {facility.doctorAffiliations.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#00A896' }}>Dr</Avatar>
                      <Typography variant="body2">Dr. {a.doctorId?.slice(0, 8)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={a.role} size="small" /></TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>{new Date(a.joinedAt).toLocaleDateString('fr-FR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const HospitalAdminDashboard: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadFacility = useCallback(() => {
    setLoading(true);
    facilityService.getMyFacility()
      .then(setFacility)
      .catch(() => toast.error('Impossible de charger l\'établissement'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFacility(); }, [loadFacility]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress sx={{ color: '#00A896' }} />
    </Box>;
  }

  if (!facility) return <Alert severity="error" sx={{ m: 4 }}>Établissement introuvable.</Alert>;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F4F6F9' }}>
      <Sidebar tab={tab} setTab={setTab} facilityName={facility.name} />
      <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
        {tab === 0 && <ProfileTab facility={facility} reload={loadFacility} />}
        {tab === 1 && <BedsTab hospitalId={facility.id} />}
        {tab === 2 && <InventoryTab hospitalId={facility.id} />}
        {tab === 3 && <DoctorsTab facility={facility} />}
      </Box>
      <ChatbotWidget />
    </Box>
  );
};

export default HospitalAdminDashboard;
