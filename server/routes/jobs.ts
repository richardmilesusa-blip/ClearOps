import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { Stage } from '@prisma/client';

const router = Router();

// Zod schemas for validation
const createJobSchema = z.object({
  client: z.string().min(1, 'Client is required'),
  goodsDescription: z.string().min(1, 'Goods description is required'),
  containerNumber: z.string().min(1, 'Container number is required'),
  vesselName: z.string().optional(),
  consignee: z.string().min(1, 'Consignee is required'),
  notifyParty: z.string().min(1, 'Notify party is required'),
  tin: z.string().min(1, 'TIN is required'),
  formMNumber: z.string().min(1, 'Form M Number is required'),
  baNumber: z.string().min(1, 'BA Number is required'),
  rcNumber: z.string().min(1, 'RC Number is required'),
  transitLocation: z.string().min(1, 'Transit Location is required'),
  transireRequired: z.boolean().default(false),
});

const updateStageSchema = z.object({
  stage: z.nativeEnum(Stage),
});

const updateFinancialsSchema = z.object({
  containerDeposit: z.number().optional(),
  dndCharges: z.number().optional(),
  dndDays: z.number().int().optional(),
  customsDuty: z.number().optional(),
  transporterFee: z.number().optional(),
  escortFee: z.number().optional(),
  driverInconvenienceFee: z.number().optional(),
  miscFees: z.number().optional(),
  invoicedAmount: z.number().optional(),
});

const uploadDocumentSchema = z.object({
  type: z.enum(['BL', 'FORM_M', 'TRANSIRE', 'TDO', 'CUSTOMS_EXAM', 'POD', 'OTHER']),
  fileUrl: z.string().url(),
});

// Helper to validate request body
const validate = (schema: z.ZodType<any, any>) => (req: any, res: any, next: any) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    next(error);
  }
};

// 7. GET /api/jobs/dnd-watch - return jobs where dnd_days > 0
router.get('/dnd-watch', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        financials: {
          dndDays: { gt: 0 }
        }
      },
      include: {
        financials: true
      },
      orderBy: {
        financials: {
          dndDays: 'desc'
        }
      }
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching DND watch jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 1. GET /api/jobs - list all jobs with filters
router.get('/', async (req, res) => {
  try {
    const { stage, search } = req.query;
    
    let whereClause: any = {};
    
    if (stage) {
      whereClause.stage = stage as Stage;
    }
    
    if (search) {
      whereClause.OR = [
        { client: { contains: search as string, mode: 'insensitive' } },
        { reference: { contains: search as string, mode: 'insensitive' } },
        { containerNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        financials: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. POST /api/jobs - create a new job
router.post('/', validate(createJobSchema), async (req, res) => {
  try {
    const jobData = req.body;
    
    // Auto-generate reference (e.g. COP-0041)
    // Find the latest job to generate next reference
    const latestJob = await prisma.job.findFirst({
      orderBy: { reference: 'desc' }
    });
    
    let nextNum = 1;
    if (latestJob && latestJob.reference.startsWith('COP-')) {
      const parts = latestJob.reference.split('-');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        nextNum = Number(parts[1]) + 1;
      }
    }
    const reference = `COP-${String(nextNum).padStart(4, '0')}`;

    const newJob = await prisma.job.create({
      data: {
        reference,
        ...jobData,
        financials: {
          create: {} // Create an empty financials record
        }
      },
      include: {
        financials: true
      }
    });
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. GET /api/jobs/:id - get a single job
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        financials: true,
        documents: {
          orderBy: { uploadedAt: 'desc' }
        },
        notifications: {
          orderBy: { sentAt: 'desc' }
        }
      }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. PATCH /api/jobs/:id/stage - advance stage
const stageOrder = [
  Stage.PRE_ARRIVAL,
  Stage.BL_RECEIVED,
  Stage.TELEX_RELEASED,
  Stage.DO_PROCESSING,
  Stage.IN_TRANSIT,
  Stage.FTZ_EXAMINATION,
  Stage.DUTY_PAYMENT,
  Stage.ESCORT_DELIVERY,
  Stage.COMPLETED
];

router.patch('/:id/stage', validate(updateStageSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body as { stage: Stage };
    
    const job = await prisma.job.findUnique({ where: { id } });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const currentIndex = stageOrder.indexOf(job.stage);
    const newIndex = stageOrder.indexOf(stage);

    if (newIndex <= currentIndex) {
      return res.status(400).json({ error: 'Stages must advance forward' });
    }
    if (newIndex !== currentIndex + 1) {
      return res.status(400).json({ error: `Cannot jump from ${job.stage} to ${stage}. Must proceed sequentially.` });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { stage },
      include: { financials: true }
    });

    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. PUT /api/jobs/:id/financials - update financials
router.put('/:id/financials', validate(updateFinancialsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const job = await prisma.job.findUnique({ where: { id }, include: { financials: true } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let updatedFinancials;
    if (job.financials) {
      updatedFinancials = await prisma.financials.update({
        where: { jobId: id },
        data
      });
    } else {
      updatedFinancials = await prisma.financials.create({
        data: {
          jobId: id,
          ...data,
        }
      });
    }

    res.json(updatedFinancials);
  } catch (error) {
    console.error('Error updating job financials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. POST /api/jobs/:id/documents - upload a document
router.post('/:id/documents', validate(uploadDocumentSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, fileUrl } = req.body;
    
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const newDoc = await prisma.document.create({
      data: {
        jobId: id,
        type,
        fileUrl,
      }
    });

    res.status(201).json(newDoc);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
