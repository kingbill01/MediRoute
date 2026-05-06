import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, Surface } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../config/constants';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }
    setLoading(true); setError('');
    try {
      const response = await api.post(ENDPOINTS.LOGIN, { email, password });
      if (response.data.success) {
        await login(response.data.data.user, response.data.data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Surface style={styles.surface}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Title style={styles.title}>MediRoute</Title>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineColor="#E2E8F0"
            activeOutlineColor="#0F2D52"
          />
          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(v => !v)} />}
            style={styles.input}
            outlineColor="#E2E8F0"
            activeOutlineColor="#0F2D52"
          />

          {error ? <HelperText type="error" visible>{error}</HelperText> : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor="#0F2D52"
          >
            Se connecter
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.linkButton}
            textColor="#00A896"
          >
            Pas encore de compte ? S'inscrire
          </Button>

          <View style={styles.emergencyContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Emergency')}
              buttonColor="#DC2626"
              icon="alarm-light"
              style={styles.emergencyButton}
            >
              URGENCE MÉDICALE
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  surface: { padding: 24, borderRadius: 16, elevation: 4 },
  header: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#0F2D52', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '800', color: '#0F2D52' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  input: { marginBottom: 14, backgroundColor: '#fff' },
  button: { marginTop: 8, paddingVertical: 4 },
  linkButton: { marginTop: 8 },
  emergencyContainer: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 20 },
  emergencyButton: { paddingVertical: 4 },
});
