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
// Agenda
// ─────────────────────────────────────────────────────────────────────────────
function AgendaScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    api.get(ENDPOINTS.APPOINTMENTS_DOCTOR)
      .then(r => setAppointments(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      load();
    } catch {}
  };

  const statusColor: Record<string, string> = {
    PENDING: '#F59E0B', CONFIRMED: '#10B981', CANCELLED: '#EF4444', COMPLETED: '#6366F1',
  };
  const statusLabel: Record<string, string> = {
    PENDING: 'En attente', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé', COMPLETED: 'Terminé',
    ALL: 'Tous',
  };

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  if (loading) return <View style={S.center}><ActivityIndicator animating size="large" color="#0F2D52" /></View>;

  return (
    <View style={S.container}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Title style={S.screenTitle}>Mon agenda</Title>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>{filtered.length} rendez-vous</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 4 }}>
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(f => (
            <Chip key={f} selected={filter === f} onPress={() => setFilter(f)} style={{ marginRight: 8 }}>
              {statusLabel[f] ?? f}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <View style={S.center}>
          <Icon source="calendar-blank-outline" size={52} color="#CBD5E0" />
          <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Aucun rendez-vous</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: a }) => (
            <Card style={S.card} mode="outlined">
              <Card.Content>
                <View style={S.rowBetween}>
                  <Text style={[S.cardTitle, { flex: 1 }]}>
                    {a.patient?.firstName} {a.patient?.lastName}
                  </Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: statusColor[a.status] + '22' }}>
                    <Text style={{ color: statusColor[a.status], fontSize: 11, fontWeight: '700' }}>
                      {statusLabel[a.status] ?? a.status}
                    </Text>
                  </View>
                </View>
                <Text style={S.cardSub}>{a.type} · {a.appointmentTime}</Text>
                <Text style={S.cardDate}>
                  {new Date(a.appointmentDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {a.reason ? <Text style={S.cardNote} numberOfLines={2}>{a.reason}</Text> : null}

                {a.status === 'PENDING' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Button mode="contained" compact onPress={() => changeStatus(a.id, 'CONFIRMED')}
                      buttonColor="#10B981" style={{ flex: 1 }}>Confirmer</Button>
                    <Button mode="outlined" compact onPress={() => changeStatus(a.id, 'CANCELLED')}
                      style={{ flex: 1, borderColor: '#EF4444' }} textColor="#EF4444">Annuler</Button>
                  </View>
                )}
                {a.status === 'CONFIRMED' && (
                  <Button mode="outlined" compact onPress={() => changeStatus(a.id, 'COMPLETED')}
                    style={{ marginTop: 10, borderColor: '#6366F1' }} textColor="#6366F1">
                    Marquer terminé
                  </Button>
                )}
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Patients
// ─────────────────────────────────────────────────────────────────────────────
function PatientsScreen() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get(ENDPOINTS.APPOINTMENTS_DOCTOR).then(r => {
      const appts: any[] = r.data.data || [];
      const seen = new Set<string>();
      const unique: any[] = [];
      appts.forEach(a => {
        const pid = a.patient?.id ?? a.patientId;
        if (a.patient && pid && !seen.has(pid)) {
          seen.add(pid);
          unique.push({ ...a.patient, id: pid, lastAppt: a });
        }
      });
      setPatients(unique);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    !search || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <View style={S.center}><ActivityIndicator animating size="large" color="#0F2D52" /></View>;

  return (
    <View style={S.container}>
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <Title style={S.screenTitle}>Mes patients</Title>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>{filtered.length} patient(s)</Text>
        <TextInput mode="outlined" dense placeholder="Rechercher un patient…"
          value={search} onChangeText={setSearch}
          left={<TextInput.Icon icon="magnify" />}
          style={{ marginTop: 12, backgroundColor: '#fff' }}
          outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
      </View>

      {filtered.length === 0 ? (
        <View style={S.center}>
          <Icon source="account-group-outline" size={52} color="#CBD5E0" />
          <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Aucun patient</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: p }) => (
            <Card style={S.card} mode="outlined">
              <Card.Content>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar.Text
                    size={44} label={`${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`}
                    style={{ backgroundColor: '#EEF3FF' }} labelStyle={{ color: '#0F2D52', fontSize: 14 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={S.cardTitle}>{p.firstName} {p.lastName}</Text>
                    <Text style={S.cardSub}>{p.email}</Text>
                    {p.lastAppt && (
                      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                        Dernier RDV : {new Date(p.lastAppt.appointmentDate).toLocaleDateString('fr-FR')} · {p.lastAppt.type}
                      </Text>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}
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
              {partner.firstName} {partner.lastName}
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B' }}>Patient</Text>
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
                {c.unreadCount > 0 && <Badge style={S.badge}>{c.unreadCount}</Badge>}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={S.rowBetween}>
                  <Text style={{ fontWeight: c.unreadCount > 0 ? '700' : '600', color: '#0F2D52', fontSize: 14 }}>
                    {c.partner.firstName} {c.partner.lastName}
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
            Patients disponibles
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
            {contacts
              .filter(c => !conversations.find(cv => cv.partner.id === c.id))
              .map(c => (
                <TouchableOpacity key={c.id} onPress={() => openThread(c)} style={S.contactPill}>
                  <Text style={{ color: '#0F2D52', fontWeight: '600', fontSize: 13 }}>
                    {c.firstName} {c.lastName}
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
// Souscription Médecin
// ─────────────────────────────────────────────────────────────────────────────
const PM_MOB = [
  { value: 'ORANGE_MONEY', label: 'Orange Money', icon: '🟠' },
  { value: 'WAVE',         label: 'Wave',         icon: '🔵' },
  { value: 'CARD',         label: 'Carte bancaire', icon: '💳' },
  { value: 'APPLE_PAY',    label: 'Apple Pay',    icon: '🍎' },
  { value: 'GOOGLE_PAY',   label: 'Google Pay',   icon: '🔴' },
];

const DOC_FEATURES = [
  'Gestion de l\'agenda complet',
  'Messagerie patients illimitée',
  'Prescriptions électroniques',
  'Dossiers médicaux patients',
  'Téléconsultations vidéo',
  'Statistiques & rapports',
];

// ─────────────────────────────────────────────────────────────────────────────
// Assistant IA santé (Médecin)
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_SUGGESTIONS_DOC = [
  'Protocole paludisme sévère adulte',
  'Critères d\'hospitalisation en urgence',
  'Interactions médicamenteuses courantes',
  'Dosage paracétamol enfant selon le poids',
  'Symptômes prééclampsie',
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
    Alert.alert('Effacer', 'Effacer tout l\'historique ?',
      [{ text: 'Annuler', style: 'cancel' },
       { text: 'Effacer', style: 'destructive', onPress: async () => {
         await api.delete('/chatbot/history'); setMessages([]);
       }}]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F4F6F9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Surface style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, elevation: 2, backgroundColor: '#fff' }}>
        <Avatar.Icon size={40} icon="robot" style={{ backgroundColor: '#00A896' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: '#0F2D52' }}>MediBot — Assistant IA</Text>
          <Text style={{ fontSize: 11, color: '#00A896' }}>● En ligne • Aide clinique 24h/24</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearHistory}><Icon source="delete-outline" size={22} color="#999" /></TouchableOpacity>
        )}
      </Surface>

      <Surface style={{ margin: 10, padding: 10, borderRadius: 8, backgroundColor: '#e8f5e9', flexDirection: 'row', gap: 6, elevation: 0 }}>
        <Text style={{ fontSize: 11, color: '#1b5e20', flex: 1 }}>
          ℹ️ MediBot fournit des informations cliniques générales. Toujours exercer votre jugement médical professionnel.
        </Text>
      </Surface>

      {loading ? <ActivityIndicator color="#00A896" style={{ flex: 1 }} /> : (
        <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Avatar.Icon size={64} icon="robot" style={{ backgroundColor: '#00A896', marginBottom: 12 }} />
              <Text style={{ fontWeight: '700', fontSize: 16, color: '#0F2D52', textAlign: 'center' }}>MediBot — Aide Clinique</Text>
              <Text style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 16 }}>Posez vos questions cliniques</Text>
              {QUICK_SUGGESTIONS_DOC.map(s => (
                <TouchableOpacity key={s} onPress={() => send(s)} style={{ backgroundColor: '#e8f5e9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8, alignSelf: 'stretch' }}>
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

      <Surface style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8, elevation: 4, backgroundColor: '#fff' }}>
        <TextInput
          value={input} onChangeText={setInput} mode="outlined" multiline
          placeholder="Posez votre question clinique..." style={{ flex: 1, maxHeight: 100 }}
          outlineColor="#e8eaed" activeOutlineColor="#00A896"
          disabled={sending}
        />
        <Button mode="contained" onPress={() => send()} disabled={!input.trim() || sending}
          buttonColor="#00A896" style={{ marginBottom: 2 }} loading={sending}>
          <Icon source="send" size={18} color="#fff" />
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

function SubscriptionScreen() {
  const [sub,    setSub]    = useState<any>(null);
  const [loading,setLoading]= useState(true);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState('ORANGE_MONEY');
  const [phone,  setPhone]  = useState('');
  const [cardNum,setCardNum]= useState('');
  const [cardExp,setCardExp]= useState('');
  const [cardCvv,setCardCvv]= useState('');
  const [cardName,setCardName]=useState('');

  useEffect(() => { loadSub(); }, []);

  const loadSub = async () => {
    setLoading(true);
    try {
      const r = await api.get(ENDPOINTS.SUBSCRIPTION_ME);
      setSub(r.data.data);
    } catch { /* pas de sub */ }
    finally { setLoading(false); }
  };

  const handleSubscribe = async () => {
    if (['ORANGE_MONEY','WAVE'].includes(method) && !phone) {
      Alert.alert('Erreur','Veuillez saisir votre numéro de téléphone'); return;
    }
    if (method === 'CARD' && (!cardNum || !cardExp || !cardCvv || !cardName)) {
      Alert.alert('Erreur','Veuillez remplir tous les champs de carte'); return;
    }
    setPaying(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const ref = ['ORANGE_MONEY','WAVE'].includes(method)
        ? `TEL-${phone.replace(/\s/g,'')}` : method === 'CARD'
        ? `CARD-${cardNum.slice(-4)}` : `${method}-SIM`;
      const r = await api.post(ENDPOINTS.SUBSCRIPTION_SUBSCRIBE, { paymentMethod: method, paymentReference: ref });
      Alert.alert('✅ Souscription activée', `N° ${r.data.data.subscriptionNumber}\nValidité : 1 an`);
      loadSub();
    } catch (e: any) {
      Alert.alert('Échec', e.response?.data?.message || 'Erreur de paiement');
    } finally { setPaying(false); }
  };

  if (loading) return <View style={S.center}><ActivityIndicator color="#0F2D52" /></View>;

  const isActive = sub?.isActive;
  const daysLeft = sub?.daysLeft ?? 0;
  const fmtD = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  if (isActive && sub) {
    return (
      <ScrollView style={S.container}>
        <View style={{ padding: 16 }}>
          <Text style={[S.screenTitle, { marginBottom: 16 }]}>Ma souscription</Text>
          <Surface style={{ borderRadius: 14, padding: 20, marginBottom: 16, elevation: 2,
            backgroundColor: daysLeft <= 30 ? '#FFFBEB' : '#F0FDF4' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon source="shield-check" size={22} color={daysLeft <= 30 ? '#D97706' : '#16A34A'} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: daysLeft <= 30 ? '#92400E' : '#15803D' }}>
                Souscription active — Plan Médecin
              </Text>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12,
              borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>N° DE SOUSCRIPTION</Text>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F2D52', fontFamily: 'monospace',
                letterSpacing: 1, marginTop: 2 }}>{sub.subscriptionNumber}</Text>
            </View>
            {[
              { label: 'Début',        value: fmtD(sub.startDate) },
              { label: 'Expiration',   value: fmtD(sub.endDate) },
              { label: 'Jours restants', value: `${daysLeft}j` },
              { label: 'Montant',      value: `${sub.amount?.toLocaleString('fr-FR')} FCFA / an` },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between',
                paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F2D52' }}>{value}</Text>
              </View>
            ))}
          </Surface>
          <Button mode="contained" buttonColor="#DC2626" onPress={() =>
            Alert.alert('Annuler', 'Votre accès restera actif jusqu\'à expiration. Confirmer ?',
              [{ text: 'Non', style: 'cancel' },
               { text: 'Oui', style: 'destructive', onPress: async () => {
                 await api.post(ENDPOINTS.SUBSCRIPTION_CANCEL); loadSub();
               }}])} style={{ borderRadius: 8 }}>
            Annuler la souscription
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={S.container} keyboardShouldPersistTaps="handled">
      <View style={{ padding: 16 }}>
        <Text style={[S.screenTitle, { marginBottom: 4 }]}>Souscription MediRoute</Text>
        <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Accédez à toutes les fonctionnalités pour 15 000 FCFA / an.
        </Text>

        <Surface style={{ borderRadius: 14, padding: 20, marginBottom: 20, elevation: 2,
          backgroundColor: '#0F2D52' }}>
          <Chip style={{ backgroundColor: '#00A896', alignSelf: 'flex-start', marginBottom: 8 }}
            textStyle={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>Plan Médecin</Chip>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>15 000 FCFA</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>par an</Text>
          {DOC_FEATURES.map(f => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon source="check-circle" size={16} color="#00A896" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{f}</Text>
            </View>
          ))}
        </Surface>

        <Text style={[S.screenTitle, { fontSize: 14, marginBottom: 10 }]}>Méthode de paiement</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {PM_MOB.map(pm => (
            <TouchableOpacity key={pm.value}
              style={{ borderWidth: 2, borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 90,
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

        {['ORANGE_MONEY','WAVE'].includes(method) && (
          <TextInput label="Numéro de téléphone *" value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" mode="outlined" style={S.input}
            outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
        )}
        {method === 'CARD' && (
          <View>
            <TextInput label="Nom du titulaire *" value={cardName} onChangeText={setCardName}
              mode="outlined" style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <TextInput label="N° de carte *" value={cardNum}
              onChangeText={v => setCardNum(v.replace(/\D/g,'').slice(0,16))}
              keyboardType="numeric" mode="outlined" style={S.input}
              outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <View style={S.row}>
              <TextInput label="MM/AA *" value={cardExp} onChangeText={setCardExp}
                mode="outlined" dense style={[S.input, S.half]}
                outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
              <TextInput label="CVV *" value={cardCvv}
                onChangeText={v => setCardCvv(v.replace(/\D/g,'').slice(0,4))}
                keyboardType="numeric" secureTextEntry mode="outlined" dense
                style={[S.input, S.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            </View>
          </View>
        )}

        <Surface style={{ borderRadius: 10, padding: 14, marginBottom: 16, elevation: 1,
          backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#64748B' }}>Plan Médecin — 1 an</Text>
            <Text style={{ fontSize: 13, fontWeight: '700' }}>15 000 FCFA</Text>
          </View>
          <Divider style={{ marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F2D52' }}>Total</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F2D52' }}>15 000 FCFA</Text>
          </View>
        </Surface>

        <Button mode="contained" onPress={handleSubscribe} loading={paying}
          disabled={paying} buttonColor="#0F2D52"
          style={{ borderRadius: 10, paddingVertical: 4 }}
          labelStyle={{ fontSize: 15, fontWeight: '800' }}>
          Souscrire — 15 000 FCFA / an
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
function ProfileScreen() {
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
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Avatar.Text size={68} label={`${prof.firstName?.[0] ?? ''}${prof.lastName?.[0] ?? ''}`}
          style={{ backgroundColor: '#0F2D52' }} labelStyle={{ fontSize: 24 }} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F2D52', marginTop: 10 }}>
          Dr. {prof.firstName} {prof.lastName}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748B' }}>{user?.email}</Text>
        {user?.doctorInfo?.specialization && (
          <View style={{ backgroundColor: '#EEF3FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
            <Text style={{ color: '#0F2D52', fontWeight: '600', fontSize: 13 }}>{user.doctorInfo.specialization}</Text>
          </View>
        )}
      </View>

      {msg ? (
        <Surface style={{ padding: 10, borderRadius: 8, backgroundColor: isError ? '#FEE2E2' : '#DCFCE7', marginBottom: 14 }}>
          <Text style={{ color: isError ? '#991B1B' : '#166534', textAlign: 'center', fontSize: 13 }}>{msg}</Text>
        </Surface>
      ) : null}

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
          <Button mode="contained" onPress={saveProfile} loading={saving} disabled={saving}
            buttonColor="#0F2D52" style={{ marginTop: 4 }}>Enregistrer</Button>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={S.card}>
        <Card.Title title="Changer le mot de passe" titleStyle={S.sectionTitle} />
        <Card.Content>
          <TextInput label="Mot de passe actuel" value={pw.current} onChangeText={v => setPw(p => ({ ...p, current: v }))}
            mode="outlined" dense secureTextEntry style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          <TextInput label="Nouveau mot de passe" value={pw.next} onChangeText={v => setPw(p => ({ ...p, next: v }))}
            mode="outlined" dense secureTextEntry style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          <TextInput label="Confirmer" value={pw.confirm} onChangeText={v => setPw(p => ({ ...p, confirm: v }))}
            mode="outlined" dense secureTextEntry style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          <Button mode="contained" onPress={changePassword} loading={savingPw}
            disabled={savingPw || !pw.current || pw.next.length < 8 || pw.next !== pw.confirm}
            buttonColor="#0F2D52" style={{ marginTop: 4 }}>Changer le mot de passe</Button>
        </Card.Content>
      </Card>

      <Button mode="outlined" icon="logout" onPress={logout}
        style={{ marginTop: 8, borderColor: '#E2E8F0' }} textColor="#EF4444">
        Se déconnecter
      </Button>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigator
// ─────────────────────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            'Assistant IA':  'robot',
            'Agenda':        'calendar-month',
            'Patients':      'account-group',
            'Messages':      'chat',
            'Souscription':  'card-account-details-star',
            'Profil':        'account',
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
      <Tab.Screen name="Agenda"        component={AgendaScreen} />
      <Tab.Screen name="Patients"      component={PatientsScreen} />
      <Tab.Screen name="Messages"      component={MessagingScreen} />
      <Tab.Screen name="Assistant IA"  component={AIChatScreen} />
      <Tab.Screen name="Souscription"  component={SubscriptionScreen} />
      <Tab.Screen name="Profil"        component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const S = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F4F6F9' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  screenTitle:  { fontSize: 20, fontWeight: '800', color: '#0F2D52' },
  input:        { marginBottom: 12, backgroundColor: '#fff' },
  row:          { flexDirection: 'row', gap: 8 },
  half:         { flex: 1 },
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card:         { marginBottom: 12, borderRadius: 12, backgroundColor: '#fff' },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: '#0F2D52' },
  cardSub:      { fontSize: 12, color: '#64748B', marginTop: 3 },
  cardDate:     { fontSize: 13, color: '#374151', marginTop: 5, fontWeight: '500' },
  cardNote:     { fontSize: 12.5, color: '#9CA3AF', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0F2D52' },
  convItem:     { flexDirection: 'row', alignItems: 'center', padding: 16 },
  badge:        { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', fontSize: 9, minWidth: 16, height: 16 },
  contactPill:  { backgroundColor: '#EEF3FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chatHeader:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  bubble:       { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleMine:   { backgroundColor: '#0F2D52', borderBottomRightRadius: 4 },
  bubbleOther:  { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC', gap: 8 },
  sendBtn:      { width: 42, height: 42, borderRadius: 21, backgroundColor: '#00A896', justifyContent: 'center', alignItems: 'center' },
  sendBtnOff:   { backgroundColor: '#CBD5E0' },
});
