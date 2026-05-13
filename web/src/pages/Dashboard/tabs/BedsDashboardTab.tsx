import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  CircularProgress, TextField, MenuItem, Paper, IconButton, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
} from '@mui/material';
import {
  Add, ArrowBack, Search,
  CheckCircle, Cancel, Build, EventAvailable, LocalHospital,
} from '@mui/icons-material';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const SENEGAL_REGIONS = ['Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kolda', 'Louga',
  'Matam', 'Saint-Louis', 'Sédhiou', 'Tambacounda', 'Kaffrine', 'Kédougou', 'Ziguinchor'];

const WARDS = ['URGENCES', 'MEDECINE', 'CHIRURGIE', 'MATERNITE', 'REA', 'PEDIATRIE'];
const BED_TYPES = ['STANDARD', 'ICU', 'ISOLATION', 'MATERNITY', 'RECOVERY'];

const STATUS_META: Record<string, { color: string; label: string; icon: any }> = {
  AVAILABLE:   { color: '#2e7d32', label: 'Disponible',   icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  OCCUPIED:    { color: '#c62828', label: 'Occupé',       icon: <Cancel sx={{ fontSize: 14 }} /> },
  MAINTENANCE: { color: '#f57c00', label: 'Maintenance',  icon: <Build sx={{ fontSize: 14 }} /> },
  RESERVED:    { color: '#1565c0', label: 'Réservé',      icon: <EventAvailable sx={{ fontSize: 14 }} /> },
};

const fmtPercent = (n: number) => `${Math.round(n)}%`;

// ── Vue 1 : Liste des établissements avec stats globales ───────────────────────
const FacilityList: React.FC<{
  onSelect: (h: any) => void;
}> = ({ onSelect }) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  useEffect(() => {
    api.get('/hospitals?limit=200')
      .then(r => setHospitals(r.data.data || []))
      .catch(() => toast.error('Impossible de charger les établissements'))
      .finally(() => setLoading(false));
  }, []);

  // Stats globales (somme sur tous les établissements)
  const globalStats = useMemo(() => {
    let total = 0, available = 0, occupied = 0, maintenance = 0, reserved = 0;
    for (const h of hospitals) {
      const s = h.liveBedStats;
      if (s) {
        total       += s.total       ?? 0;
        available   += s.available   ?? 0;
        occupied    += s.occupied    ?? 0;
        maintenance += s.maintenance ?? 0;
        reserved    += s.reserved    ?? 0;
      } else {
        // Fallback : utiliser totalBeds/availableBeds
        total     += h.totalBeds ?? 0;
        available += h.availableBeds ?? 0;
        occupied  += (h.totalBeds ?? 0) - (h.availableBeds ?? 0);
      }
    }
    const occupancyRate    = total > 0 ? (occupied / total) * 100 : 0;
    const availabilityRate = total > 0 ? (available / total) * 100 : 0;
    return { total, available, occupied, maintenance, reserved, occupancyRate, availabilityRate };
  }, [hospitals]);

  const filtered = useMemo(() => {
    return hospitals.filter(h => {
      if (regionFilter !== 'all' && h.region !== regionFilter) return false;
      if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [hospitals, search, regionFilter]);

  if (loading) return <Box textAlign="center" py={8}><CircularProgress sx={{ color: '#00A896' }} /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#0F2D52">Gestion des lits</Typography>
        <Typography variant="body2" color="text.secondary">Vue d'ensemble par établissement</Typography>
      </Box>

      {/* ── KPIs globaux ────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #0F2D52' }}><CardContent>
            <Typography variant="caption" color="text.secondary">Total lits</Typography>
            <Typography variant="h4" fontWeight={800} color="#0F2D52">{globalStats.total}</Typography>
            <Typography variant="caption" color="text.secondary">{hospitals.length} établissement(s)</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #2e7d32' }}><CardContent>
            <Typography variant="caption" color="text.secondary">Disponibles</Typography>
            <Typography variant="h4" fontWeight={800} color="#2e7d32">{globalStats.available}</Typography>
            <Typography variant="caption" sx={{ color: '#2e7d32' }}>{fmtPercent(globalStats.availabilityRate)} du total</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #c62828' }}><CardContent>
            <Typography variant="caption" color="text.secondary">Occupés</Typography>
            <Typography variant="h4" fontWeight={800} color="#c62828">{globalStats.occupied}</Typography>
            <Typography variant="caption" sx={{ color: '#c62828' }}>{fmtPercent(globalStats.occupancyRate)} d'occupation</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3, borderLeft: '4px solid #f57c00' }}><CardContent>
            <Typography variant="caption" color="text.secondary">Maintenance / Réservés</Typography>
            <Typography variant="h4" fontWeight={800} color="#f57c00">{globalStats.maintenance + globalStats.reserved}</Typography>
            <Typography variant="caption" color="text.secondary">{globalStats.maintenance} maint. · {globalStats.reserved} rés.</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* ── Filtres ────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField placeholder="Rechercher un établissement..." value={search} size="small"
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ flex: { xs: '1 1 100%', sm: '1 1 220px' } }} />
        <TextField select label="Région" value={regionFilter} onChange={e => setRegionFilter(e.target.value)} size="small" sx={{ minWidth: 160 }}>
          <MenuItem value="all">Toutes régions</MenuItem>
          {SENEGAL_REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
      </Paper>

      {/* ── Tableau / Cartes par établissement ────────────────────────── */}
      {filtered.length === 0 ? (
        <Alert severity="info">Aucun établissement trouvé.</Alert>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(h => {
            const s = h.liveBedStats ?? { total: h.totalBeds ?? 0, available: h.availableBeds ?? 0, occupied: 0, maintenance: 0, reserved: 0 };
            const total = s.total || h.totalBeds || 0;
            const occupancy = total > 0 ? ((s.occupied ?? 0) / total) * 100 : 0;
            const availability = total > 0 ? ((s.available ?? 0) / total) * 100 : 0;

            return (
              <Grid item xs={12} md={6} key={h.id}>
                <Card sx={{
                  borderRadius: 3, cursor: 'pointer', transition: 'all .2s',
                  border: '1px solid #e8eaed',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                }} onClick={() => onSelect(h)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#0F2D52', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LocalHospital sx={{ color: '#fff', fontSize: 22 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{h.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {h.type?.replace(/_/g, ' ')} · {h.city}, {h.region}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" fontWeight={800} color="#0F2D52" sx={{ lineHeight: 1 }}>{total}</Typography>
                        <Typography variant="caption" color="text.secondary">lits</Typography>
                      </Box>
                    </Box>

                    {/* Barre de progression */}
                    <Box sx={{ display: 'flex', height: 24, borderRadius: 2, overflow: 'hidden', mb: 1.5 }}>
                      {total > 0 ? (
                        <>
                          <Box sx={{ width: `${availability}%`, bgcolor: '#2e7d32', minWidth: availability > 0 ? 4 : 0 }} />
                          <Box sx={{ width: `${occupancy}%`,    bgcolor: '#c62828', minWidth: occupancy > 0 ? 4 : 0 }} />
                          <Box sx={{ width: `${total > 0 ? (s.maintenance ?? 0) / total * 100 : 0}%`, bgcolor: '#f57c00' }} />
                          <Box sx={{ width: `${total > 0 ? (s.reserved ?? 0) / total * 100 : 0}%`,    bgcolor: '#1565c0' }} />
                        </>
                      ) : (
                        <Box sx={{ width: '100%', bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Aucun lit enregistré</Typography>
                        </Box>
                      )}
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2e7d32' }} />
                          <Typography variant="caption" fontWeight={600}>
                            {s.available ?? 0} disponibles
                          </Typography>
                          <Chip label={fmtPercent(availability)} size="small" sx={{ ml: 'auto', bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#c62828' }} />
                          <Typography variant="caption" fontWeight={600}>
                            {s.occupied ?? 0} occupés
                          </Typography>
                          <Chip label={fmtPercent(occupancy)} size="small" sx={{ ml: 'auto', bgcolor: '#ffebee', color: '#c62828', fontWeight: 700 }} />
                        </Box>
                      </Grid>
                      {(s.maintenance > 0 || s.reserved > 0) && (
                        <>
                          {s.maintenance > 0 && (
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f57c00' }} />
                                <Typography variant="caption">{s.maintenance} maintenance</Typography>
                              </Box>
                            </Grid>
                          )}
                          {s.reserved > 0 && (
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#1565c0' }} />
                                <Typography variant="caption">{s.reserved} réservés</Typography>
                              </Box>
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

// ── Vue 2 : Détail d'un établissement (gestion lits individuels) ──────────────
const FacilityBeds: React.FC<{
  hospital: any;
  onBack: () => void;
}> = ({ hospital, onBack }) => {
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWard, setFilterWard] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [newBed, setNewBed] = useState({ bedNumber: '', ward: 'MEDECINE', bedType: 'STANDARD' });
  const [updForm, setUpdForm] = useState({ status: 'AVAILABLE', patientName: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/beds/hospital/${hospital.id}`)
      .then(r => setBeds(r.data.data || []))
      .catch(() => toast.error('Impossible de charger les lits'))
      .finally(() => setLoading(false));
  }, [hospital.id]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = beds.length;
    const available   = beds.filter(b => b.status === 'AVAILABLE').length;
    const occupied    = beds.filter(b => b.status === 'OCCUPIED').length;
    const maintenance = beds.filter(b => b.status === 'MAINTENANCE').length;
    const reserved    = beds.filter(b => b.status === 'RESERVED').length;
    return { total, available, occupied, maintenance, reserved };
  }, [beds]);

  const filtered = useMemo(() => beds.filter(b =>
    (filterWard === 'all' || b.ward === filterWard) &&
    (filterStatus === 'all' || b.status === filterStatus)
  ), [beds, filterWard, filterStatus]);

  const wardBreakdown = useMemo(() => {
    const map: Record<string, { total: number; available: number; occupied: number }> = {};
    for (const b of beds) {
      if (!map[b.ward]) map[b.ward] = { total: 0, available: 0, occupied: 0 };
      map[b.ward].total++;
      if (b.status === 'AVAILABLE') map[b.ward].available++;
      else if (b.status === 'OCCUPIED') map[b.ward].occupied++;
    }
    return map;
  }, [beds]);

  const create = async () => {
    if (!newBed.bedNumber) return toast.error('Numéro de lit requis');
    setSaving(true);
    try {
      await api.post('/beds', { ...newBed, hospitalId: hospital.id });
      toast.success('Lit créé');
      setAddOpen(false); setNewBed({ bedNumber: '', ward: 'MEDECINE', bedType: 'STANDARD' });
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Erreur'); }
    finally { setSaving(false); }
  };

  const update = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/beds/${selected.id}`, updForm);
      toast.success('Lit mis à jour');
      setEditOpen(false); load();
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const occupancy = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={onBack} sx={{ bgcolor: '#f5f5f5' }}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h5" fontWeight={700} color="#0F2D52">{hospital.name}</Typography>
          <Typography variant="caption" color="text.secondary">{hospital.city}, {hospital.region}</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}
          sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>
          Ajouter un lit
        </Button>
      </Box>

      {/* KPIs avec barre */}
      <Card sx={{ borderRadius: 3, mb: 3 }}><CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Capacité de l'établissement</Typography>
            <Typography variant="h3" fontWeight={800} color="#0F2D52" sx={{ lineHeight: 1 }}>
              {stats.total} <Typography component="span" variant="body2" color="text.secondary">lits</Typography>
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Taux d'occupation</Typography>
            <Typography variant="h3" fontWeight={800} color={occupancy >= 80 ? '#c62828' : occupancy >= 50 ? '#f57c00' : '#2e7d32'} sx={{ lineHeight: 1 }}>
              {fmtPercent(occupancy)}
            </Typography>
          </Box>
        </Box>
        <LinearProgress variant="determinate" value={occupancy}
          sx={{ height: 12, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: occupancy >= 80 ? '#c62828' : occupancy >= 50 ? '#f57c00' : '#2e7d32' } }} />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {Object.entries(STATUS_META).map(([key, m]) => {
            const v = (stats as any)[key.toLowerCase()] ?? 0;
            return (
              <Grid item xs={6} sm={3} key={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: m.color }} />
                  <Typography variant="body2" fontWeight={600}>{v}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent></Card>

      {/* Répartition par service */}
      {Object.keys(wardBreakdown).length > 0 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}><CardContent>
          <Typography variant="subtitle1" fontWeight={700} color="#0F2D52" mb={2}>Répartition par service</Typography>
          <Grid container spacing={2}>
            {Object.entries(wardBreakdown).map(([ward, s]) => {
              const rate = s.total > 0 ? (s.occupied / s.total) * 100 : 0;
              return (
                <Grid item xs={12} sm={6} md={4} key={ward}>
                  <Box sx={{ p: 1.5, border: '1px solid #e8eaed', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" fontWeight={700} color="#0F2D52">{ward}</Typography>
                      <Chip label={`${s.occupied}/${s.total}`} size="small" sx={{ bgcolor: '#f5f5f5' }} />
                    </Box>
                    <LinearProgress variant="determinate" value={rate}
                      sx={{ height: 6, borderRadius: 1, '& .MuiLinearProgress-bar': { bgcolor: rate >= 80 ? '#c62828' : rate >= 50 ? '#f57c00' : '#2e7d32' } }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {fmtPercent(rate)} d'occupation · {s.available} disponibles
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent></Card>
      )}

      {/* Filtres + table */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField select label="Service" value={filterWard} onChange={e => setFilterWard(e.target.value)} size="small" sx={{ minWidth: 160 }}>
          <MenuItem value="all">Tous services</MenuItem>
          {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
        </TextField>
        <TextField select label="Statut" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} size="small" sx={{ minWidth: 160 }}>
          <MenuItem value="all">Tous statuts</MenuItem>
          {Object.entries(STATUS_META).map(([k, m]) => <MenuItem key={k} value={k}>{m.label}</MenuItem>)}
        </TextField>
      </Paper>

      {loading ? <CircularProgress sx={{ color: '#00A896' }} /> :
       filtered.length === 0 ? (
        <Alert severity="info">
          {beds.length === 0 ? 'Aucun lit enregistré. Cliquez sur "Ajouter un lit".' : 'Aucun lit ne correspond aux filtres.'}
        </Alert>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                {['N°', 'Service', 'Type', 'Statut', 'Patient', 'Notes', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(b => {
                const sm = STATUS_META[b.status];
                return (
                  <TableRow key={b.id} hover>
                    <TableCell><strong>{b.bedNumber}</strong></TableCell>
                    <TableCell>{b.ward}</TableCell>
                    <TableCell>{b.bedType}</TableCell>
                    <TableCell>
                      <Chip label={sm?.label ?? b.status} icon={sm?.icon} size="small"
                        sx={{ bgcolor: `${sm?.color}22`, color: sm?.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{b.patientName || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="caption" noWrap>{b.notes || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => {
                        setSelected(b);
                        setUpdForm({ status: b.status, patientName: b.patientName ?? '', notes: b.notes ?? '' });
                        setEditOpen(true);
                      }}>Modifier</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Dialog ajout */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nouveau lit</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="N° du lit *" value={newBed.bedNumber}
            onChange={e => setNewBed({ ...newBed, bedNumber: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth select label="Service *" value={newBed.ward}
            onChange={e => setNewBed({ ...newBed, ward: e.target.value })} sx={{ mb: 2 }}>
            {WARDS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Type" value={newBed.bedType}
            onChange={e => setNewBed({ ...newBed, bedType: e.target.value })}>
            {BED_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={create} disabled={saving}
            sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>
            {saving ? <CircularProgress size={18} /> : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog modification */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Lit {selected?.bedNumber}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth select label="Statut" value={updForm.status}
            onChange={e => setUpdForm({ ...updForm, status: e.target.value })} sx={{ mb: 2 }}>
            {Object.entries(STATUS_META).map(([k, m]) => <MenuItem key={k} value={k}>{m.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Nom du patient" value={updForm.patientName}
            onChange={e => setUpdForm({ ...updForm, patientName: e.target.value })}
            disabled={updForm.status !== 'OCCUPIED' && updForm.status !== 'RESERVED'}
            sx={{ mb: 2 }} />
          <TextField fullWidth label="Notes" multiline rows={2} value={updForm.notes}
            onChange={e => setUpdForm({ ...updForm, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={update} disabled={saving}
            sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>
            {saving ? <CircularProgress size={18} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Composant principal ───────────────────────────────────────────────────────
const BedsDashboardTab: React.FC = () => {
  const [selected, setSelected] = useState<any>(null);

  return selected
    ? <FacilityBeds hospital={selected} onBack={() => setSelected(null)} />
    : <FacilityList onSelect={setSelected} />;
};

export default BedsDashboardTab;
