export interface BaseJobPayload {
  pipelineRunId: string;
  stageId: string;
  ideaId: string;
  creatorId: string;
}

export interface ScriptJobPayload extends BaseJobPayload {
  personaProfileId?: string;
}

export interface AudioJobPayload extends BaseJobPayload {
  scriptText: string;
  voiceId: string;
  path: 'AI_VOICE' | 'MANUAL_UPLOAD';
  manualAudioUrl?: string;
}

export interface VideoJobPayload extends BaseJobPayload {
  audioUrl: string;
  scriptText: string;
  avatarId?: string;
  path: 'SELF_RECORD' | 'AI_AVATAR';
  manualVideoUrl?: string;
}

export interface CaptionsJobPayload extends BaseJobPayload {
  scriptText: string;
  audioUrl?: string;
  path: 'FROM_SCRIPT' | 'FROM_AUDIO' | 'MANUAL';
}

export interface ExportJobPayload extends BaseJobPayload {
  videoUrl: string;
  audioUrl: string;
  captionsUrl?: string;
  path: 'DOWNLOAD' | 'PUBLISH';
  platforms?: Array<'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE'>;
}

export interface PersonaJobPayload {
  creatorId: string;
  socialUrls: {
    instagram?: string;
    tiktok?: string;
  };
}

export type QueueName =
  | 'script-generation-queue'
  | 'audio-generation-queue'
  | 'video-generation-queue'
  | 'caption-generation-queue'
  | 'export-queue'
  | 'persona-analysis-queue';
