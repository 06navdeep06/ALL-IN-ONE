export type IdeaStatus = 'IDEA' | 'IN_PROGRESS' | 'POSTED';

export interface Idea {
  id: string;
  creatorId: string;
  title: string;
  description?: string | null;
  score: number;
  series?: string | null;
  episode?: number | null;
  status: IdeaStatus;
  postDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdeaDto {
  title: string;
  description?: string;
  score?: number;
  series?: string;
  episode?: number;
  postDate?: Date;
}

export interface UpdateIdeaDto {
  title?: string;
  description?: string;
  score?: number;
  series?: string;
  episode?: number;
  status?: IdeaStatus;
  postDate?: Date;
}
