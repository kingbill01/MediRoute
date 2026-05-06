import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Text, Title, Button, Card, Chip, ActivityIndicator,
  TextInput, Divider, Avatar, Badge, Surface, Icon,
} from 'react-native-paper';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/constants';

// ─────────────────────────────────────────────────────────────────────────────
// Rendez-vous
// ─────────────────────────────────────────────────────────────────────────────
function AppointmentsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', type: 'CONSULTATION', reason: '' });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get(ENDPOINTS.APPOINTMENTS_PATIENT)
      .then(r => setAppointments(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openBook = () => {
    api.get('/admin/doctors?status=APPROVED').then(r => setDoctors(r.data.data || [])).catch(() => {});
    setShowBook(true);
  };

  const book = async () => {
    if (!form.doctorId || !form.date || !form.time || !form.reason) {
      setBookError('Tous les champs sont requis'); return;
    }
    setBooking(true); setBookError('');
    try {
      await api.post(ENDPOINTS.APPOINTMENTS, {
        ...form,
        patientId: user?.userId,
        appointmentDate: form.date,
        appointmentTime: form.time,
      });
      setShowBook(false);
      setForm({ doctorId: '', date: '', time: '', type: 'CONSULTATION', reason: '' });
      load();
    } catch (e: any) {
      setBookError(e.response?.data?.message || 'Erreur lors de la réservation');
    } finally { setBooking(false); }
  };

  const statusColor: Record<string, string> = {
    PENDING: '#F59E0B', CONFIRMED: '#10B981', CANCELLED: '#EF4444', COMPLETED: '#6366F1',
  };
  const statusLabel: Record<string, string> = {
    PENDING: 'En attente', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé', COMPLETED: 'Terminé',
  };

  if (loading) return <View style={S.center}><ActivityIndicator animating size="large" color="#0F2D52" /></View>;

  if (showBook) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={S.container} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Button icon="arrow-left" mode="text" onPress={() => setShowBook(false)} style={{ alignSelf: 'flex-start', marginBottom: 4 }}>Retour</Button>
          <Title style={S.screenTitle}>Nouveau rendez-vous</Title>

          <Text style={S.label}>Médecin *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {doctors.map(d => (
              <TouchableOpacity key={d.userId} onPress={() => setForm(f => ({ ...f, doctorId: d.userId }))}
                style={[S.docChip, form.doctorId === d.userId && S.docChipSel]}>
                <Text style={{ color: form.doctorId === d.userId ? '#fff' : '#0F2D52', fontSize: 13, fontWeight: '600' }}>
                  Dr. {d.firstName} {d.lastName}
                </Text>
                {d.doctorInfo?.specialization && (
                  <Text style={{ color: form.doctorId === d.userId ? 'rgba(255,255,255,0.75)' : '#64748B', fontSize: 11 }}>
                    {d.doctorInfo.specialization}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={S.label}>Date *</Text>
          <TextInput mode="outlined" value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))}
            placeholder="AAAA-MM-JJ" style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" dense />

          <Text style={S.label}>Heure *</Text>
          <TextInput mode="outlined" value={form.time} onChangeText={v => setForm(f => ({ ...f, time: v }))}
            placeholder="09:00" style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" dense />

          <Text style={S.label}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {['CONSULTATION', 'FOLLOW_UP', 'ROUTINE_CHECKUP', 'TELECONSULTATION'].map(t => (
              <Chip key={t} selected={form.type === t} onPress={() => setForm(f => ({ ...f, type: t }))} style={{ marginRight: 8 }}>{t}</Chip>
            ))}
          </ScrollView>

          <Text style={S.label}>Motif *</Text>
          <TextInput mode="outlined" value={form.reason} onChangeText={v => setForm(f => ({ ...f, reason: v }))}
            multiline numberOfLines={3} style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />

          {bookError ? <Text style={{ color: '#EF4444', fontSize: 12.5, marginBottom: 8 }}>{bookError}</Text> : null}

          <Button mode="contained" onPress={book} loading={booking}
            disabled={booking || !form.doctorId || !form.date || !form.time || !form.reason}
            buttonColor="#0F2D52" style={{ marginTop: 8 }}>
            Confirmer le rendez-vous
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={S.container}>
      <View style={S.header}>
        <Title style={S.screenTitle}>Rendez-vous</Title>
        <Button mode="contained" icon="plus" onPress={openBook} compact buttonColor="#0F2D52">Nouveau</Button>
      </View>

      {appointments.length === 0 ? (
        <View style={S.center}>
          <Text style={{ color: '#9CA3AF', fontSize: 15, textAlign: 'center' }}>Aucun rendez-vous planifié</Text>
          <Button mode="outlined" onPress={openBook} style={{ marginTop: 14 }}>Prendre un rendez-vous</Button>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: a }) => (
            <Card style={S.card} mode="outlined">
              <Card.Content>
                <View style={S.rowBetween}>
                  <Text style={[S.cardTitle, { flex: 1 }]}>Dr. {a.doctor?.firstName} {a.doctor?.lastName}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: statusColor[a.status] + '22' }}>
                    <Text style={{ color: statusColor[a.status], fontSize: 11, fontWeight: '700' }}>{statusLabel[a.status] ?? a.status}</Text>
                  </View>
                </View>
                <Text style={S.cardSub}>{a.type} · {a.appointmentTime}</Text>
                <Text style={S.cardDate}>
                  {new Date(a.appointmentDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                {a.reason ? <Text style={S.cardNote} numberOfLines={2}>{a.reason}</Text> : null}
              </Card.Content>
            </Card>
          )}
        />
      )}

      <View style={S.emergencyBanner}>
        <Button mode="contained" icon="alarm-light" buttonColor="#DC2626"
          onPress={() => navigation.getParent()?.navigate('Emergency')}>
          Urgence médicale
        </Button>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hôpitaux
// ─────────────────────────────────────────────────────────────────────────────
function HospitalsScreen() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    api.get('/hospitals?limit=100').then(r => setHospitals(r.data.data || [])).finally(() => setLoading(false));
    api.get('/hospitals/regions').then(r => setRegions(r.data.data || [])).catch(() => {});
  }, []);

  const filtered = hospitals.filter(h => {
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase()) && !h.city?.toLowerCase().includes(search.toLowerCase())) return false;
    if (region && h.region !== region) return false;
    return true;
  });

  const splitStr = (s: string | null) => s ? s.split(',').map((x: string) => x.trim()).filter(Boolean) : [];

  if (loading) return <View style={S.center}><ActivityIndicator animating size="large" color="#0F2D52" /></View>;

  return (
    <View style={S.container}>
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <TextInput mode="outlined" dense placeholder="Rechercher par nom ou ville…"
          value={search} onChangeText={setSearch}
          left={<TextInput.Icon icon="magnify" />}
          style={{ marginBottom: 10, backgroundColor: '#fff' }}
          outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <Chip onPress={() => setRegion('')} selected={!region} style={{ marginRight: 6 }}>Toutes</Chip>
          {regions.map(r => (
            <Chip key={r} onPress={() => setRegion(r)} selected={region === r} style={{ marginRight: 6 }}>{r}</Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        ListEmptyComponent={<View style={S.center}><Text style={{ color: '#9CA3AF' }}>Aucun hôpital trouvé</Text></View>}
        renderItem={({ item: h }) => {
          const live = h.liveBedStats;
          const total = live?.total ?? h.totalBeds ?? 0;
          const available = live?.available ?? h.availableBeds ?? 0;
          const occupied = live?.occupied ?? (total - available);
          const pct = total ? Math.round((available / total) * 100) : null;
          const specs = splitStr(h.specializations);

          return (
            <Card style={S.card} mode="outlined">
              <Card.Content>
                <View style={S.rowBetween}>
                  <Text style={[S.cardTitle, { flex: 1, marginRight: 8 }]} numberOfLines={1}>{h.name}</Text>
                  {h.canAcceptEmergency && (
                    <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                      <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700' }}>Urgences</Text>
                    </View>
                  )}
                </View>
                <Text style={S.cardSub}>{h.type} · {h.city}, {h.region}</Text>

                {total > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <View style={S.rowBetween}>
                      <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#374151' }}>Capacité en lits</Text>
                      {pct !== null && <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{pct}% libres</Text>}
                    </View>
                    <View style={S.bedBar}>
                      <View style={[S.bedFill, { width: `${total ? (occupied / total) * 100 : 0}%`, backgroundColor: '#E53E3E' }]} />
                      <View style={[S.bedFill, { width: `${total ? (available / total) * 100 : 0}%`, backgroundColor: '#6EE7B7' }]} />
                    </View>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                      ✓ {available} disponibles · {occupied} occupés · {total} total
                    </Text>
                  </View>
                )}

                {specs.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                    {specs.slice(0, 4).map((s: string) => (
                      <View key={s} style={{ backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                        <Text style={{ color: '#0F766E', fontSize: 10.5, fontWeight: '600' }}>{s}</Text>
                      </View>
                    ))}
                    {specs.length > 4 && (
                      <View style={{ backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                        <Text style={{ color: '#64748B', fontSize: 10.5 }}>+{specs.length - 4}</Text>
                      </View>
                    )}
                  </View>
                )}

                {h.waitingTime != null && (
                  <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 8 }}>⏱ Attente estimée : {h.waitingTime} min</Text>
                )}
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Messagerie
// ─────────────────────────────────────────────────────────────────────────────
function MessagingScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<any>(null);
  const listRef = useRef<FlatList>(null);

  const loadConvs = useCallback(() => {
    api.get('/messages/conversations')
      .then(r => setConversations(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadConvs();
    api.get('/messages/contacts').then(r => setContacts(r.data.data || [])).catch(() => {});
  }, [loadConvs]);

  const openThread = useCallback((p: any) => {
    clearInterval(pollRef.current);
    setPartner(p);
    const fetchThread = () =>
      api.get(`/messages/${p.id}`)
        .then(r => { setMessages(r.data.data || []); loadConvs(); })
        .catch(() => {});
    fetchThread();
    pollRef.current = setInterval(fetchThread, 5000);
  }, [loadConvs]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !partner) return;
    setSending(true);
    try {
      await api.post('/messages', { receiverId: partner.id, content: text.trim() });
      setText('');
      const r = await api.get(`/messages/${partner.id}`);
      setMessages(r.data.data || []);
      loadConvs();
    } catch {} finally { setSending(false); }
  };

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Vue conversation active
  if (partner) {
    return (
      <View style={S.container}>
        <View style={S.chatHeader}>
          <TouchableOpacity onPress={() => { setPartner(null); clearInterval(pollRef.current); }} style={{ marginRight: 10 }}>
            <Icon source="arrow-left" size={22} color="#0F2D52" />
          </TouchableOpacity>
          <Avatar.Text size={36} label={`${partner.firstName?.[0] ?? ''}${partner.lastName?.[0] ?? ''}`}
            style={{ backgroundColor: '#EEF3FF' }} labelStyle={{ color: '#0F2D52', fontSize: 12 }} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: '#0F2D52' }}>
              Dr. {partner.firstName} {partner.lastName}
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B' }}>Médecin</Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 4 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Aucun message — commencez la conversation !</Text>
            </View>
          }
          renderItem={({ item: m }) => {
            const mine = m.senderId === user?.userId;
            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <View style={[S.bubble, mine ? S.bubbleMine : S.bubbleOther]}>
                  <Text style={{ color: mine ? '#fff' : '#1A202C', fontSize: 13.5, lineHeight: 20 }}>{m.content}</Text>
                  <Text style={{ color: mine ? 'rgba(255,255,255,0.55)' : '#9CA3AF', fontSize: 10, marginTop: 2, textAlign: 'right' }}>
                    {fmtTime(m.createdAt)}{mine && (m.isRead ? ' · Lu' : ' · Envoyé')}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={S.inputRow}>
            <TextInput mode="flat" dense placeholder="Votre message…" value={text} onChangeText={setText}
              style={{ flex: 1, backgroundColor: '#fff' }} onSubmitEditing={send} blurOnSubmit={false} />
            <TouchableOpacity onPress={send} disabled={sending || !text.trim()}
              style={[S.sendBtn, (!text.trim() || sending) && S.sendBtnOff]}>
              <Icon source="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Liste des conversations
  return (
    <View style={S.container}>
      <View style={S.header}>
        <Title style={S.screenTitle}>Messages</Title>
      </View>

      {loading ? (
        <View style={S.center}><ActivityIndicator animating size="large" color="#0F2D52" /></View>
      ) : conversations.length === 0 ? (
        <View style={S.center}>
          <Icon source="chat-outline" size={52} color="#CBD5E0" />
          <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Aucune conversation</Text>
          {contacts.length > 0 && (
            <Text style={{ color: '#CBD5E0', fontSize: 12.5, marginTop: 4 }}>Démarrez depuis la liste ci-dessous</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={c => c.partner.id}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item: c }) => (
            <TouchableOpacity onPress={() => openThread(c.partner)} style={S.convItem}>
              <View style={{ position: 'relative', marginRight: 12 }}>
                <Avatar.Text size={44} label={`${c.partner.firstName?.[0] ?? ''}${c.partner.lastName?.[0] ?? ''}`}
                  style={{ backgroundColor: '#EEF3FF' }} labelStyle={{ color: '#0F2D52', fontSize: 14 }} />
                {c.unreadCount > 0 && (
                  <Badge style={S.badge}>{c.unreadCount}</Badge>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={S.rowBetween}>
                  <Text style={{ fontWeight: c.unreadCount > 0 ? '700' : '600', color: '#0F2D52', fontSize: 14 }}>
                    Dr. {c.partner.firstName} {c.partner.lastName}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtTime(c.lastMessage.createdAt)}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 12.5, color: c.unreadCount > 0 ? '#374151' : '#9CA3AF', fontWeight: c.unreadCount > 0 ? '600' : '400' }}>
                  {c.lastMessage.senderId === user?.userId ? 'Vous : ' : ''}{c.lastMessage.content}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {contacts.filter(c => !conversations.find(cv => cv.partner.id === c.id)).length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 }}>
          <Text style={{ paddingHorizontal: 16, fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
            Médecins disponibles
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
            {contacts
              .filter(c => !conversations.find(cv => cv.partner.id === c.id))
              .map(c => (
                <TouchableOpacity key={c.id} onPress={() => openThread(c)} style={S.contactPill}>
                  <Text style={{ color: '#0F2D52', fontWeight: '600', fontSize: 13 }}>
                    Dr. {c.firstName} {c.lastName}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dépendants
// ─────────────────────────────────────────────────────────────────────────────
const BLOOD_GROUPS_MOB = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RECORD_TYPES_MOB = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'vaccination',  label: 'Vaccination' },
  { value: 'checkup',      label: 'Bilan de santé' },
  { value: 'prescription', label: 'Ordonnance' },
  { value: 'lab_result',   label: 'Résultat de labo' },
];

const calcAgeMob = (dob: string) => {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

function DependantsScreen() {
  const [dependants, setDependants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');

  const blankDep = { firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '', allergies: '', chronicConditions: '' };
  const blankRec = { recordDate: new Date().toISOString().split('T')[0], recordType: 'consultation', diagnosis: '', symptoms: '', notes: '', weight: '', height: '', temperature: '' };
  const [depForm, setDepForm] = useState(blankDep);
  const [recForm, setRecForm] = useState(blankRec);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/dependents'); setDependants(r.data.data || []); }
    catch { Alert.alert('Erreur', 'Impossible de charger les dépendants'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadRecords = async (id: string) => {
    setRecordsLoading(true);
    try { const r = await api.get(`/dependents/${id}/records`); setRecords(r.data.data || []); }
    catch { Alert.alert('Erreur', 'Impossible de charger les dossiers'); }
    finally { setRecordsLoading(false); }
  };

  const openDetail = (dep: any) => { setSelected(dep); setView('detail'); loadRecords(dep.id); };

  const handleAdd = async () => {
    if (!depForm.firstName || !depForm.lastName || !depForm.dateOfBirth) {
      return Alert.alert('Erreur', 'Prénom, nom et date de naissance requis');
    }
    const age = calcAgeMob(depForm.dateOfBirth);
    if (age < 0 || age > 15) return Alert.alert('Erreur', 'Le dépendant doit avoir entre 0 et 15 ans');
    setSaving(true);
    try {
      await api.post('/dependents', depForm);
      setAddOpen(false); setDepForm(blankDep); load();
    } catch (e: any) { Alert.alert('Erreur', e?.response?.data?.message ?? 'Impossible d\'ajouter'); }
    finally { setSaving(false); }
  };

  const handleDelete = (dep: any) => {
    Alert.alert('Supprimer', `Supprimer ${dep.firstName} ${dep.lastName} et tous ses dossiers ?`,
      [{ text: 'Annuler', style: 'cancel' },
       { text: 'Supprimer', style: 'destructive', onPress: async () => {
         try { await api.delete(`/dependents/${dep.id}`); load(); setView('list'); }
         catch { Alert.alert('Erreur', 'Impossible de supprimer'); }
       }}]);
  };

  const handleAddRecord = async () => {
    if (!recForm.notes || !recForm.recordType) return Alert.alert('Erreur', 'Notes et type requis');
    setSaving(true);
    try {
      await api.post(`/dependents/${selected.id}/records`, {
        ...recForm,
        weight: recForm.weight ? parseFloat(recForm.weight) : undefined,
        height: recForm.height ? parseFloat(recForm.height) : undefined,
        temperature: recForm.temperature ? parseFloat(recForm.temperature) : undefined,
      });
      setRecordOpen(false); setRecForm(blankRec); loadRecords(selected.id);
    } catch { Alert.alert('Erreur', 'Impossible d\'ajouter le dossier'); }
    finally { setSaving(false); }
  };

  // ── Vue détail ──
  if (view === 'detail' && selected) return (
    <ScrollView style={S.screen}>
      <Surface style={[S.card, { marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Avatar.Text size={52} label={`${selected.firstName[0]}${selected.lastName[0]}`} style={{ backgroundColor: '#00A896' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>{selected.firstName} {selected.lastName}</Text>
          <Text style={{ color: '#666', fontSize: 13 }}>{calcAgeMob(selected.dateOfBirth)} ans • {selected.gender === 'MALE' ? 'Garçon' : selected.gender === 'FEMALE' ? 'Fille' : '—'}</Text>
          {selected.bloodGroup ? <Chip compact style={{ marginTop: 4, alignSelf: 'flex-start' }}>{selected.bloodGroup}</Chip> : null}
        </View>
        <TouchableOpacity onPress={() => handleDelete(selected)}>
          <Icon source="delete" size={22} color="#E63946" />
        </TouchableOpacity>
      </Surface>

      {selected.allergies ? (
        <Surface style={[S.card, { marginBottom: 12 }]}>
          <Text style={S.sectionLabel}>Allergies</Text>
          <Text style={{ color: '#E63946', fontSize: 13 }}>{selected.allergies}</Text>
        </Surface>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <Text style={{ fontWeight: '700', fontSize: 15, color: '#0F2D52' }}>Dossiers médicaux ({records.length})</Text>
        <Button mode="contained" compact onPress={() => { setRecForm(blankRec); setRecordOpen(true); }}
          buttonColor="#00A896">+ Ajouter</Button>
      </View>

      {recordsLoading ? <ActivityIndicator color="#00A896" style={{ marginTop: 20 }} /> :
        records.length === 0 ? <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>Aucun dossier</Text> :
        records.map((r: any) => (
          <Surface key={r.id} style={[S.card, { marginBottom: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Chip compact>{RECORD_TYPES_MOB.find(t => t.value === r.recordType)?.label ?? r.recordType}</Chip>
              <Text style={{ color: '#666', fontSize: 12 }}>{new Date(r.recordDate).toLocaleDateString('fr-FR')}</Text>
            </View>
            {r.diagnosis ? <Text style={{ fontWeight: '600', fontSize: 13 }}>{r.diagnosis}</Text> : null}
            <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{r.notes}</Text>
            {(r.weight || r.height || r.temperature) ? (
              <Text style={{ color: '#999', fontSize: 11, marginTop: 4 }}>
                {r.weight ? `${r.weight}kg ` : ''}{r.height ? `${r.height}cm ` : ''}{r.temperature ? `${r.temperature}°C` : ''}
              </Text>
            ) : null}
          </Surface>
        ))
      }

      <Button mode="outlined" onPress={() => setView('list')} style={{ marginVertical: 16 }}>← Retour</Button>

      {/* Dialog ajout dossier */}
      {recordOpen && (
        <Surface style={[S.card, { backgroundColor: '#f8f9fa', marginTop: 8 }]}>
          <Text style={[S.screenTitle, { fontSize: 15, marginBottom: 12 }]}>Nouveau dossier</Text>
          <TextInput label="Date" value={recForm.recordDate} onChangeText={v => setRecForm(p => ({ ...p, recordDate: v }))}
            mode="outlined" style={{ marginBottom: 10 }} />
          <Text style={S.sectionLabel}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {RECORD_TYPES_MOB.map(t => (
              <Chip key={t.value} selected={recForm.recordType === t.value} onPress={() => setRecForm(p => ({ ...p, recordType: t.value }))}
                style={{ marginRight: 6 }}>{t.label}</Chip>
            ))}
          </ScrollView>
          <TextInput label="Diagnostic" value={recForm.diagnosis} onChangeText={v => setRecForm(p => ({ ...p, diagnosis: v }))} mode="outlined" style={{ marginBottom: 10 }} />
          <TextInput label="Symptômes" value={recForm.symptoms} onChangeText={v => setRecForm(p => ({ ...p, symptoms: v }))} mode="outlined" style={{ marginBottom: 10 }} />
          <TextInput label="Notes *" value={recForm.notes} onChangeText={v => setRecForm(p => ({ ...p, notes: v }))} mode="outlined" multiline style={{ marginBottom: 10 }} />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput label="Poids (kg)" value={recForm.weight} onChangeText={v => setRecForm(p => ({ ...p, weight: v }))} mode="outlined" keyboardType="numeric" style={{ flex: 1 }} />
            <TextInput label="Taille (cm)" value={recForm.height} onChangeText={v => setRecForm(p => ({ ...p, height: v }))} mode="outlined" keyboardType="numeric" style={{ flex: 1 }} />
            <TextInput label="Temp. (°C)" value={recForm.temperature} onChangeText={v => setRecForm(p => ({ ...p, temperature: v }))} mode="outlined" keyboardType="numeric" style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button mode="outlined" onPress={() => setRecordOpen(false)} style={{ flex: 1 }}>Annuler</Button>
            <Button mode="contained" onPress={handleAddRecord} loading={saving} disabled={saving} buttonColor="#00A896" style={{ flex: 1 }}>Enregistrer</Button>
          </View>
        </Surface>
      )}
    </ScrollView>
  );

  // ── Vue liste ──
  return (
    <View style={S.screen}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={S.screenTitle}>Mes Dépendants</Text>
        <Button mode="contained" compact onPress={() => { setDepForm(blankDep); setAddOpen(true); }} buttonColor="#00A896">+ Ajouter</Button>
      </View>

      {loading ? <ActivityIndicator color="#00A896" style={{ marginTop: 40 }} /> :
        dependants.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Icon source="baby-face-outline" size={64} color="#ccc" />
            <Text style={{ color: '#999', marginTop: 12, textAlign: 'center' }}>Aucun dépendant enregistré{'\n'}(enfants de 0 à 15 ans)</Text>
            <Button mode="outlined" onPress={() => setAddOpen(true)} style={{ marginTop: 16, borderColor: '#00A896' }} textColor="#00A896">Ajouter un dépendant</Button>
          </View>
        ) : (
          <FlatList
            data={dependants}
            keyExtractor={i => i.id}
            renderItem={({ item: dep }) => (
              <TouchableOpacity onPress={() => openDetail(dep)}>
                <Surface style={[S.card, { marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  <Avatar.Text size={44} label={`${dep.firstName[0]}${dep.lastName[0]}`} style={{ backgroundColor: '#00A896' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 15 }}>{dep.firstName} {dep.lastName}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>{dep.age} ans • {dep.gender === 'MALE' ? 'Garçon' : dep.gender === 'FEMALE' ? 'Fille' : '—'}</Text>
                    {dep.bloodGroup ? <Text style={{ color: '#E63946', fontSize: 11 }}>🩸 {dep.bloodGroup}</Text> : null}
                  </View>
                  <Icon source="chevron-right" size={22} color="#999" />
                </Surface>
              </TouchableOpacity>
            )}
          />
        )
      }

      {/* Dialog ajout dépendant */}
      {addOpen && (
        <Surface style={[S.card, { backgroundColor: '#f8f9fa', marginTop: 8 }]}>
          <Text style={[S.screenTitle, { fontSize: 15, marginBottom: 12 }]}>Nouveau dépendant</Text>
          <TextInput label="Prénom *" value={depForm.firstName} onChangeText={v => setDepForm(p => ({ ...p, firstName: v }))} mode="outlined" style={{ marginBottom: 10 }} />
          <TextInput label="Nom *" value={depForm.lastName} onChangeText={v => setDepForm(p => ({ ...p, lastName: v }))} mode="outlined" style={{ marginBottom: 10 }} />
          <TextInput label="Date de naissance (AAAA-MM-JJ) *" value={depForm.dateOfBirth} onChangeText={v => setDepForm(p => ({ ...p, dateOfBirth: v }))} mode="outlined" style={{ marginBottom: 10 }} placeholder="2020-03-15" />
          <Text style={S.sectionLabel}>Genre</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            {[{ v: 'MALE', l: 'Garçon' }, { v: 'FEMALE', l: 'Fille' }].map(g => (
              <Chip key={g.v} selected={depForm.gender === g.v} onPress={() => setDepForm(p => ({ ...p, gender: g.v }))} style={{ flex: 1 }}>{g.l}</Chip>
            ))}
          </View>
          <Text style={S.sectionLabel}>Groupe sanguin</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {BLOOD_GROUPS_MOB.map(bg => (
              <Chip key={bg} selected={depForm.bloodGroup === bg} onPress={() => setDepForm(p => ({ ...p, bloodGroup: bg }))} style={{ marginRight: 6 }}>{bg}</Chip>
            ))}
          </ScrollView>
          <TextInput label="Allergies" value={depForm.allergies} onChangeText={v => setDepForm(p => ({ ...p, allergies: v }))} mode="outlined" style={{ marginBottom: 10 }} />
          <TextInput label="Conditions chroniques" value={depForm.chronicConditions} onChangeText={v => setDepForm(p => ({ ...p, chronicConditions: v }))} mode="outlined" style={{ marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button mode="outlined" onPress={() => setAddOpen(false)} style={{ flex: 1 }}>Annuler</Button>
            <Button mode="contained" onPress={handleAdd} loading={saving} disabled={saving} buttonColor="#00A896" style={{ flex: 1 }}>Enregistrer</Button>
          </View>
        </Surface>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assistant IA santé
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_SUGGESTIONS_MOB = [
  'J\'ai de la fièvre depuis 2 jours',
  'Comment prévenir le paludisme ?',
  'Mon enfant a des diarrhées',
  'Quand consulter d\'urgence ?',
];

function AIChatScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<any>(null);

  const loadHistory = useCallback(async () => {
    try { const r = await api.get('/chatbot/history'); setMessages(r.data.data || []); }
    catch { /* silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput('');
    const tempId = `tmp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: 'user', content, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      const r = await api.post('/chatbot/message', { content });
      setMessages(prev => [...prev, r.data.data.message]);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearHistory = () => {
    Alert.alert('Effacer', 'Effacer tout l\'historique de conversation ?',
      [{ text: 'Annuler', style: 'cancel' },
       { text: 'Effacer', style: 'destructive', onPress: async () => {
         await api.delete('/chatbot/history'); setMessages([]);
       }}]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F4F6F9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Header */}
      <Surface style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, elevation: 2, backgroundColor: '#fff' }}>
        <Avatar.Icon size={40} icon="robot" style={{ backgroundColor: '#00A896' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: '#0F2D52' }}>MediBot — Assistant IA</Text>
          <Text style={{ fontSize: 11, color: '#00A896' }}>● En ligne • Conseils santé 24h/24</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearHistory}><Icon source="delete-outline" size={22} color="#999" /></TouchableOpacity>
        )}
      </Surface>

      {/* Disclaimer */}
      <Surface style={{ margin: 10, padding: 10, borderRadius: 8, backgroundColor: '#fff8e1', flexDirection: 'row', gap: 6, elevation: 0 }}>
        <Text style={{ fontSize: 11, color: '#795548', flex: 1 }}>
          ⚠️ MediBot donne des conseils généraux. Il ne remplace pas un médecin. En urgence, appelez le 15.
        </Text>
      </Surface>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator color="#00A896" style={{ flex: 1 }} />
      ) : (
        <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <Avatar.Icon size={64} icon="robot" style={{ backgroundColor: '#00A896', marginBottom: 12 }} />
              <Text style={{ fontWeight: '700', fontSize: 16, color: '#0F2D52', textAlign: 'center' }}>Bonjour ! Je suis MediBot</Text>
              <Text style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 20 }}>Posez-moi vos questions de santé</Text>
              <Text style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>Suggestions :</Text>
              {QUICK_SUGGESTIONS_MOB.map(s => (
                <TouchableOpacity key={s} onPress={() => send(s)} style={{ backgroundColor: '#e8f5e9', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8, alignSelf: 'stretch' }}>
                  <Text style={{ color: '#0F2D52', fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            messages.map(m => (
              <View key={m.id} style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <View style={{
                  maxWidth: '80%', borderRadius: 16, padding: 12,
                  backgroundColor: m.role === 'user' ? '#0F2D52' : '#fff',
                  borderWidth: m.role === 'assistant' ? 1 : 0, borderColor: '#e8eaed',
                }}>
                  <Text style={{ color: m.role === 'user' ? '#fff' : '#1a1a1a', fontSize: 14, lineHeight: 20 }}>
                    {m.content.replace(/\*\*(.*?)\*\*/g, (_: string, t: string) => t)}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: '#999', marginTop: 2, paddingHorizontal: 4 }}>
                  {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          )}
          {sending && (
            <View style={{ alignItems: 'flex-start', marginBottom: 10 }}>
              <Surface style={{ borderRadius: 16, padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8eaed' }}>
                <ActivityIndicator size="small" color="#00A896" />
              </Surface>
            </View>
          )}
        </ScrollView>
      )}

      {/* Saisie */}
      <Surface style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8, elevation: 4, backgroundColor: '#fff' }}>
        <TextInput
          value={input} onChangeText={setInput} mode="outlined" multiline
          placeholder="Posez votre question de santé..." style={{ flex: 1, maxHeight: 100 }}
          outlineColor="#e8eaed" activeOutlineColor="#00A896"
          onSubmitEditing={() => send()} disabled={sending}
        />
        <Button mode="contained" onPress={() => send()} disabled={!input.trim() || sending}
          buttonColor="#00A896" style={{ marginBottom: 2 }} loading={sending}>
          <Icon source="send" size={18} color="#fff" />
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Souscription
// ─────────────────────────────────────────────────────────────────────────────
const PAYMENT_METHODS_MOB = [
  { value: 'ORANGE_MONEY', label: 'Orange Money', icon: '🟠' },
  { value: 'WAVE',         label: 'Wave',         icon: '🔵' },
  { value: 'CARD',         label: 'Carte bancaire', icon: '💳' },
  { value: 'APPLE_PAY',    label: 'Apple Pay',    icon: '🍎' },
  { value: 'GOOGLE_PAY',   label: 'Google Pay',   icon: '🔴' },
];

const PATIENT_FEATURES_MOB = [
  'Rendez-vous médicaux illimités',
  'Messagerie avec les médecins',
  'Ordonnances électroniques',
  'Dossier médical complet',
  'Résultats de laboratoire',
  'Urgences médicales prioritaires',
];

function SubscriptionScreen() {
  const [sub,    setSub]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [method,  setMethod]  = useState('ORANGE_MONEY');
  const [phone,   setPhone]   = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName,setCardName]= useState('');

  useEffect(() => { loadSub(); }, []);

  const loadSub = async () => {
    setLoading(true);
    try {
      const r = await api.get(ENDPOINTS.SUBSCRIPTION_ME);
      setSub(r.data.data);
    } catch { /* pas de souscription */ }
    finally { setLoading(false); }
  };

  const handleSubscribe = async () => {
    if (['ORANGE_MONEY', 'WAVE'].includes(method) && !phone) {
      Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone'); return;
    }
    if (method === 'CARD' && (!cardNum || !cardExp || !cardCvv || !cardName)) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs de carte'); return;
    }
    setPaying(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const ref = ['ORANGE_MONEY', 'WAVE'].includes(method)
        ? `TEL-${phone.replace(/\s/g, '')}`
        : method === 'CARD' ? `CARD-${cardNum.slice(-4)}` : `${method}-SIM`;
      const r = await api.post(ENDPOINTS.SUBSCRIPTION_SUBSCRIBE, { paymentMethod: method, paymentReference: ref });
      Alert.alert('✅ Souscription activée', `N° ${r.data.data.subscriptionNumber}\nValidité : 1 an`);
      loadSub();
    } catch (e: any) {
      Alert.alert('Échec', e.response?.data?.message || 'Erreur de paiement');
    } finally { setPaying(false); }
  };

  const handleCancel = () => {
    Alert.alert('Annuler la souscription', 'Votre accès restera actif jusqu\'à expiration. Confirmer ?',
      [{ text: 'Non', style: 'cancel' },
       { text: 'Oui, annuler', style: 'destructive', onPress: async () => {
         await api.post(ENDPOINTS.SUBSCRIPTION_CANCEL);
         loadSub();
       }}]);
  };

  if (loading) return (
    <View style={S.center}><ActivityIndicator color="#0F2D52" /></View>
  );

  const isActive = sub?.isActive;
  const daysLeft = sub?.daysLeft ?? 0;
  const fmtDate  = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  // ── Vue active ──────────────────────────────────────────────────────────
  if (isActive && sub) {
    return (
      <ScrollView style={S.container}>
        <View style={{ padding: 16 }}>
          <Text style={[S.screenTitle, { marginBottom: 16 }]}>Ma souscription</Text>

          {/* Carte statut */}
          <Surface style={{ borderRadius: 14, padding: 20, marginBottom: 16, elevation: 2,
            backgroundColor: daysLeft <= 30 ? '#FFFBEB' : '#F0FDF4' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon source="shield-check" size={22} color={daysLeft <= 30 ? '#D97706' : '#16A34A'} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: daysLeft <= 30 ? '#92400E' : '#15803D' }}>
                Souscription active — Plan Patient
              </Text>
            </View>

            <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12,
              borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>N° DE SOUSCRIPTION</Text>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F2D52', fontFamily: 'monospace',
                letterSpacing: 1, marginTop: 2 }}>{sub.subscriptionNumber}</Text>
            </View>

            {[
              { label: 'Début', value: fmtDate(sub.startDate) },
              { label: 'Expiration', value: fmtDate(sub.endDate) },
              { label: 'Jours restants', value: `${daysLeft} jour${daysLeft > 1 ? 's' : ''}` },
              { label: 'Montant', value: `${sub.amount?.toLocaleString('fr-FR')} FCFA / an` },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between',
                paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F2D52' }}>{value}</Text>
              </View>
            ))}

            {daysLeft <= 30 && (
              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginTop: 12 }}>
                <Text style={{ fontSize: 12.5, color: '#92400E', fontWeight: '600' }}>
                  ⚠ Votre souscription expire dans {daysLeft} jours. Renouvelez dès maintenant.
                </Text>
              </View>
            )}
          </Surface>

          <Button mode="contained" buttonColor="#DC2626" onPress={handleCancel} style={{ borderRadius: 8 }}>
            Annuler la souscription
          </Button>
        </View>
      </ScrollView>
    );
  }

  // ── Vue paiement ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={S.container} keyboardShouldPersistTaps="handled">
      <View style={{ padding: 16 }}>
        <Text style={[S.screenTitle, { marginBottom: 4 }]}>Souscription MediRoute</Text>
        <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Accédez à toutes les fonctionnalités pour 5 000 FCFA / an.
        </Text>

        {/* Carte plan */}
        <Surface style={{ borderRadius: 14, padding: 20, marginBottom: 20, elevation: 2,
          backgroundColor: '#0F2D52' }}>
          <Chip style={{ backgroundColor: '#00A896', alignSelf: 'flex-start', marginBottom: 8 }}
            textStyle={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>Plan Patient</Chip>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>5 000 FCFA</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>par an</Text>
          {PATIENT_FEATURES_MOB.map(f => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon source="check-circle" size={16} color="#00A896" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{f}</Text>
            </View>
          ))}
        </Surface>

        {/* Méthodes de paiement */}
        <Text style={[S.label, { marginBottom: 10 }]}>Méthode de paiement</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {PAYMENT_METHODS_MOB.map(pm => (
            <TouchableOpacity key={pm.value}
              style={{ borderWidth: 2, borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 100,
                borderColor: method === pm.value ? '#0F2D52' : '#E2E8F0',
                backgroundColor: method === pm.value ? '#EEF3FF' : '#fff' }}
              onPress={() => setMethod(pm.value)}>
              <Text style={{ fontSize: 20 }}>{pm.icon}</Text>
              <Text style={{ fontSize: 11, fontWeight: method === pm.value ? '700' : '400',
                color: method === pm.value ? '#0F2D52' : '#64748B', marginTop: 4, textAlign: 'center' }}>
                {pm.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Champs selon méthode */}
        {['ORANGE_MONEY', 'WAVE'].includes(method) && (
          <View>
            <TextInput label="Numéro de téléphone *" value={phone}
              onChangeText={setPhone} keyboardType="phone-pad"
              mode="outlined" style={S.input} placeholder="77 123 45 67"
              outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          </View>
        )}
        {method === 'CARD' && (
          <View>
            <TextInput label="Nom du titulaire *" value={cardName}
              onChangeText={setCardName} mode="outlined" style={S.input}
              outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <TextInput label="Numéro de carte *" value={cardNum}
              onChangeText={v => setCardNum(v.replace(/\D/g, '').slice(0, 16))}
              keyboardType="numeric" mode="outlined" style={S.input}
              outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <View style={S.row}>
              <TextInput label="MM/AA *" value={cardExp} onChangeText={setCardExp}
                mode="outlined" dense style={[S.input, S.half]}
                outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
              <TextInput label="CVV *" value={cardCvv}
                onChangeText={v => setCardCvv(v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric" secureTextEntry mode="outlined" dense
                style={[S.input, S.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            </View>
          </View>
        )}
        {['APPLE_PAY', 'GOOGLE_PAY'].includes(method) && (
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 12,
            borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
            <Text style={{ fontSize: 30, marginBottom: 6 }}>
              {method === 'APPLE_PAY' ? '🍎' : '🔴'}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
              Appuyez sur "Souscrire" pour ouvrir{' '}
              {method === 'APPLE_PAY' ? 'Apple Pay' : 'Google Pay'} et confirmer le paiement.
            </Text>
          </View>
        )}

        {/* Récapitulatif */}
        <Surface style={{ borderRadius: 10, padding: 14, marginBottom: 16, elevation: 1,
          backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#64748B' }}>Plan Patient — 1 an</Text>
            <Text style={{ fontSize: 13, fontWeight: '700' }}>5 000 FCFA</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: '#64748B' }}>Méthode</Text>
            <Text style={{ fontSize: 13, fontWeight: '700' }}>
              {PAYMENT_METHODS_MOB.find(m => m.value === method)?.label}
            </Text>
          </View>
          <Divider style={{ marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F2D52' }}>Total</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F2D52' }}>5 000 FCFA</Text>
          </View>
        </Surface>

        <Button mode="contained" onPress={handleSubscribe} loading={paying}
          disabled={paying} buttonColor="#0F2D52"
          style={{ borderRadius: 10, paddingVertical: 4 }}
          labelStyle={{ fontSize: 15, fontWeight: '800' }}>
          Souscrire maintenant — 5 000 FCFA
        </Button>
        <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 10 }}>
          Paiement sécurisé · Validité 12 mois
        </Text>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profil
// ─────────────────────────────────────────────────────────────────────────────
function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [prof, setProf] = useState({
    firstName: user?.profile?.firstName ?? '',
    lastName:  user?.profile?.lastName  ?? '',
    phone:     user?.profile?.phone     ?? '',
    city:      user?.profile?.city      ?? '',
    region:    user?.profile?.region    ?? '',
  });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const notify = (text: string, err = false) => { setMsg(text); setIsError(err); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put(ENDPOINTS.PROFILE, { profile: prof });
      notify('Profil mis à jour avec succès !');
    } catch (e: any) {
      notify(e.response?.data?.message ?? 'Erreur', true);
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pw.next !== pw.confirm) { notify('Les mots de passe ne correspondent pas', true); return; }
    if (pw.next.length < 8) { notify('Minimum 8 caractères requis', true); return; }
    setSavingPw(true);
    try {
      await api.put(ENDPOINTS.CHANGE_PASSWORD, { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      notify('Mot de passe mis à jour !');
    } catch (e: any) {
      notify(e.response?.data?.message ?? 'Mot de passe actuel incorrect', true);
    } finally { setSavingPw(false); }
  };

  return (
    <ScrollView style={S.container} contentContainerStyle={{ padding: 16 }}>
      {/* Avatar */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Avatar.Text
          size={68} label={`${prof.firstName?.[0] ?? ''}${prof.lastName?.[0] ?? ''}`}
          style={{ backgroundColor: '#0F2D52' }} labelStyle={{ fontSize: 24 }}
        />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F2D52', marginTop: 10 }}>
          {prof.firstName} {prof.lastName}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748B' }}>{user?.email}</Text>
      </View>

      {msg ? (
        <Surface style={[S.msgBanner, { backgroundColor: isError ? '#FEE2E2' : '#DCFCE7' }]}>
          <Text style={{ color: isError ? '#991B1B' : '#166534', textAlign: 'center', fontSize: 13 }}>{msg}</Text>
        </Surface>
      ) : null}

      {/* Infos personnelles */}
      <Card mode="outlined" style={S.card}>
        <Card.Title title="Informations personnelles" titleStyle={S.sectionTitle} />
        <Card.Content>
          <View style={S.row}>
            <TextInput label="Prénom" value={prof.firstName} onChangeText={v => setProf(p => ({ ...p, firstName: v }))}
              mode="outlined" dense style={[S.input, S.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <TextInput label="Nom" value={prof.lastName} onChangeText={v => setProf(p => ({ ...p, lastName: v }))}
              mode="outlined" dense style={[S.input, S.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          </View>
          <TextInput label="Téléphone" value={prof.phone} onChangeText={v => setProf(p => ({ ...p, phone: v }))}
            mode="outlined" dense keyboardType="phone-pad" style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          <View style={S.row}>
            <TextInput label="Ville" value={prof.city} onChangeText={v => setProf(p => ({ ...p, city: v }))}
              mode="outlined" dense style={[S.input, S.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <TextInput label="Région" value={prof.region} onChangeText={v => setProf(p => ({ ...p, region: v }))}
              mode="outlined" dense style={[S.input, S.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          </View>
          <Button mode="contained" onPress={saveProfile} loading={saving} disabled={saving}
            buttonColor="#0F2D52" style={{ marginTop: 4 }}>Enregistrer</Button>
        </Card.Content>
      </Card>

      {/* Mot de passe */}
      <Card mode="outlined" style={S.card}>
        <Card.Title title="Changer le mot de passe" titleStyle={S.sectionTitle} />
        <Card.Content>
          <TextInput label="Mot de passe actuel" value={pw.current} onChangeText={v => setPw(p => ({ ...p, current: v }))}
            mode="outlined" dense secureTextEntry style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          <TextInput label="Nouveau mot de passe" value={pw.next} onChangeText={v => setPw(p => ({ ...p, next: v }))}
            mode="outlined" dense secureTextEntry style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          <TextInput label="Confirmer le nouveau mot de passe" value={pw.confirm} onChangeText={v => setPw(p => ({ ...p, confirm: v }))}
            mode="outlined" dense secureTextEntry style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          <Button mode="contained" onPress={changePassword} loading={savingPw}
            disabled={savingPw || !pw.current || pw.next.length < 8 || pw.next !== pw.confirm}
            buttonColor="#0F2D52" style={{ marginTop: 4 }}>Changer le mot de passe</Button>
        </Card.Content>
      </Card>

      {/* Urgence */}
      <Button mode="contained" icon="alarm-light" buttonColor="#DC2626"
        onPress={() => navigation.getParent()?.navigate('Emergency')}
        style={{ marginTop: 8, paddingVertical: 2 }}>
        Urgence médicale
      </Button>

      {/* Déconnexion */}
      <Button mode="outlined" icon="logout" onPress={logout}
        style={{ marginTop: 10, borderColor: '#E2E8F0' }} textColor="#EF4444">
        Se déconnecter
      </Button>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigator
// ─────────────────────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

export default function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            'Rendez-vous':    'calendar-month',
            'Hôpitaux':       'hospital-building',
            'Messages':       'chat',
            'Dépendants':     'baby-face-outline',
            'Assistant IA':   'robot',
            'Souscription':   'card-account-details-star',
            'Profil':         'account',
          };
          return <Icon source={icons[route.name] ?? 'circle'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00A896',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopColor: '#E2E8F0', paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#0F2D52' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Rendez-vous"  component={AppointmentsScreen} />
      <Tab.Screen name="Hôpitaux"     component={HospitalsScreen} />
      <Tab.Screen name="Messages"     component={MessagingScreen} />
      <Tab.Screen name="Dépendants"   component={DependantsScreen} />
      <Tab.Screen name="Assistant IA" component={AIChatScreen} />
      <Tab.Screen name="Souscription" component={SubscriptionScreen} />
      <Tab.Screen name="Profil"       component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles partagés
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F4F6F9' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  screenTitle:   { fontSize: 20, fontWeight: '800', color: '#0F2D52' },
  label:         { fontSize: 12.5, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:         { marginBottom: 12, backgroundColor: '#fff' },
  row:           { flexDirection: 'row', gap: 8 },
  half:          { flex: 1 },
  rowBetween:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card:          { marginBottom: 12, borderRadius: 12, backgroundColor: '#fff' },
  cardTitle:     { fontSize: 14, fontWeight: '700', color: '#0F2D52' },
  cardSub:       { fontSize: 12, color: '#64748B', marginTop: 3 },
  cardDate:      { fontSize: 13, color: '#374151', marginTop: 5, fontWeight: '500' },
  cardNote:      { fontSize: 12.5, color: '#9CA3AF', marginTop: 4 },
  sectionTitle:  { fontSize: 14, fontWeight: '700', color: '#0F2D52' },
  docChip:       { backgroundColor: '#EEF3FF', borderRadius: 10, padding: 10, marginRight: 8, minWidth: 130, alignItems: 'center' },
  docChipSel:    { backgroundColor: '#0F2D52' },
  bedBar:        { height: 7, borderRadius: 99, backgroundColor: '#E2E8F0', flexDirection: 'row', overflow: 'hidden', marginVertical: 5 },
  bedFill:       { height: '100%' },
  convItem:      { flexDirection: 'row', alignItems: 'center', padding: 16 },
  badge:         { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', fontSize: 9, minWidth: 16, height: 16 },
  contactPill:   { backgroundColor: '#EEF3FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chatHeader:    { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  bubble:        { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleMine:    { backgroundColor: '#0F2D52', borderBottomRightRadius: 4 },
  bubbleOther:   { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  inputRow:      { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC', gap: 8 },
  sendBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: '#00A896', justifyContent: 'center', alignItems: 'center' },
  sendBtnOff:    { backgroundColor: '#CBD5E0' },
  emergencyBanner: { padding: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#fff' },
  msgBanner:     { padding: 10, borderRadius: 8, marginBottom: 14 },
});
