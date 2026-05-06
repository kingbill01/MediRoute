import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Chip, IconButton, Divider, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Paper,
  Tabs, Tab, Alert,
} from '@mui/material';
import {
  Add, Edit, Delete, ChildCare, FavoriteOutlined,
  MedicalServices, AccessTime, Close, ArrowBack,
  MonitorHeart, Vaccines, Assignment,
} from '@mui/icons-material';
import dependentService, { Dependent, DependentMedicalRecord } from '../../../services/dependentService';
import { toast } from 'react-toastify';

// ── Helpers ───────────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RECORD_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'checkup', label: 'Bilan de santé' },
  { value: 'prescription', label: 'Ordonnance' },
  { value: 'lab_result', label: 'Résultat de labo' },
];

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const calcAge = (dob: string) => {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};

const getInitials = (first: string, last: string) =>
  `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();

const AVATAR_COLORS = ['#00A896', '#0F2D52', '#F77F00', '#E63946', '#6A4C93'];

// ── Composant principal ───────────────────────────────────────────────────────
const DependentsTab: React.FC = () => {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dependent | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [records, setRecords] = useState<DependentMedicalRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  // Forms
  const blankDep = { firstName: '', lastName: '', dateOfBirth: '', gender: '', relationship: 'CHILD', bloodGroup: '', allergies: '', chronicConditions: '', notes: '' };
  const blankRec = { recordDate: new Date().toISOString().split('T')[0], recordType: 'consultation', diagnosis: '', symptoms: '', notes: '', weight: '', height: '', temperature: '', followUpRequired: false, followUpDate: '' };

  const [depForm, setDepForm] = useState(blankDep);
  const [recForm, setRecForm] = useState(blankRec);
  const [saving, setSaving] = useState(false);

  const loadDependents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dependentService.getAll();
      setDependents(data);
    } catch { toast.error('Impossible de charger les dépendants'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDependents(); }, [loadDependents]);

  const loadRecords = useCallback(async (depId: string) => {
    try {
      setRecordsLoading(true);
      const data = await dependentService.getRecords(depId);
      setRecords(data);
    } catch { toast.error('Impossible de charger les dossiers'); }
    finally { setRecordsLoading(false); }
  }, []);

  const openDetail = (dep: Dependent) => {
    setSelected(dep);
    setDetailTab(0);
    loadRecords(dep.id);
  };

  // ── Add dependent ───────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!depForm.firstName || !depForm.lastName || !depForm.dateOfBirth) {
      return toast.error('Prénom, nom et date de naissance requis');
    }
    const age = calcAge(depForm.dateOfBirth);
    if (age < 0 || age > 15) return toast.error('Le dépendant doit avoir entre 0 et 15 ans');
    try {
      setSaving(true);
      await dependentService.create({ ...depForm, bloodGroup: depForm.bloodGroup || undefined, gender: depForm.gender || undefined });
      toast.success('Dépendant ajouté');
      setAddOpen(false);
      setDepForm(blankDep);
      loadDependents();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erreur lors de l\'ajout');
    } finally { setSaving(false); }
  };

  // ── Edit dependent ──────────────────────────────────────────────────────────
  const openEdit = (dep: Dependent) => {
    setSelected(dep);
    setDepForm({
      firstName: dep.firstName, lastName: dep.lastName,
      dateOfBirth: dep.dateOfBirth.split('T')[0], gender: dep.gender ?? '',
      relationship: dep.relationship, bloodGroup: dep.bloodGroup ?? '',
      allergies: dep.allergies ?? '', chronicConditions: dep.chronicConditions ?? '',
      notes: dep.notes ?? '',
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await dependentService.update(selected.id, { ...depForm, bloodGroup: depForm.bloodGroup || undefined, gender: depForm.gender || undefined });
      toast.success('Dépendant mis à jour');
      setEditOpen(false);
      loadDependents();
      if (selected) { const updated = await dependentService.getById(selected.id); setSelected(updated); }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erreur lors de la mise à jour');
    } finally { setSaving(false); }
  };

  // ── Delete dependent ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await dependentService.delete(selected.id);
      toast.success('Dépendant supprimé');
      setDeleteOpen(false);
      setSelected(null);
      loadDependents();
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setSaving(false); }
  };

  // ── Add record ──────────────────────────────────────────────────────────────
  const handleAddRecord = async () => {
    if (!selected || !recForm.notes || !recForm.recordType) return toast.error('Notes et type requis');
    try {
      setSaving(true);
      await dependentService.createRecord(selected.id, {
        ...recForm,
        weight: recForm.weight ? parseFloat(recForm.weight) : undefined,
        height: recForm.height ? parseFloat(recForm.height) : undefined,
        temperature: recForm.temperature ? parseFloat(recForm.temperature) : undefined,
        followUpDate: recForm.followUpDate || undefined,
      });
      toast.success('Dossier ajouté');
      setRecordOpen(false);
      setRecForm(blankRec);
      loadRecords(selected.id);
    } catch { toast.error('Erreur lors de l\'ajout du dossier'); }
    finally { setSaving(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (selected && !editOpen && !deleteOpen) {
    return <DependentDetail
      dep={selected} records={records} loading={recordsLoading}
      detailTab={detailTab} setDetailTab={setDetailTab}
      onBack={() => setSelected(null)}
      onEdit={() => openEdit(selected)}
      onDelete={() => setDeleteOpen(true)}
      onAddRecord={() => { setRecForm(blankRec); setRecordOpen(true); }}
      onDeleteRecord={async (rid) => {
        await dependentService.deleteRecord(selected.id, rid);
        loadRecords(selected.id);
        toast.success('Dossier supprimé');
      }}
    />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0F2D52">Mes Dépendants</Typography>
          <Typography variant="body2" color="text.secondary">Gérez le suivi de santé de vos enfants (0-15 ans)</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setDepForm(blankDep); setAddOpen(true); }}
          sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' }, borderRadius: 2 }}>
          Ajouter un dépendant
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#00A896' }} /></Box>
      ) : dependents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ChildCare sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography color="text.secondary" mb={2}>Aucun dépendant enregistré</Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setAddOpen(true)} sx={{ borderColor: '#00A896', color: '#00A896' }}>
            Ajouter mon premier dépendant
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {dependents.map((dep, i) => (
            <Grid item xs={12} sm={6} md={4} key={dep.id}>
              <Card sx={{ borderRadius: 3, cursor: 'pointer', transition: 'all .2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' } }}
                onClick={() => openDetail(dep)}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: AVATAR_COLORS[i % AVATAR_COLORS.length], width: 52, height: 52, fontSize: 18, fontWeight: 700 }}>
                      {getInitials(dep.firstName, dep.lastName)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700}>{dep.firstName} {dep.lastName}</Typography>
                      <Typography variant="body2" color="text.secondary">{dep.age} ans • {dep.gender === 'MALE' ? 'Garçon' : dep.gender === 'FEMALE' ? 'Fille' : '—'}</Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); openEdit(dep); }} sx={{ color: '#0F2D52' }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); setSelected(dep); setDeleteOpen(true); }} sx={{ color: '#E63946' }}><Delete fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {dep.bloodGroup && <Chip label={dep.bloodGroup} size="small" sx={{ bgcolor: '#fff0f0', color: '#E63946', fontWeight: 600 }} icon={<FavoriteOutlined style={{ fontSize: 13, color: '#E63946' }} />} />}
                    <Chip label={dep.relationship === 'CHILD' ? 'Enfant' : dep.relationship} size="small" variant="outlined" />
                  </Box>
                  {dep.lastVisit && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 12 }} /> Dernière visite : {fmtDate(dep.lastVisit)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Dialog Ajouter ─────────────────────────────────────────────────── */}
      <DependentFormDialog
        open={addOpen} onClose={() => setAddOpen(false)} title="Ajouter un dépendant"
        form={depForm} setForm={setDepForm} onSubmit={handleAdd} saving={saving}
      />

      {/* ── Dialog Modifier ────────────────────────────────────────────────── */}
      <DependentFormDialog
        open={editOpen} onClose={() => setEditOpen(false)} title={`Modifier — ${selected?.firstName ?? ''}`}
        form={depForm} setForm={setDepForm} onSubmit={handleEdit} saving={saving}
      />

      {/* ── Dialog Supprimer ───────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer {selected?.firstName} {selected?.lastName} ?</DialogTitle>
        <DialogContent><Alert severity="warning">Tous les dossiers médicaux associés seront également supprimés.</Alert></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Ajouter dossier ─────────────────────────────────────────── */}
      <RecordFormDialog
        open={recordOpen} onClose={() => setRecordOpen(false)}
        depName={selected ? `${selected.firstName} ${selected.lastName}` : ''}
        form={recForm} setForm={setRecForm} onSubmit={handleAddRecord} saving={saving}
      />
    </Box>
  );
};

// ── Détail dépendant ──────────────────────────────────────────────────────────
const DependentDetail: React.FC<{
  dep: Dependent; records: DependentMedicalRecord[]; loading: boolean;
  detailTab: number; setDetailTab: (n: number) => void;
  onBack: () => void; onEdit: () => void; onDelete: () => void;
  onAddRecord: () => void; onDeleteRecord: (id: string) => void;
}> = ({ dep, records, loading, detailTab, setDetailTab, onBack, onEdit, onDelete, onAddRecord, onDeleteRecord }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      <IconButton onClick={onBack} sx={{ bgcolor: '#f5f5f5' }}><ArrowBack /></IconButton>
      <Avatar sx={{ bgcolor: '#00A896', width: 52, height: 52, fontWeight: 700 }}>
        {getInitials(dep.firstName, dep.lastName)}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={700}>{dep.firstName} {dep.lastName}</Typography>
        <Typography variant="body2" color="text.secondary">{dep.age} ans • Né(e) le {fmtDate(dep.dateOfBirth)}</Typography>
      </Box>
      <Button startIcon={<Edit />} onClick={onEdit} variant="outlined" size="small" sx={{ borderColor: '#0F2D52', color: '#0F2D52' }}>Modifier</Button>
      <Button startIcon={<Delete />} onClick={onDelete} variant="outlined" size="small" color="error">Supprimer</Button>
    </Box>

    <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
      <Tab label="Profil" icon={<ChildCare />} iconPosition="start" />
      <Tab label={`Dossiers médicaux (${records.length})`} icon={<Assignment />} iconPosition="start" />
    </Tabs>

    {detailTab === 0 && (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="subtitle2" fontWeight={700} color="#0F2D52" mb={2}>Informations générales</Typography>
            {[
              ['Genre', dep.gender === 'MALE' ? 'Garçon' : dep.gender === 'FEMALE' ? 'Fille' : '—'],
              ['Groupe sanguin', dep.bloodGroup ?? '—'],
              ['Relation', dep.relationship === 'CHILD' ? 'Enfant' : dep.relationship],
            ].map(([label, val]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={600}>{val}</Typography>
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 3 }}><CardContent>
            <Typography variant="subtitle2" fontWeight={700} color="#0F2D52" mb={2}>Santé</Typography>
            <Box mb={1}>
              <Typography variant="body2" color="text.secondary" mb={0.5}>Allergies</Typography>
              <Typography variant="body2">{dep.allergies || 'Aucune allergie connue'}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" mb={0.5}>Conditions chroniques</Typography>
              <Typography variant="body2">{dep.chronicConditions || 'Aucune condition chronique'}</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        {dep.notes && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, bgcolor: '#f8f9fa' }}><CardContent>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>Notes</Typography>
              <Typography variant="body2">{dep.notes}</Typography>
            </CardContent></Card>
          </Grid>
        )}
      </Grid>
    )}

    {detailTab === 1 && (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={onAddRecord}
            sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' }, borderRadius: 2 }}>
            Ajouter un dossier
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#00A896' }} /></Box>
        ) : records.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <MedicalServices sx={{ fontSize: 48, color: '#ccc', mb: 1.5 }} />
            <Typography color="text.secondary">Aucun dossier médical</Typography>
          </Box>
        ) : (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                  {['Date', 'Type', 'Diagnostic', 'Mesures', 'Suivi', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#666' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell>{fmtDate(r.recordDate)}</TableCell>
                    <TableCell>
                      <Chip label={RECORD_TYPES.find(t => t.value === r.recordType)?.label ?? r.recordType} size="small"
                        icon={r.recordType === 'vaccination' ? <Vaccines style={{ fontSize: 13 }} /> : <MonitorHeart style={{ fontSize: 13 }} />}
                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>{r.diagnosis || '—'}</Typography>
                      {r.notes && <Typography variant="caption" color="text.secondary" noWrap display="block">{r.notes}</Typography>}
                    </TableCell>
                    <TableCell>
                      {r.weight && <Typography variant="caption" display="block">{r.weight} kg</Typography>}
                      {r.height && <Typography variant="caption" display="block">{r.height} cm</Typography>}
                      {r.temperature && <Typography variant="caption" display="block">{r.temperature}°C</Typography>}
                    </TableCell>
                    <TableCell>
                      {r.followUpRequired ? (
                        <Chip label={fmtDate(r.followUpDate)} size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100' }} />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => onDeleteRecord(r.id)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    )}
  </Box>
);

// ── Dialog Formulaire dépendant ───────────────────────────────────────────────
const DependentFormDialog: React.FC<{
  open: boolean; onClose: () => void; title: string;
  form: any; setForm: (f: any) => void;
  onSubmit: () => void; saving: boolean;
}> = ({ open, onClose, title, form, setForm, onSubmit, saving }) => {
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  // Max date = today, min date = today - 15 years
  const maxDate = new Date().toISOString().split('T')[0];
  const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split('T')[0];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label="Prénom *" value={form.firstName} onChange={f('firstName')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Nom *" value={form.lastName} onChange={f('lastName')} /></Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Date de naissance *" type="date" value={form.dateOfBirth}
              onChange={f('dateOfBirth')} InputLabelProps={{ shrink: true }}
              inputProps={{ min: minDate, max: maxDate }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Genre" value={form.gender} onChange={f('gender')}>
              <MenuItem value="">Non spécifié</MenuItem>
              <MenuItem value="MALE">Garçon</MenuItem>
              <MenuItem value="FEMALE">Fille</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Groupe sanguin" value={form.bloodGroup} onChange={f('bloodGroup')}>
              <MenuItem value="">Non connu</MenuItem>
              {BLOOD_GROUPS.map(bg => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Relation" value={form.relationship} onChange={f('relationship')}>
              <MenuItem value="CHILD">Enfant</MenuItem>
              <MenuItem value="SIBLING">Fratrie</MenuItem>
              <MenuItem value="OTHER">Autre</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Allergies" value={form.allergies} onChange={f('allergies')} placeholder="ex: pénicilline, arachides..." /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Conditions chroniques" value={form.chronicConditions} onChange={f('chronicConditions')} placeholder="ex: asthme, diabète..." /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" value={form.notes} onChange={f('notes')} multiline rows={2} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={onSubmit} disabled={saving} sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Dialog Formulaire dossier ─────────────────────────────────────────────────
const RecordFormDialog: React.FC<{
  open: boolean; onClose: () => void; depName: string;
  form: any; setForm: (f: any) => void;
  onSubmit: () => void; saving: boolean;
}> = ({ open, onClose, depName, form, setForm, onSubmit, saving }) => {
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Nouveau dossier — {depName}
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField fullWidth label="Date *" type="date" value={form.recordDate}
              onChange={f('recordDate')} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Type *" value={form.recordType} onChange={f('recordType')}>
              {RECORD_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Diagnostic" value={form.diagnosis} onChange={f('diagnosis')} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Symptômes" value={form.symptoms} onChange={f('symptoms')} placeholder="ex: fièvre, toux..." /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes *" value={form.notes} onChange={f('notes')} multiline rows={3} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Poids (kg)" type="number" value={form.weight} onChange={f('weight')} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Taille (cm)" type="number" value={form.height} onChange={f('height')} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Temp. (°C)" type="number" value={form.temperature} onChange={f('temperature')} /></Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Suivi requis" value={form.followUpRequired ? 'true' : 'false'}
              onChange={e => setForm((p: any) => ({ ...p, followUpRequired: e.target.value === 'true' }))}>
              <MenuItem value="false">Non</MenuItem>
              <MenuItem value="true">Oui</MenuItem>
            </TextField>
          </Grid>
          {form.followUpRequired && (
            <Grid item xs={6}>
              <TextField fullWidth label="Date de suivi" type="date" value={form.followUpDate}
                onChange={f('followUpDate')} InputLabelProps={{ shrink: true }} />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={onSubmit} disabled={saving} sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DependentsTab;
