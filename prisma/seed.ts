import { PrismaClient, Stage, Role, DocumentType, NotificationChannel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.financials.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding ClearOps NG database...');

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@clearops.ng',
      role: Role.ADMIN,
    },
  });

  const agent = await prisma.user.create({
    data: {
      name: 'Operations Agent',
      email: 'operations@clearops.ng',
      role: Role.AGENT,
    },
  });

  // Create Jobs
  const job1 = await prisma.job.create({
    data: {
      reference: 'COP-0041',
      client: 'Alhaji Musa Textiles',
      goodsDescription: 'Fabric Materials',
      containerNumber: 'MSKU7341820',
      vesselName: 'MSC ZENA',
      stage: Stage.IN_TRANSIT,
      transireRequired: true,
      transitLocation: 'Kano FTZ',
      consignee: 'Alhaji Musa',
      tin: '12345678-0001',
      financials: {
        create: {
          containerDeposit: 850000,
          dndDays: 0,
        },
      },
      documents: {
        create: [
          {
            type: DocumentType.BL,
            fileUrl: 'https://example.com/docs/bl-0041.pdf',
            uploadedById: agent.id,
          },
        ],
      },
    },
  });

  const job2 = await prisma.job.create({
    data: {
      reference: 'COP-0039',
      client: "Kano Fabrics Int'l",
      goodsDescription: 'Polyester Fabric',
      containerNumber: 'TCKU8812774',
      vesselName: 'MSC BEIJING',
      stage: Stage.DUTY_PAYMENT,
      transireRequired: true,
      transitLocation: 'Kano FTZ',
      consignee: 'KFI Imports',
      tin: '98765432-0001',
      financials: {
        create: {
          containerDeposit: 900000,
          dndDays: 2,
          dndCharges: 45000,
          customsDuty: 1250000,
        },
      },
      notifications: {
        create: [
          {
            channel: NotificationChannel.WHATSAPP,
            message: 'Duty payment of ₦1,250,000 is required for COP-0039 to proceed.',
            status: 'DELIVERED',
          },
        ],
      },
    },
  });

  const job3 = await prisma.job.create({
    data: {
      reference: 'COP-0036',
      client: 'Pinnacle Goods Ltd',
      goodsDescription: 'Fabric Materials',
      containerNumber: 'MSCU2218833',
      vesselName: 'MSC ANNA',
      stage: Stage.DO_PROCESSING,
      transireRequired: false,
      transitLocation: 'Lagos Warehouse',
      consignee: 'Pinnacle Logistics',
      tin: '45678912-0001',
      financials: {
        create: {
          containerDeposit: 800000,
          dndDays: 1,
          dndCharges: 15000,
        },
      },
    },
  });

  console.log('Seeding completed successfully:');
  console.log(`Created jobs: ${job1.reference}, ${job2.reference}, ${job3.reference}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
