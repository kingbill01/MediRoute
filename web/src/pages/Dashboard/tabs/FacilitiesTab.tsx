import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  CircularProgress, TextField, MenuItem, Paper, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Switch,
  FormControlLabel, Divider, InputAdornment, Tooltip,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, LocalHospital,
  CheckCircle, Pending, Cancel as CancelIcon, Block,
  Phone, LocationOn, Email, Visibility, Business,
} from '@mui/icons-material';
import api from '../../../services/api';
import facilityService from '../../../services/facilityService';
import { toast } from 'react-toastify';

const SENEGAL_REGIONS = ['Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kolda', 'Louga',
  'Matam', 'Saint-Louis', 'Sédhiou', 'Tambacounda', 'Kaffrine', 'Kédougou', 'Ziguinchor'];

const FACILITY_TYPES = [
  { value: 'HOPITAL_PUBLIC',     label: 'Hôpital Public',      color: '#1976d2' },
  { value: 'HOPITAL_PRIVE',      label: 'Hôpital Privé',       color: '#7b1fa2' },
  { value: 'CLINIQUE',           label: 'Clinique',            color: '#388e3c' },
  { value: 'CENTRE_DE_SANTE',    label: 'Centre de Santé',     color: '#00A896' },
  { value: 'DISTRICT_SANITAIRE', label: 'District Sanitaire',  color: '#e65100' },
  { value: 'POSTE_DE_SANTE',     label: 'Poste de Santé',      color: '#5d4037' },
];

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  PENDING:   { bg: '#fff3e0', color: '#e65100', label: 'En attente',   icon: <Pending sx={{ fontSize: 14 }} /> },
  APPROVED:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Approuvé',     icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  REJECTED:  { bg: '#ffebee', color: '#c62828', label: 'Rejeté',       icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  SUSPENDED: { bg: '#fafafa', color: '#616161', label: 'Suspendu',     icon: <Block sx={{ fontSize: 14 }} /> },
};

const BLANK_FORM = {
  name: '', type: 'HOPITAL_PUBLIC', region: 'Dakar', city: '', address: '',
  phone: '', emergencyPhone: '', email: '', website: '', description: '',
  registrationNumber: '', taxNumber: '',
  services: '', specializations: '', facilities: '',
  totalBeds: 0, ambulanceAvailable: false, canAcceptEmergency: true,
  registrationStatus: 'APPROVED',
};

const getTypeMeta = (t: string) => FACILITY_TYPES.find(f => f.value === t)
  ?? { value: t, label: t.replace(/_/g, ' '), color: '#666' };

const FacilitiesTab: React.FC = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/hospitals?limit=200');
      setFacilities(r.data.data || []);
    } catch { toast.error('Impossible de charger les établissements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtrage
  const filtered = useMemo(() => {
    return facilities.filter(f => {
      if (filterType !== 'all' && f.type !== filterType) return false;
      if (filterRegion !== 'all' && f.region !== filterRegion) return false;
      if (filterStatus !== 'all' && f.registrationStatus !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return f.name?.toLowerCase().includes(s) || f.city?.toLowerCase().includes(s) || f.email?.toLowerCase().includes(s);
      }
      return true;
    });
  }, [facilities, filterType, filterRegion, filterStatus, search]);

  const stats = useMemo(() => {
    const total = facilities.length;
    const approved = facilities.filter(f => f.registrationStatus === 'APPROVED').length;
    const pending = facilities.filter(f => f.registrationStatus === 'PENDING').length;
    const totalBeds = facilities.reduce((acc, f) => acc + (f.totalBeds || 0), 0);
    return { total, approved, pending, totalBeds };
  }, [facilities]);

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate = () => { setForm(BLANK_FORM); setCreateOpen(true); };
  const handleCreate = async () => {
    if (!form.name || !form.type || !form.region || !form.city || !form.address || !form.phone || !form.emergencyPhone) {
      return toast.error('Tous les champs marqués * sont obligatoires');
    }
    setSaving(true);
    try {
      await api.post('/hospitals', {
        ...form,
        services:        form.services.split(',').map((s: string) => s.trim()).filter(Boolean),
        specializations: form.specializations.split(',').map((s: string) => s.trim()).filter(Boolean),
        facilities:      form.facilities.split(',').map((s: string) => s.trim()).filter(Boolean),
        totalBeds:       parseInt(form.totalBeds) || 0,
      });
      toast.success('Établissement créé');
      setCreateOpen(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Erreur création'); }
    finally { setSaving(false); }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (f: any) => {
    setSelected(f);
    setForm({
      name: f.name, type: f.type, region: f.region, city: f.city, address: f.address,
      phone: f.phone, emergencyPhone: f.emergencyPhone, email: f.email ?? '', website: f.website ?? '',
      description: f.description ?? '',
      registrationNumber: f.registrationNumber ?? '', taxNumber: f.taxNumber ?? '',
      services:        Array.isArray(f.services) ? f.services.join(', ') : (f.services ?? ''),
      specializations: Array.isArray(f.specializations) ? f.specializations.join(', ') : (f.specializations ?? ''),
      facilities:      Array.isArray(f.facilities) ? f.facilities.join(', ') : (f.facilities ?? ''),
      totalBeds: f.totalBeds ?? 0,
      ambulanceAvailable: !!f.ambulanceAvailable,
      canAcceptEmergency: !!f.canAcceptEmergency,
      registrationStatus: f.registrationStatus ?? 'APPROVED',
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/hospitals/${selected.id}`, {
        ...form,
        services:        form.services.split(',').map((s: string) => s.trim()).filter(Boolean),
        specializations: form.specializations.split(',').map((s: string) => s.trim()).filter(Boolean),
        facilities:      form.facilities.split(',').map((s: string) => s.trim()).filter(Boolean),
        totalBeds:       parseInt(form.totalBeds) || 0,
      });
      toast.success('Établissement mis à jour');
      setEditOpen(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Erreur mise à jour'); }
    finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/hospitals/${selected.id}`);
      toast.success('Établissement supprimé');
      setDeleteOpen(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Erreur suppression'); }
    finally { setSaving(false); }
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const updateStatus = async (f: any, newStatus: string) => {
    try {
      await facilityService.updateStatus(f.id, newStatus);
      toast.success(`Statut changé : ${newStatus}`);
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0F2D52">Établissements de santé</Typography>
          <Typography variant="body2" color="text.secondary">Gérez tous les hôpitaux, cliniques et districts sanitaires</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' }, borderRadius: 2 }}>
          Nouvel établissement
        </Button>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #0F2D52' }}><CardContent sx={{ p: '12px !important' }}>
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="h5" fontWeight={700} color="#0F2D52">{stats.total}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #2e7d32' }}><CardContent sx={{ p: '12px !important' }}>
            <Typography variant="caption" color="text.secondary">Approuvés</Typography>
            <Typography variant="h5" fontWeight={700} color="#2e7d32">{stats.approved}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #e65100' }}><CardContent sx={{ p: '12px !important' }}>
            <Typography variant="caption" color="text.secondary">En attente</Typography>
            <Typography variant="h5" fontWeight={700} color="#e65100">{stats.pending}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #00A896' }}><CardContent sx={{ p: '12px !important' }}>
            <Typography variant="caption" color="text.secondary">Total lits</Typography>
            <Typography variant="h5" fontWeight={700} color="#00A896">{stats.totalBeds}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' } }} />
        <TextField select label="Type" value={filterType} onChange={e => setFilterType(e.target.value)} size="small" sx={{ minWidth: 140 }}>
          <MenuItem value="all">Tous types</MenuItem>
          {FACILITY_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </TextField>
        <TextField select label="Région" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} size="small" sx={{ minWidth: 130 }}>
          <MenuItem value="all">Toutes</MenuItem>
          {SENEGAL_REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <TextField select label="Statut" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} size="small" sx={{ minWidth: 130 }}>
          <MenuItem value="all">Tous</MenuItem>
          <MenuItem value="PENDING">En attente</MenuItem>
          <MenuItem value="APPROVED">Approuvé</MenuItem>
          <MenuItem value="REJECTED">Rejeté</MenuItem>
          <MenuItem value="SUSPENDED">Suspendu</MenuItem>
        </TextField>
      </Paper>

      {/* Tableau */}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#00A896' }} /></Box> :
       filtered.length === 0 ? <Alert severity="info">Aucun établissement trouvé.</Alert> : (
        <Paper sx={{ borderRadius: 3, overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                {['Établissement', 'Type', 'Région', 'Statut', 'Lits', 'Urgences', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(f => {
                const typeMeta = getTypeMeta(f.type);
                const status = STATUS_BADGE[f.registrationStatus] ?? STATUS_BADGE.APPROVED;
                return (
                  <TableRow key={f.id} hover>
                    <TableCell>
                      <Typography fontWeight={600} variant="body2">{f.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{f.city}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={typeMeta.label} size="small" sx={{ bgcolor: `${typeMeta.color}15`, color: typeMeta.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{f.region}</TableCell>
                    <TableCell>
                      <Chip label={status.label} size="small" icon={status.icon as any}
                        sx={{ bgcolor: status.bg, color: status.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{f.totalBeds ?? 0}</TableCell>
                    <TableCell>
                      <Chip label={f.canAcceptEmergency ? 'Ouvert' : 'Fermé'} size="small"
                        sx={{ bgcolor: f.canAcceptEmergency ? '#e8f5e9' : '#ffebee', color: f.canAcceptEmergency ? '#2e7d32' : '#c62828' }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir détails">
                        <IconButton size="small" onClick={() => { setSelected(f); setViewOpen(true); }}><Visibility fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => openEdit(f)} sx={{ color: '#0F2D52' }}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      {f.registrationStatus === 'PENDING' && (
                        <Tooltip title="Approuver">
                          <IconButton size="small" onClick={() => updateStatus(f, 'APPROVED')} sx={{ color: '#2e7d32' }}><CheckCircle fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => { setSelected(f); setDeleteOpen(true); }} sx={{ color: '#c62828' }}><Delete fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ── Dialog Création ──────────────────────────────────────────────── */}
      <FacilityFormDialog
        open={createOpen} onClose={() => setCreateOpen(false)}
        title="Nouvel établissement" form={form} setForm={setForm}
        onSubmit={handleCreate} saving={saving} isCreate
      />

      {/* ── Dialog Modification ──────────────────────────────────────────── */}
      <FacilityFormDialog
        open={editOpen} onClose={() => setEditOpen(false)}
        title={`Modifier — ${selected?.name ?? ''}`} form={form} setForm={setForm}
        onSubmit={handleEdit} saving={saving} isCreate={false}
      />

      {/* ── Dialog Suppression ───────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer {selected?.name} ?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Cette action supprimera l'établissement, tous ses lits et son inventaire. Les comptes administrateurs seront détachés.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Détails ────────────────────────────────────────────────── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocalHospital sx={{ color: '#00A896' }} />
                {selected.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={getTypeMeta(selected.type).label} size="small" sx={{ bgcolor: `${getTypeMeta(selected.type).color}22`, color: getTypeMeta(selected.type).color }} />
                <Chip label={STATUS_BADGE[selected.registrationStatus]?.label} size="small" />
              </Box>
              {[
                ['Région', selected.region],
                ['Ville', selected.city],
                ['Adresse', selected.address],
                ['Téléphone', selected.phone],
                ['Urgences', selected.emergencyPhone],
                ['Email', selected.email],
                ['Site web', selected.website],
                ['N° enregistrement', selected.registrationNumber],
                ['NINEA', selected.taxNumber],
                ['Total lits', selected.totalBeds],
              ].filter(([_, v]) => v).map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2" color="text.secondary">{k}</Typography>
                  <Typography variant="body2" fontWeight={600}>{v}</Typography>
                </Box>
              ))}
              {selected.description && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{selected.description}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions><Button onClick={() => setViewOpen(false)}>Fermer</Button></DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

// ── Dialog Form (Create + Edit partagé) ─────────────────────────────────────
const FacilityFormDialog: React.FC<{
  open: boolean; onClose: () => void; title: string;
  form: any; setForm: (f: any) => void;
  onSubmit: () => void; saving: boolean; isCreate: boolean;
}> = ({ open, onClose, title, form, setForm, onSubmit, saving, isCreate }) => {
  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={window.innerWidth < 600}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Business sx={{ color: '#00A896' }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {/* Type — TOUJOURS visible (create + edit) */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="Type d'établissement *" value={form.type} onChange={f('type')}>
              {FACILITY_TYPES.map(t => (
                <MenuItem key={t.value} value={t.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color }} />
                    {t.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="Statut" value={form.registrationStatus} onChange={f('registrationStatus')}>
              <MenuItem value="PENDING">En attente</MenuItem>
              <MenuItem value="APPROVED">Approuvé</MenuItem>
              <MenuItem value="REJECTED">Rejeté</MenuItem>
              <MenuItem value="SUSPENDED">Suspendu</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Nom de l'établissement *" value={form.name} onChange={f('name')} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="Région *" value={form.region} onChange={f('region')}>
              {SENEGAL_REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Ville *" value={form.city} onChange={f('city')} />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Adresse complète *" value={form.address} onChange={f('address')}
              InputProps={{ startAdornment: <LocationOn fontSize="small" sx={{ mr: 1, color: '#999' }} /> }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Téléphone *" value={form.phone} onChange={f('phone')}
              InputProps={{ startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: '#999' }} /> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Téléphone urgences *" value={form.emergencyPhone} onChange={f('emergencyPhone')}
              InputProps={{ startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: '#E63946' }} /> }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={f('email')}
              InputProps={{ startAdornment: <Email fontSize="small" sx={{ mr: 1, color: '#999' }} /> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Site web" value={form.website} onChange={f('website')} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="N° enregistrement" value={form.registrationNumber} onChange={f('registrationNumber')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="NINEA / N° fiscal" value={form.taxNumber} onChange={f('taxNumber')} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Total lits" type="number" value={form.totalBeds} onChange={f('totalBeds')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel control={<Switch checked={form.ambulanceAvailable}
              onChange={e => setForm({ ...form, ambulanceAvailable: e.target.checked })} />} label="Ambulance" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel control={<Switch checked={form.canAcceptEmergency}
              onChange={e => setForm({ ...form, canAcceptEmergency: e.target.checked })} />} label="Urgences ouvertes" />
          </Grid>

          <Grid item xs={12}><Divider><Chip label="Services & spécialisations" size="small" /></Divider></Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Services (séparés par virgules)" value={form.services} onChange={f('services')}
              placeholder="Urgences 24/7, Hospitalisation, Maternité..." />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Spécialisations (séparées par virgules)" value={form.specializations} onChange={f('specializations')}
              placeholder="Cardiologie, Pédiatrie, Neurologie..." />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Infrastructures (séparées par virgules)" value={form.facilities} onChange={f('facilities')}
              placeholder="Bloc opératoire, IRM, Laboratoire..." />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={f('description')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={onSubmit} disabled={saving}
          sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : (isCreate ? 'Créer' : 'Enregistrer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FacilitiesTab;
