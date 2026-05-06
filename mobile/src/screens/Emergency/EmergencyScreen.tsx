import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import {
  Button, Text, RadioButton, TextInput, Surface,
  ProgressBar, List, Chip, Icon,
} from 'react-native-paper';
import * as Location from 'expo-location';
import api from '../../services/api';
import { ENDPOINTS } from '../../config/constants';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SECTION_COLOR: Record<string, string> = {
  'Identité du patient': '#0F2D52',
  'État de conscience': '#7B2D8B',
  'Respiration': '#1565C0',
  'Douleur thoracique': '#C62828',
  'Blessures & Saignements': '#E65100',
  'Symptômes principaux': '#2E7D32',
  'Durée des symptômes': '#00695C',
  'Antécédents médicaux': '#4527A0',
  'Médicaments & Allergies': '#1565C0',
  'Mobilité': '#558B2F',
  'Transport': '#00838F',
  'Description de la situation': '#4E342E',
  'Localisation': '#283593',
};

export default function EmergencyScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { loadQuestions(); }, []);

  const loadQuestions = async () => {
    try {
      const res = await api.get(ENDPOINTS.EMERGENCY_FORM);
      setQuestions(res.data.data.questions);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le formulaire');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (key: string, value: any) => {
    setAnswers((prev: any) => ({ ...prev, [key]: value }));
  };

  const toggleMultiple = (key: string, option: string) => {
    const current: string[] = answers[key] || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    handleAnswer(key, updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La localisation est nécessaire pour les urgences');
        setSubmitting(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});

      const payload = {
        patientName: answers.name || 'Anonyme',
        patientAge: answers.age || null,
        patientGender: answers.gender || null,
        patientPhone: answers.phone || '',
        bloodGroup: answers.bloodGroup || null,
        city: answers.city || 'Dakar',
        region: answers.region || 'Dakar',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        consciousness: answers.consciousness || null,
        breathing: answers.breathing || null,
        chestPain: answers.chestPain || null,
        injury: answers.injury || null,
        symptoms: Array.isArray(answers.symptoms) ? answers.symptoms : [],
        duration: answers.duration || null,
        medicalHistory: Array.isArray(answers.medicalHistory) ? answers.medicalHistory : [],
        medications: answers.medications || '',
        canMove: answers.canMove || null,
        needsAmbulance: answers.needsAmbulance || null,
        description: answers.description || '',
        formResponses: questions.map((q) => ({
          question: q.question,
          answer: answers[q.field || q.id] || '',
        })),
      };

      const res = await api.post(ENDPOINTS.EMERGENCY_REQUEST, payload);
      setResult(res.data.data);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la demande d\'urgence');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={S.centered}>
        <Text>Chargement du formulaire…</Text>
      </View>
    );
  }

  // ── Résultat ─────────────────────────────────────────────────────────────
  if (result) {
    return (
      <ScrollView style={S.container}>
        <Surface style={S.surface}>
          <Text style={S.successTitle}>Demande enregistrée</Text>
          <Text style={S.successSub}>
            Score de priorité : {result.priorityScore}/10
          </Text>

          {result.assignedHospital ? (
            <>
              <Text style={[S.sectionLabel, { color: '#0F2D52', marginTop: 16 }]}>
                Hôpital assigné
              </Text>
              <List.Item
                title={result.assignedHospital.name}
                description={
                  `${result.assignedHospital.address}\n` +
                  `Distance : ${result.assignedHospital.distance} km · ` +
                  `Arrivée estimée : ${result.assignedHospital.estimatedArrival} min`
                }
                left={(p) => <List.Icon {...p} icon="hospital-building" color="#0F2D52" />}
                style={S.hospitalItem}
              />
              <Chip icon="phone" mode="outlined" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                {result.assignedHospital.phone}
              </Chip>
            </>
          ) : (
            <Text style={{ color: '#94A3B8', marginTop: 12 }}>
              Aucun hôpital d'urgence disponible à proximité pour le moment.
            </Text>
          )}

          <Button mode="contained" buttonColor="#0F2D52" style={{ marginTop: 24 }}
            onPress={() => navigation.goBack()}>
            Retour
          </Button>
        </Surface>
      </ScrollView>
    );
  }

  // ── Formulaire pas à pas ─────────────────────────────────────────────────
  const q = questions[step];
  if (!q) return null;

  const sectionColor = SECTION_COLOR[q.section] || '#0F2D52';
  const progress = (step + 1) / questions.length;
  const isLast = step === questions.length - 1;

  return (
    <ScrollView style={S.container} keyboardShouldPersistTaps="handled">
      <Surface style={S.surface}>
        {/* Header urgence */}
        <View style={[S.emergencyBanner]}>
          <Icon source="ambulance" size={22} color="#fff" />
          <Text style={S.emergencyBannerText}>URGENCE MÉDICALE</Text>
        </View>

        {/* Progression */}
        <ProgressBar progress={progress} color={sectionColor} style={S.progress} />
        <Text style={S.stepText}>Étape {step + 1} / {questions.length}</Text>

        {/* Section label */}
        <View style={[S.sectionBadge, { backgroundColor: sectionColor + '18' }]}>
          <Text style={[S.sectionLabel, { color: sectionColor }]}>{q.section}</Text>
        </View>

        {/* Question */}
        <Text style={S.questionText}>{q.question}</Text>

        {/* ── patient_info ───────────────────────────────────────────── */}
        {q.type === 'patient_info' && (
          <View>
            <TextInput label="Nom complet *" value={answers.name || ''}
              onChangeText={(v) => handleAnswer('name', v)}
              mode="outlined" style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />

            <View style={S.row}>
              <TextInput label="Âge" value={answers.age || ''}
                onChangeText={(v) => handleAnswer('age', v)}
                keyboardType="numeric" mode="outlined" dense
                style={[S.input, S.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
              <TextInput label="Téléphone *" value={answers.phone || ''}
                onChangeText={(v) => handleAnswer('phone', v)}
                keyboardType="phone-pad" mode="outlined" dense
                style={[S.input, S.half]} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            </View>

            <Text style={S.subLabel}>Sexe</Text>
            <RadioButton.Group
              onValueChange={(v) => handleAnswer('gender', v)}
              value={answers.gender || ''}>
              <View style={S.radioRow}>
                {['Homme', 'Femme', 'Autre'].map((g) => (
                  <TouchableOpacity key={g} style={S.radioOption}
                    onPress={() => handleAnswer('gender', g)}>
                    <RadioButton value={g} color="#0F2D52" />
                    <Text>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </RadioButton.Group>

            <Text style={S.subLabel}>Groupe sanguin</Text>
            <View style={S.chipWrap}>
              {BLOOD_GROUPS.map((g) => (
                <Chip key={g}
                  selected={answers.bloodGroup === g}
                  onPress={() => handleAnswer('bloodGroup', g)}
                  style={[S.chipItem, answers.bloodGroup === g && { backgroundColor: '#0F2D52' }]}
                  textStyle={{ color: answers.bloodGroup === g ? '#fff' : '#334155' }}>
                  {g}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* ── single_choice ──────────────────────────────────────────── */}
        {q.type === 'single_choice' && (
          <RadioButton.Group
            onValueChange={(v) => handleAnswer(q.field || q.id, v)}
            value={answers[q.field || q.id] || ''}>
            {q.options?.map((opt: string) => (
              <TouchableOpacity key={opt} style={[
                S.choiceRow,
                answers[q.field || q.id] === opt && { borderColor: sectionColor, backgroundColor: sectionColor + '0D' },
              ]} onPress={() => handleAnswer(q.field || q.id, opt)}>
                <RadioButton value={opt} color={sectionColor} />
                <Text style={S.choiceLabel}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        )}

        {/* ── multiple_choice ────────────────────────────────────────── */}
        {q.type === 'multiple_choice' && (
          <View>
            <Text style={S.hintText}>Appuyez pour sélectionner (plusieurs choix possibles)</Text>
            {q.options?.map((opt: string) => {
              const selected = (answers[q.field || q.id] || []).includes(opt);
              return (
                <TouchableOpacity key={opt} style={[
                  S.choiceRow,
                  selected && { borderColor: sectionColor, backgroundColor: sectionColor + '0D' },
                ]} onPress={() => toggleMultiple(q.field || q.id, opt)}>
                  <Icon
                    source={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={selected ? sectionColor : '#94A3B8'}
                  />
                  <Text style={[S.choiceLabel, selected && { color: sectionColor, fontWeight: '600' }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── text ──────────────────────────────────────────────────── */}
        {q.type === 'text' && (
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder={q.placeholder || ''}
            value={answers[q.field || q.id] || ''}
            onChangeText={(v) => handleAnswer(q.field || q.id, v)}
            style={S.textArea}
            outlineColor="#E2E8F0"
            activeOutlineColor={sectionColor}
          />
        )}

        {/* ── location ──────────────────────────────────────────────── */}
        {q.type === 'location' && (
          <View>
            <TextInput label="Ville" value={answers.city || 'Dakar'}
              onChangeText={(v) => handleAnswer('city', v)}
              mode="outlined" style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <TextInput label="Région" value={answers.region || 'Dakar'}
              onChangeText={(v) => handleAnswer('region', v)}
              mode="outlined" style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
            <TextInput label="Adresse précise (optionnel)" value={answers.address || ''}
              onChangeText={(v) => handleAnswer('address', v)}
              mode="outlined" style={S.input} outlineColor="#E2E8F0" activeOutlineColor="#0F2D52" />
          </View>
        )}

        {/* Navigation */}
        <View style={S.navRow}>
          <Button mode="outlined" onPress={() => setStep(step - 1)}
            disabled={step === 0} style={S.navBtn} textColor="#64748B">
            Précédent
          </Button>

          {isLast ? (
            <Button mode="contained" onPress={handleSubmit}
              loading={submitting} disabled={submitting}
              buttonColor="#C62828" style={S.navBtn}>
              Envoyer l'urgence
            </Button>
          ) : (
            <Button mode="contained" onPress={() => setStep(step + 1)}
              buttonColor={sectionColor} style={S.navBtn}>
              Suivant
            </Button>
          )}
        </View>
      </Surface>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  surface: { margin: 12, padding: 18, borderRadius: 14, elevation: 2 },

  emergencyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 10,
    marginBottom: 16, gap: 8,
  },
  emergencyBannerText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },

  progress: { height: 6, borderRadius: 3, marginBottom: 6 },
  stepText: { textAlign: 'center', color: '#64748B', fontSize: 12, marginBottom: 12 },

  sectionBadge: {
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  questionText: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 16, lineHeight: 22 },

  subLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 8, marginBottom: 4 },
  hintText: { fontSize: 11, color: '#94A3B8', marginBottom: 10, fontStyle: 'italic' },

  choiceRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 8, gap: 10,
  },
  choiceLabel: { fontSize: 14, color: '#334155', flex: 1 },

  radioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  radioOption: { flexDirection: 'row', alignItems: 'center' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chipItem: { borderRadius: 20 },

  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  input: { marginBottom: 10, backgroundColor: '#fff' },
  textArea: { marginBottom: 10, backgroundColor: '#fff' },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  navBtn: { flex: 1 },

  successTitle: { color: '#2E7D32', textAlign: 'center', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  successSub: { textAlign: 'center', color: '#64748B', marginBottom: 4 },
  hospitalItem: { backgroundColor: '#F8FAFC', borderRadius: 8, marginTop: 8 },
});
