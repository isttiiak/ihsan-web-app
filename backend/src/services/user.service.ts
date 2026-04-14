import User, { IUser } from '../models/User.js';

export async function getUserById(uid: string): Promise<IUser | null> {
  return User.findOne({ uid });
}

export interface UserUpdateFields {
  displayName?: string;
  photoUrl?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_say';
  birthDate?: Date | string;
  firstName?: string;
  lastName?: string;
  occupation?: string;
}

export async function updateUser(uid: string, fields: UserUpdateFields): Promise<IUser | null> {
  const updates: Partial<IUser> = {};
  if (fields.displayName !== undefined) updates.displayName = fields.displayName;
  if (fields.photoUrl !== undefined) updates.photoUrl = fields.photoUrl;
  if (fields.gender !== undefined) updates.gender = fields.gender;
  if (fields.birthDate !== undefined) updates.birthDate = new Date(fields.birthDate);
  if (fields.firstName !== undefined) updates.firstName = fields.firstName;
  if (fields.lastName !== undefined) updates.lastName = fields.lastName;
  if (fields.occupation !== undefined) updates.occupation = fields.occupation;

  return User.findOneAndUpdate({ uid }, updates, { new: true, runValidators: true });
}
