import { Router, Request, Response } from 'express';
import {
  BANGLADESH_LOCATION_COUNTS,
  BANGLADESH_LOCATION_DATA,
} from '../services/bangladeshLocationData';

const router = Router();

router.get('/bangladesh', (_req: Request, res: Response) =>
  res.json({
    locations: BANGLADESH_LOCATION_DATA,
    counts: BANGLADESH_LOCATION_COUNTS,
  })
);

export default router;
