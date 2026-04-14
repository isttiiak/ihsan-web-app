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
    const { displayName, photoUrl, gender, birthDate, firstName, lastName, occupation } = req.body as {
      displayName?: string;
      photoUrl?: string;
      gender?: 'male' | 'female' | 'other' | 'prefer_not_say';
      birthDate?: string;
      firstName?: string;
      lastName?: string;
      occupation?: string;
    };

    const user = await userService.updateUser(req.user.uid, {
      displayName,
      photoUrl,
      gender,
      birthDate,
      firstName,
      lastName,
      occupation,
    });

    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};
