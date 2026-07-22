import { PrismaClient, type AppointmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FIRST = ['Layla', 'Omar', 'Nour', 'Yousef', 'Huda', 'Ali', 'Mona', 'Zaid', 'Sara', 'Khalid'];
const LAST = ['Hassan', 'Ahmed', 'Khan', 'Ali', 'Saleh', 'Ibrahim', 'Farouk', 'Nasser'];
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

async function main() {
  console.log('Clearing…');
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: { name: 'Sara (Admin)', email: 'admin@clinicflow.dev', passwordHash: hash, role: 'ADMIN' },
  });
  await prisma.user.create({
    data: { name: 'Front Desk', email: 'staff@clinicflow.dev', passwordHash: hash, role: 'STAFF' },
  });

  const providerData = [
    { name: 'Dr. Amina Saleh', specialty: 'General', workStartMin: 540, workEndMin: 1020, slotMinutes: 30 },
    { name: 'Dr. Karim Nasser', specialty: 'Dermatology', workStartMin: 600, workEndMin: 960, slotMinutes: 20 },
    { name: 'Dr. Lina Farouk', specialty: 'Pediatrics', workStartMin: 480, workEndMin: 900, slotMinutes: 30 },
    { name: 'Dr. Sami Ibrahim', specialty: 'Cardiology', workStartMin: 540, workEndMin: 780, slotMinutes: 45 },
  ];
  const providers = [];
  for (const p of providerData) providers.push(await prisma.provider.create({ data: p }));

  const patients = [];
  for (let i = 0; i < 30; i++) {
    const blood = ['A+', 'O+', 'B+', 'AB+', 'O-', 'A-'];
    const genders = ['Female', 'Male'];
    const allergyPool = ['None', 'Penicillin', 'Peanuts', 'Pollen', 'Lactose'];
    const p = await prisma.patient.create({
      data: {
        name: `${pick(FIRST)} ${pick(LAST)}`,
        email: `patient${i + 1}@example.com`,
        phone: `+9715${Math.floor(1000000 + Math.random() * 8999999)}`,
        gender: pick(genders),
        bloodType: pick(blood),
        allergies: pick(allergyPool),
        dob: new Date(1970 + Math.floor(Math.random() * 45), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 27)),
      },
    });
    // Give the first patients a bit of medical history.
    if (i < 10) {
      await prisma.medicalRecord.createMany({
        data: [
          { patientId: p.id, kind: 'VISIT', title: 'Initial consultation', details: 'Routine check-up, vitals normal.', authorName: 'Dr. Amina Saleh' },
          { patientId: p.id, kind: 'DIAGNOSIS', title: pick(['Seasonal allergy', 'Mild hypertension', 'Vitamin D deficiency']), details: 'Follow-up in 4 weeks.', authorName: 'Dr. Karim Nasser' },
        ],
      });
    }
    patients.push(p);
  }

  // Book a few non-overlapping slots per provider across today + next 3 days.
  const now = new Date();
  let count = 0;
  for (let d = 0; d < 4; d++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d));
    for (const prov of providers) {
      const nSlots = 3 + Math.floor(Math.random() * 3);
      for (let s = 0; s < nSlots; s++) {
        const startMin = prov.workStartMin + s * prov.slotMinutes;
        const endMin = startMin + prov.slotMinutes;
        if (endMin > prov.workEndMin) break;
        const status: AppointmentStatus = d === 0 && s === 0 ? 'COMPLETED' : 'BOOKED';
        await prisma.appointment.create({
          data: {
            providerId: prov.id,
            patientId: pick(patients).id,
            date: day,
            startMin,
            endMin,
            status,
            reason: 'Routine visit',
          },
        });
        count++;
      }
    }
  }

  // Invoices
  const services = [
    { description: 'Consultation', unitPriceCents: 15000 },
    { description: 'Lab test — CBC', unitPriceCents: 22000 },
    { description: 'X-ray', unitPriceCents: 30000 },
    { description: 'Follow-up visit', unitPriceCents: 10000 },
    { description: 'Vaccination', unitPriceCents: 8000 },
  ];
  const invStatus = ['PAID', 'PAID', 'PAID', 'UNPAID', 'UNPAID', 'VOID'] as const;
  let invCount = 0;
  for (let i = 0; i < 18; i++) {
    const lineN = 1 + Math.floor(Math.random() * 3);
    const items = Array.from({ length: lineN }, () => {
      const s = pick(services);
      return { description: s.description, quantity: 1 + Math.floor(Math.random() * 2), unitPriceCents: s.unitPriceCents };
    });
    const total = items.reduce((sum, it) => sum + it.quantity * it.unitPriceCents, 0);
    await prisma.invoice.create({
      data: {
        number: `INV-2026-${String(i + 1).padStart(6, '0')}`,
        patientId: pick(patients).id,
        status: pick(invStatus as unknown as string[]) as never,
        totalCents: total,
        items: { create: items },
      },
    });
    invCount++;
  }

  // Pharmacy inventory
  const medData = [
    { name: 'Paracetamol 500mg', sku: 'MED-0001', unit: 'tablet', stock: 240, priceCents: 500 },
    { name: 'Amoxicillin 250mg', sku: 'MED-0002', unit: 'capsule', stock: 120, priceCents: 1200 },
    { name: 'Ibuprofen 400mg', sku: 'MED-0003', unit: 'tablet', stock: 8, priceCents: 700 },
    { name: 'Cetirizine 10mg', sku: 'MED-0004', unit: 'tablet', stock: 60, priceCents: 900 },
    { name: 'Amoxicillin syrup', sku: 'MED-0005', unit: 'bottle', stock: 5, priceCents: 2200 },
    { name: 'Vitamin D3', sku: 'MED-0006', unit: 'tablet', stock: 300, priceCents: 1500 },
    { name: 'Salbutamol inhaler', sku: 'MED-0007', unit: 'unit', stock: 18, priceCents: 3500 },
    { name: 'Omeprazole 20mg', sku: 'MED-0008', unit: 'capsule', stock: 90, priceCents: 1100 },
  ];
  const medicines: { id: string }[] = [];
  for (const m of medData) medicines.push(await prisma.medicine.create({ data: m }));

  // Prescriptions (decrement stock)
  let rxCount = 0;
  for (let i = 0; i < 10; i++) {
    const n = 1 + Math.floor(Math.random() * 2);
    const chosen = Array.from({ length: n }, () => pick(medicines));
    await prisma.prescription.create({
      data: {
        number: `RX-2026-${String(i + 1).padStart(6, '0')}`,
        patientId: pick(patients).id,
        authorName: 'Dr. Amina Saleh',
        notes: 'Take after meals.',
        items: { create: chosen.map((m) => ({ medicineId: m.id, quantity: 1 + Math.floor(Math.random() * 3), dosage: '1x daily' })) },
      },
    });
    rxCount++;
  }

  console.log(`Seeded ${providers.length} providers, ${patients.length} patients, ${count} appointments, ${invCount} invoices, ${medicines.length} medicines, ${rxCount} prescriptions.`);
  console.log('Login: admin@clinicflow.dev / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
