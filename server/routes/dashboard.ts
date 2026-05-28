import { Router } from 'express';
import { prisma } from '../db';
import { Stage } from '@prisma/client';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    // Determine active jobs (typically not COMPLETED)
    const activeJobsCount = await prisma.job.count({
      where: {
        stage: {
          not: Stage.COMPLETED
        }
      }
    });

    const inTransitCount = await prisma.job.count({
      where: {
        stage: Stage.IN_TRANSIT
      }
    });

    const dndAccruingCount = await prisma.job.count({
      where: {
        financials: {
          dndDays: {
            gt: 0
          }
        }
      }
    });

    const awaitingDutyCount = await prisma.job.count({
      where: {
        stage: Stage.DUTY_PAYMENT
      }
    });

    res.json({
      activeJobs: activeJobsCount,
      inTransit: inTransitCount,
      dndAccruing: dndAccruingCount,
      awaitingDuty: awaitingDutyCount
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
