import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Nettoyer la base de données
  await prisma.emergencyRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.doctorInfo.deleteMany();
  await prisma.patientInfo.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Base de données nettoyée');

  // Créer des hôpitaux du Sénégal
  const hospitals = await prisma.hospital.createMany({
    data: [
      {
        name: 'Hôpital Principal de Dakar',
        type: 'PUBLIC',
        region: 'Dakar',
        phone: '+221 33 839 50 50',
        email: 'contact@hp-dakar.sn',
        emergencyPhone: '+221 33 839 50 00',
        address: '1 Avenue Nelson Mandela',
        city: 'Dakar',
        latitude: 14.6937,
        longitude: -17.4441,
        services: 'Urgences,Chirurgie,Maternité,Pédiatrie,Cardiologie',
        specializations: 'Médecine générale,Chirurgie,Gynécologie',
        facilities: 'Scanner,IRM,Laboratoire,Radiologie',
        totalBeds: 500,
        availableBeds: 120,
        emergencyAvailable: true,
        ambulanceAvailable: true,
        openingHours: '{"all": "24/7"}',
        canAcceptEmergency: true,
        waitingTime: 15,
        verified: true,
        rating: 4.5,
      },
      {
        name: 'Hôpital Aristide Le Dantec',
        type: 'PUBLIC',
        region: 'Dakar',
        phone: '+221 33 821 21 81',
        emergencyPhone: '+221 33 821 21 80',
        address: '30 Avenue Pasteur',
        city: 'Dakar',
        latitude: 14.6892,
        longitude: -17.4542,
        services: 'Urgences,Chirurgie,Ophtalmologie,Dermatologie',
        specializations: 'Ophtalmologie,Dermatologie,ORL',
        facilities: 'Laboratoire,Radiologie,Pharmacie',
        totalBeds: 300,
        availableBeds: 80,
        emergencyAvailable: true,
        ambulanceAvailable: true,
        openingHours: '{"all": "24/7"}',
        canAcceptEmergency: true,
        waitingTime: 20,
        verified: true,
        rating: 4.2,
      },
      {
        name: 'Clinique de la Madeleine',
        type: 'PRIVATE',
        region: 'Dakar',
        phone: '+221 33 849 30 30',
        email: 'contact@madeleine.sn',
        emergencyPhone: '+221 33 849 30 00',
        address: 'Route de la Corniche',
        city: 'Dakar',
        latitude: 14.7167,
        longitude: -17.4677,
        services: 'Urgences,Chirurgie,Maternité,Cardiologie,Neurologie',
        specializations: 'Cardiologie,Neurologie,Chirurgie plastique',
        facilities: 'Scanner,IRM,Laboratoire ultramoderne,Bloc opératoire',
        totalBeds: 150,
        availableBeds: 60,
        emergencyAvailable: true,
        ambulanceAvailable: true,
        openingHours: '{"all": "24/7"}',
        canAcceptEmergency: true,
        waitingTime: 10,
        verified: true,
        rating: 4.8,
        website: 'https://clinique-madeleine.sn',
        description: 'Clinique privée de référence à Dakar avec équipements modernes',
      },
      {
        name: 'Centre de Santé de Parcelles Assainies',
        type: 'HEALTH_CENTER',
        region: 'Dakar',
        phone: '+221 33 835 12 34',
        emergencyPhone: '+221 33 835 12 30',
        address: 'Unité 15, Parcelles Assainies',
        city: 'Dakar',
        latitude: 14.7628,
        longitude: -17.4305,
        services: 'Consultations,Vaccinations,Maternité,Pédiatrie',
        specializations: 'Médecine générale,Pédiatrie',
        facilities: 'Laboratoire basique,Pharmacie',
        totalBeds: 50,
        availableBeds: 20,
        emergencyAvailable: true,
        ambulanceAvailable: false,
        openingHours: '{"weekdays": "8h-18h", "weekend": "8h-14h"}',
        canAcceptEmergency: true,
        waitingTime: 30,
        verified: true,
        rating: 4.0,
      },
      {
        name: 'Hôpital Régional de Thiès',
        type: 'PUBLIC',
        region: 'Thiès',
        phone: '+221 33 951 10 10',
        emergencyPhone: '+221 33 951 10 00',
        address: 'Route Nationale 2',
        city: 'Thiès',
        latitude: 14.7886,
        longitude: -16.9344,
        services: 'Urgences,Chirurgie,Maternité,Médecine interne',
        specializations: 'Médecine générale,Chirurgie,Gynécologie',
        facilities: 'Scanner,Laboratoire,Radiologie',
        totalBeds: 200,
        availableBeds: 70,
        emergencyAvailable: true,
        ambulanceAvailable: true,
        openingHours: '{"all": "24/7"}',
        canAcceptEmergency: true,
        waitingTime: 25,
        verified: true,
        rating: 4.1,
      },
    ],
  });

  console.log(`✅ ${hospitals.count} hôpitaux créés`);

  // Créer un médecin de test
  const hashedPassword = await bcrypt.hash('Doctor123!', 10);
  
  const doctor = await prisma.user.create({
    data: {
      email: 'dr.diallo@mediroute.sn',
      password: hashedPassword,
      role: 'DOCTOR',
      firstName: 'Amadou',
      lastName: 'Diallo',
      phone: '+221771234567',
      city: 'Dakar',
      region: 'Dakar',
      doctorInfo: {
        create: {
          specialization: 'Médecine générale',
          licenseNumber: 'MD-SN-2020-1234',
          hospitalAffiliation: 'Hôpital Principal de Dakar',
          consultationFee: 15000,
          yearsOfExperience: 10,
          bio: 'Médecin généraliste avec 10 ans d\'expérience',
          availabilities: {
            create: [
              {
                dayOfWeek: 'Monday',
                startTime: '08:00',
                endTime: '17:00',
              },
              {
                dayOfWeek: 'Tuesday',
                startTime: '08:00',
                endTime: '17:00',
              },
              {
                dayOfWeek: 'Wednesday',
                startTime: '08:00',
                endTime: '17:00',
              },
              {
                dayOfWeek: 'Thursday',
                startTime: '08:00',
                endTime: '17:00',
              },
              {
                dayOfWeek: 'Friday',
                startTime: '08:00',
                endTime: '17:00',
              },
            ],
          },
        },
      },
    },
  });

  console.log('✅ Médecin de test créé:', doctor.email);

  // Créer un patient de test
  const patient = await prisma.user.create({
    data: {
      email: 'patient@mediroute.sn',
      password: await bcrypt.hash('Patient123!', 10),
      role: 'PATIENT',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+221779876543',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'MALE',
      city: 'Dakar',
      region: 'Dakar',
      patientInfo: {
        create: {
          bloodGroup: 'A+',
          allergies: 'Pénicilline',
          chronicConditions: '',
          emergencyContactName: 'Marie Dupont',
          emergencyContactPhone: '+221771112233',
          emergencyContactRelationship: 'Épouse',
        },
      },
    },
  });

  console.log('✅ Patient de test créé:', patient.email);

  console.log('\n🎉 Seed terminé avec succès!');
  console.log('\n📋 Comptes de test:');
  console.log('👨‍⚕️ Médecin:');
  console.log('   Email: dr.diallo@mediroute.sn');
  console.log('   Password: Doctor123!');
  console.log('\n🧑‍💼 Patient:');
  console.log('   Email: patient@mediroute.sn');
  console.log('   Password: Patient123!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
