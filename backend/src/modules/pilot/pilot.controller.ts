import type { Request, Response, NextFunction } from 'express';
import * as svc from './pilot.service.js';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    // honeypot completat = bot → răspundem succes fără a stoca
    if (typeof req.body.website === 'string' && req.body.website.length > 0) {
      res.status(201).json({ ok: true });
      return;
    }
    await svc.createPilotRequest(req.body);
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
}
