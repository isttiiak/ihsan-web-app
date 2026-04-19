import User, { IUser, ILinkedProvider } from '../models/User.js';

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
  bio?: string;
  city?: string;
  country?: string;
}

export async function linkGoogleProvider(
  uid: string,
  googleEmail: string,
  googleUid: string,
): Promise<IUser | null> {
  // Prevent the same Google account being linked to two Ihsan accounts
  const duplicate = await User.findOne({
    'linkedProviders.providerUid': googleUid,
    uid: { $ne: uid },
  });
  if (duplicate) {
    const err = Object.assign(
      new Error('This Google account is already linked to another Ihsan account.'),
      { statusCode: 409 },
    );
    throw err;
  }

  const entry: ILinkedProvider = { provider: 'google.com', email: googleEmail, providerUid: googleUid };
  return User.findOneAndUpdate(
    { uid },
    { $addToSet: { linkedProviders: entry } },
    { new: true },
  );
}

export async function unlinkGoogleProvider(uid: string, providerUid: string): Promise<IUser | null> {
  return User.findOneAndUpdate(
    { uid },
    { $pull: { linkedProviders: { providerUid } } },
    { new: true },
  );
}

export async function setPrimaryEmail(uid: string, email: string): Promise<IUser | null> {
  return User.findOneAndUpdate({ uid }, { $set: { primaryEmail: email } }, { new: true });
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
  if (fields.bio !== undefined) updates.bio = fields.bio;
  if (fields.city !== undefined) updates.city = fields.city;
  if (fields.country !== undefined) updates.country = fields.country;

  return User.findOneAndUpdate({ uid }, updates, { new: true, runValidators: true });
}
