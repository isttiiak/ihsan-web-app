import User, { IUser, ILinkedProvider } from '../models/User.js';

// Belt-and-braces: the Zod schema catches invalid photoUrls at the HTTP boundary;
// this helper protects direct service calls (backup restore, future callers).
// Rules mirror the Zod schema in validation/user.schemas.ts — keep in sync.
const PHOTO_SAFE_DATA_RE = /^data:image\/(jpeg|png|webp);base64,/;
function isValidPhotoUrl(url: string): boolean {
  if (url.startsWith('https://')) return url.length <= 2048;
  return PHOTO_SAFE_DATA_RE.test(url) && url.length <= 2048;
}

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
  hijriOffset?: number;
}

export async function linkGoogleProvider(
  uid: string,
  googleEmail: string,
  googleUid: string
): Promise<IUser | null> {
  // Prevent the same Google account being linked to two Ihsan accounts
  const duplicate = await User.findOne({
    'linkedProviders.providerUid': googleUid,
    uid: { $ne: uid },
  });
  if (duplicate) {
    const err = Object.assign(
      new Error('This Google account is already linked to another Ihsan account.'),
      { statusCode: 409 }
    );
    throw err;
  }

  const entry: ILinkedProvider = {
    provider: 'google.com',
    email: googleEmail,
    providerUid: googleUid,
  };
  return User.findOneAndUpdate({ uid }, { $addToSet: { linkedProviders: entry } }, { new: true });
}

export async function unlinkGoogleProvider(
  uid: string,
  providerUid: string
): Promise<IUser | null> {
  return User.findOneAndUpdate(
    { uid },
    { $pull: { linkedProviders: { providerUid } } },
    { new: true }
  );
}

export async function setPrimaryEmail(uid: string, email: string): Promise<IUser | null> {
  return User.findOneAndUpdate({ uid }, { $set: { primaryEmail: email } }, { new: true });
}

export async function updateUser(uid: string, fields: UserUpdateFields): Promise<IUser | null> {
  const updates: Partial<IUser> = {};
  if (fields.displayName !== undefined) updates.displayName = fields.displayName;
  if (fields.photoUrl !== undefined) {
    if (!isValidPhotoUrl(fields.photoUrl)) {
      const err = Object.assign(
        new Error('photoUrl must be an https URL (≤2 KB) or base64 image/jpeg|png|webp (≤2 KB).'),
        { statusCode: 400 }
      );
      throw err;
    }
    updates.photoUrl = fields.photoUrl;
  }
  if (fields.gender !== undefined) updates.gender = fields.gender;
  if (fields.birthDate !== undefined) updates.birthDate = new Date(fields.birthDate);
  if (fields.firstName !== undefined) updates.firstName = fields.firstName;
  if (fields.lastName !== undefined) updates.lastName = fields.lastName;
  if (fields.occupation !== undefined) updates.occupation = fields.occupation;
  if (fields.bio !== undefined) updates.bio = fields.bio;
  if (fields.city !== undefined) updates.city = fields.city;
  if (fields.country !== undefined) updates.country = fields.country;
  if (fields.hijriOffset !== undefined)
    (updates as Record<string, unknown>).hijriOffset = fields.hijriOffset;

  return User.findOneAndUpdate({ uid }, updates, { new: true, runValidators: true });
}
