export type Platform = 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE';

export interface SocialAccount {
  id: string;
  creatorId: string;
  platform: Platform;
  platformUserId: string;
  expiresAt?: Date | null;
  createdAt: Date;
}
