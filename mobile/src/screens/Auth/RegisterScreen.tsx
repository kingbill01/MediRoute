import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import {
  TextInput, Button, Text, Title, HelperText, Surface,
  SegmentedButtons, Divider,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../config/constants';

export default function RegisterScreen({ navigation }: any) {
  const { login } = useAuth();
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', city: 'Dakar', region: 'Dakar',
  });
  const [doctorForm, setDoctorForm] = useState({
    specialization: '', licenseNumber: '', hospitalAffiliation: '',
  });

  const up = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));
  const upDoc = (field: string, value: string) => setDoctorForm(f => ({ ...f, [field]: value }));

  const handleRegister = async () => {
    const { firstName, lastName, email, password, phone } = form;
    if (!firstName || !lastName || !email || !password || !phone) {
      setError('Veuillez remplir tous les champs obligatoires'); return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères'); return;
    }
    if (role === 'doctor' && (!doctorForm.specialization || !doctorForm.licenseNumber)) {
      setError('Spécialisation et numéro de licence requis'); return;
    }

    setLoading(true); setError('');
    try {
      const payload: any = {
        role, email, password,
        profile: { firstName, lastName, phone, city: form.city, region: form.region },
      };
      if (role === 'doctor') payload.doctorInfo = doctorForm;

      const response = await api.post(ENDPOINTS.REGISTER, payload);
      if (response.data.success) {
        await login(response.data.data.user, response.data.data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Surface style={styles.surface}>
          <Title style={styles.title}>Créer un compte</Title>

          <SegmentedButtons
            value={role}
            onValueChange={v => setRole(v as 'patient' | 'doctor')}
            buttons={[
              { value: 'patient', label: 'Patient', icon: 'account' },
              { value: 'doctor', label: 'Médecin', icon: 'doctor' },
            ]}
            style={styles.segmented}
          />

          <Divider style={styles.divider} />
          <Text style={styles.sectionLabel}>Informations personnelles</Text>

          <View style={styles.row}>
            <TextInput label="Prénom *" value={form.firstName} onChangeText={v => up('firstName', v)}
              mode="outlined" dense style={[styles.input, styles.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <TextInput label="Nom *" value={form.lastName} onChangeText={v => up('lastName', v)}
              mode="outlined" dense style={[styles.input, styles.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          </View>

          <TextInput label="Email *" value={form.email} onChangeText={v => up('email', v)}
            mode="outlined" keyboardType="email-address" autoCapitalize="none"
            style={styles.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />

          <TextInput label="Téléphone *" value={form.phone} onChangeText={v => up('phone', v)}
            mode="outlined" keyboardType="phone-pad"
            style={styles.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />

          <View style={styles.row}>
            <TextInput label="Ville" value={form.city} onChangeText={v => up('city', v)}
              mode="outlined" dense style={[styles.input, styles.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <TextInput label="Région" value={form.region} onChangeText={v => up('region', v)}
              mode="outlined" dense style={[styles.input, styles.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          </View>

          <TextInput label="Mot de passe *" value={form.password} onChangeText={v => up('password', v)}
            mode="outlined" secureTextEntry
            style={styles.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />

          {role === 'doctor' && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionLabel}>Informations professionnelles</Text>
              <TextInput label="Spécialisation *" value={doctorForm.specialization} onChangeText={v => upDoc('specialization', v)}
                mode="outlined" style={styles.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
              <TextInput label="N° de licence *" value={doctorForm.licenseNumber} onChangeText={v => upDoc('licenseNumber', v)}
                mode="outlined" style={styles.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
              <TextInput label="Hôpital affilié" value={doctorForm.hospitalAffiliation} onChangeText={v => upDoc('hospitalAffiliation', v)}
                mode="outlined" style={styles.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            </>
          )}

          {error ? <HelperText type="error" visible style={styles.error}>{error}</HelperText> : null}

          <Button
            mode="contained" onPress={handleRegister}
            loading={loading} disabled={loading}
            style={styles.button} buttonColor="#0F2D52"
          >
            Créer mon compte
          </Button>

          <Button mode="text" onPress={() => navigation.goBack()} textColor="#64748B" style={{ marginTop: 6 }}>
            Déjà un compte ? Se connecter
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  scrollContainer: { padding: 16, paddingBottom: 32 },
  surface: { padding: 20, borderRadius: 16, elevation: 2 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F2D52', textAlign: 'center', marginBottom: 16 },
  segmented: { marginBottom: 16 },
  divider: { marginVertical: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  half: { flex: 1 },
  error: { fontSize: 13, marginBottom: 8 },
  button: { marginTop: 8, paddingVertical: 4 },
});
