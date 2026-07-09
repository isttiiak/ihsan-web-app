import { Request, Response, NextFunction } from 'express';
import * as socialService from '../services/social.service.js';
import { DEFAULT_TIMEZONE_OFFSET } from '../utils/timezone-flexible.js';

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = req.query['today'] as string | undefined;
    const rawOffset = req.query['timezoneOffset'];
    const offset = rawOffset !== undefined ? Number(rawOffset) : DEFAULT_TIMEZONE_OFFSET;
    const summary = await socialService.getSummary(req.user.uid, today, offset);
    res.json({ ok: true, ...summary });
  } catch (err) { next(err); }
};

export const getNoor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = req.query['today'] as string | undefined;
    const rawOffset = req.query['timezoneOffset'];
    const offset = rawOffset !== undefined ? Number(rawOffset) : DEFAULT_TIMEZONE_OFFSET;
    const noor = await socialService.getNoor(req.user.uid, today, offset);
    res.json({ ok: true, ...noor });
  } catch (err) { next(err); }
};

export const connect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body as { code: string };
    const result = await socialService.connectByCode(req.user.uid, code);
    res.status(result.ok ? 200 : 400).json(result);
  } catch (err) { next(err); }
};

export const unfriend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const friendUid = req.params['friendUid'] as string;
    const result = await socialService.unfriend(req.user.uid, friendUid);
    res.json(result);
  } catch (err) { next(err); }
};
