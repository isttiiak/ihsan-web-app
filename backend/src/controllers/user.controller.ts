import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';

export const getUserHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getUserById(req.user.uid);
    if (!user) {
      res.status(404).json({ ok: false, error: 'User not found' });
      return;
    }
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

export const updateUserHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      displayName, photoUrl, gender, birthDate,
      firstName, lastName, occupation, bio, city, country,
    } = req.body as {
      displayName?: string;
      photoUrl?: string;
      gender?: 'male' | 'female' | 'other' | 'prefer_not_say';
      birthDate?: string;
      firstName?: string;
      lastName?: string;
      occupation?: string;
      bio?: string;
      city?: string;
      country?: string;
    };

    const user = await userService.updateUser(req.user.uid, {
      displayName, photoUrl, gender, birthDate,
      firstName, lastName, occupation, bio, city, country,
    });

    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

export const linkGoogleHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { googleEmail, googleUid } = req.body as { googleEmail: string; googleUid: string };
    const user = await userService.linkGoogleProvider(req.user.uid, googleEmail, googleUid);
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

export const unlinkGoogleHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerUid } = req.body as { providerUid: string };
    const user = await userService.unlinkGoogleProvider(req.user.uid, providerUid);
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

export const setPrimaryEmailHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    const user = await userService.setPrimaryEmail(req.user.uid, email);
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};
