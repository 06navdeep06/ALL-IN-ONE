export interface PersonaProfile {
  id: string;
  creatorId: string;
  scriptStructure: Record<string, unknown>;
  avgVideoLength?: number | null;
  captionStyle?: string | null;
  titleConventions?: string | null;
  toneDescriptor?: string | null;
  rawExtracts?: Record<string, unknown> | null;
  updatedAt: Date;
}

export interface PersonaContext {
  scriptStructure: string;
  avgVideoLengthSeconds?: number;
  captionStyle?: string;
  titleConventions?: string;
  toneDescriptor?: string;
}
