CLAUDE.md — Short-Form Content Creation & Distribution Platform

This file is the single source of truth for Claude Code working on this project.
Read it fully before writing any code, making architectural decisions, or suggesting changes.


1. WHAT THIS PRODUCT IS
This is a full-stack, AI-powered content creation and distribution platform built specifically for short-form video — TikTok, Instagram Reels, and YouTube Shorts.
The core promise: a content creator goes from a raw idea → fully produced, published video inside a single app, with as much of the workflow automated as possible.
Think of it as an assembly line. Each stage of content production is a job. Jobs run asynchronously, store their output, and pass it to the next stage. Nothing is a single synchronous request — everything is a pipeline.
The internal mental model the founder uses:

"An app where a video goes from 0 [ideation] to 100 [posted]."


2. THE PIPELINE — STAGE BY STAGE
The system has 7 core pipeline stages plus 1 parallel component and 1 premium upsell layer.
Stage 0 — Main App (Orchestration Hub)
The app is the control panel. It does not process media — it:

Stores and tracks every idea a creator has
Manages the state of each idea through the pipeline
Provides the UI for triggering each stage
Handles cross-platform publishing (Instagram + TikTok initially)

Each idea has a lifecycle tracked by a numeric score: 0 = ideation → 100 = posted.

Stage 1 — Idea Input
The user submits a raw content idea. The idea entity has:
FieldTypeNotestitlestringShort label for the ideadescriptionstringOptional longer contextscorenumberPriority / quality indicator (0–100)seriesstringOptional groupingepisodenumberOptional episode within a seriesstatusenumidea | in_progress | postedpost_datedatetimeOptional scheduled date

Parallel Component — Persona AI (Style Conditioning)
This runs in parallel to the main pipeline, not sequentially. It is not a blocking step.
What it does:

Scrapes the creator's existing social media profiles (Instagram, TikTok)
Extracts patterns: script structure, typical video length, caption style, title conventions, tone of voice
Builds a prompt conditioning layer — not a fine-tuned model, just structured context injected into future LLM prompts

What it produces:

A persona_profile object stored per creator
This profile is injected into the scripting prompt to make AI-generated scripts sound like the creator

Important constraint: This is prompt engineering, not model training. No fine-tuning, no LoRA, no embeddings model. Just structured prompt context derived from scraped content.

Stage 2 — Script Generation
Input: the raw idea + the creator's persona_profile
The LLM generates a structured short-form script:

Hook — attention-grabbing opening (first 1–3 seconds)
Body — main content
CTA — call to action

Output is stored as a structured script object, not just plain text.

Stage 3 — Audio Generation
Two paths — creator chooses:
Path A — AI Voice:

Uses ElevenLabs API
Creator's voice is cloned via ElevenLabs
The script is sent to ElevenLabs → returns an audio file

Path B — Manual Upload:

Creator records their own voiceover
Uploads the audio file directly
System accepts it and stores it as the audio output for this stage

Output: an audio file (MP3 or WAV) stored and linked to this pipeline run.

Stage 4 — Video Generation
Two paths — creator chooses:
Path A — Self-Record:

Creator shoots the video themselves using the generated script as a teleprompter
Uploads the recorded video
System stores it as the video output

Path B — AI Avatar (HeyGen):

Uses HeyGen API
Creator's face/avatar is cloned via HeyGen
The system sends the script + the creator's audio (from Stage 3) to HeyGen
HeyGen returns a talking-head video of the creator's avatar synced to the audio

Output: a video file stored and linked to this pipeline run.

Stage 5 — Caption Generation
Input: the script (from Stage 2) and/or the audio file (from Stage 3)
Three paths:

Auto-generate from script — captions derived directly from script text, timestamped
Speech-to-text from audio — run audio through STT to generate captions
Manual captioning — creator captions the video themselves inside the app

Integration: Kalakaar.io API for caption rendering/formatting.
Output: a caption file (SRT or VTT format) formatted for short-form consumption.

Stage 6 — Export or POST
The final assembled output: video + audio + captions = publishable asset.
Two paths:
Path A — Export/Download:

Render the final video with captions baked in (or as a sidecar file)
Make it available for the creator to download

Path B — Direct Publish:
Platform APIs in order of priority:

TikTok API — direct posting
Meta Graph API — Instagram Reels
Google API — YouTube Shorts

Fallback scheduler:

Buffer API — if direct API posting is restricted or unavailable, use Buffer for scheduling
⚠️ Buffer integration needs verification — treat as a fallback, not primary


Premium Layer — Editing Upsell
After a video is generated (post Stage 6), the system offers a human editing service:

Creator is shown an upsell prompt
If they opt in, they are matched with a real human video editor available inside the app
The editor reviews and refines the generated content
This is a premium paid service, not part of the free automated pipeline

This is a marketplace/service layer — the app facilitates the connection between creator and editor, it does not do the editing itself.

3. SYSTEM ARCHITECTURE PRINCIPLES
These are non-negotiable constraints. Every technical decision must respect these.
3.1 Asynchronous Pipeline Architecture

Never build this as a synchronous request → response flow
Every stage is an independent async job
Jobs can: succeed, fail, be retried, run in parallel where appropriate
Each job stores its output independently before triggering the next stage
The system must handle partial completion — e.g. a creator may complete Stage 3 today and Stage 4 next week

3.2 Modularity

Each stage's implementation must be swappable
Example: Stage 3 could use ElevenLabs today, a different TTS provider tomorrow
No stage should be tightly coupled to a specific external API at the business logic level
Use adapter/strategy pattern for all external API integrations

3.3 State Machine

Every pipeline run (one idea going through the pipeline) has a clear state
States: pending → in_progress → completed | failed | retrying
Each stage has its own state within the run
UI reflects state accurately at all times

3.4 Storage-First

Every stage output (script, audio file, video file, captions) is stored before being passed forward
Never pass large binary data (audio, video) through the job queue directly — use URLs/references
Use object storage (S3-compatible) for all media assets

3.5 Multi-Tenancy

The platform serves multiple creators, not one
Every data entity is scoped to a creator_id / user_id
No data leakage between creators


4. TECH STACK
4.1 Frontend
LayerTechnologyRationaleFrameworkNext.js 14+ (App Router)SSR, file-based routing, API routes for lightweight BFFLanguageTypeScriptStrict typing across the stackStylingTailwind CSSUtility-first, fast iterationUI Componentsshadcn/uiAccessible, composable, Tailwind-nativeState ManagementZustandLightweight global state for pipeline job trackingServer State / FetchingTanStack Query (React Query)Polling pipeline job status, caching, mutationsFormsReact Hook Form + ZodType-safe form validationReal-time updatesWebSockets or SSEPush pipeline job status updates to UI without pollingFile uploadsUploadthing or tus protocolResumable chunked uploads for audio/video files

4.2 Backend
LayerTechnologyRationaleRuntimeNode.jsJS/TS consistency across the stackFrameworkNestJSStructured, opinionated, built for complex backend systems. Modules align with pipeline stages.LanguageTypeScriptStrict types, shared interfaces with frontendAPI StyleREST + WebSocketREST for CRUD/pipeline triggers, WS for real-time job statusJob QueueBullMQ (Redis-backed)Async job processing, retries, priorities, concurrency control. Each pipeline stage = one BullMQ queue.Queue DashboardBull BoardVisual monitoring of job queuesORMPrismaType-safe database access, migrationsValidationZodShared schemas between frontend and backend

4.3 Database
PurposeTechnologyRationalePrimary DBPostgreSQLRelational data: users, ideas, pipeline runs, stage statesCache / Queue BrokerRedisBullMQ job queue + caching pipeline statesObject StorageAWS S3 (or Cloudflare R2)Store all media: audio files, video files, caption filesCDNCloudflareServe stored media fast
Key Postgres tables (conceptual):

users — creator accounts
ideas — raw idea entities with all metadata
pipeline_runs — one record per idea going through the pipeline; tracks overall state
pipeline_stages — one record per stage per run; tracks stage-level state + output URL
persona_profiles — scraped + extracted creator persona data
social_accounts — connected platform credentials per creator


4.4 External API Integrations
Each integration must be wrapped in its own service/adapter. No raw API calls scattered across business logic.
APIStagePurposeNotesElevenLabsStage 3AI voice cloning + TTSRequires voice_id per creator. Handle async generation with webhook or polling.HeyGenStage 4AI avatar / talking head videoRequires avatar_id per creator. Video generation is async — poll or webhook.Kalakaar.ioStage 5Caption generation / renderingVerify exact API capabilities and format outputsOpenAI / AnthropicStage 2Script generation LLMUse Anthropic Claude via API (claude-sonnet-4-20250514). Persona profile injected as system prompt context.TikTok APIStage 6Direct video publishingRequires OAuth per creator. Check content policy restrictions.Meta Graph APIStage 6Instagram Reels publishingRequires OAuth per creator. Instagram Reels posting requires specific video specs.Google API (YouTube Data v3)Stage 6YouTube Shorts publishingRequires OAuth per creator.Buffer APIStage 6Scheduling fallback⚠️ Needs verification. Use only if direct API posting is unavailable.Social Media ScraperPersonaExtract creator's existing contentUse a scraping service or official APIs where available. Be mindful of ToS.

4.5 Infrastructure & DevOps
LayerTechnologyContainerizationDocker + Docker Compose (dev), Kubernetes or ECS (prod)CI/CDGitHub ActionsHosting (API)Railway, Render, or AWS ECSHosting (Frontend)VercelSecrets ManagementEnvironment variables via .env + Doppler or AWS Secrets Manager in prodMonitoringSentry (errors) + Axiom or Datadog (logs)Background Jobs MonitorBull Board

4.6 Authentication
LayerTechnologyAuthClerk or NextAuth.js v5OAuth (Platform connections)Custom OAuth flow per platform (TikTok, Meta, Google) stored in social_accounts tableSessionJWT with refresh tokens

5. PROJECT STRUCTURE (MONOREPO)
/
├── apps/
│   ├── web/                  # Next.js frontend (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, signup
│   │   │   ├── (dashboard)/  # Main app: ideas, pipeline, settings
│   │   │   └── api/          # Next.js API routes (BFF layer)
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui base components
│   │   │   ├── pipeline/     # Stage-specific UI components
│   │   │   └── ideas/        # Idea management UI
│   │   └── lib/
│   │       ├── api.ts        # API client
│   │       └── stores/       # Zustand stores
│   │
│   └── api/                  # NestJS backend
│       ├── src/
│       │   ├── ideas/        # Idea CRUD module
│       │   ├── pipeline/     # Pipeline orchestration module
│       │   ├── stages/
│       │   │   ├── script/   # Stage 2: Script generation
│       │   │   ├── audio/    # Stage 3: Audio generation
│       │   │   ├── video/    # Stage 4: Video generation
│       │   │   ├── captions/ # Stage 5: Caption generation
│       │   │   └── export/   # Stage 6: Export / posting
│       │   ├── persona/      # Persona AI module
│       │   ├── integrations/ # All external API adapters
│       │   │   ├── elevenlabs/
│       │   │   ├── heygen/
│       │   │   ├── kalakaar/
│       │   │   ├── tiktok/
│       │   │   ├── meta/
│       │   │   ├── youtube/
│       │   │   └── buffer/
│       │   ├── jobs/         # BullMQ queue definitions and processors
│       │   ├── storage/      # S3 / R2 service
│       │   └── auth/         # Auth guards, JWT
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── shared-types/         # Shared TypeScript interfaces (idea, pipeline run, stage states)
│   └── zod-schemas/          # Shared Zod validation schemas
│
├── docker-compose.yml        # Postgres + Redis for local dev
├── turbo.json                # Turborepo config
└── package.json              # Root workspace config

6. DATA MODELS (Prisma / Conceptual)
typescript// Core idea entity
model Idea {
  id          String    @id @default(cuid())
  creatorId   String
  title       String
  description String?
  score       Int       @default(0)   // 0–100
  series      String?
  episode     Int?
  status      IdeaStatus @default(IDEA)
  postDate    DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  pipelineRuns PipelineRun[]
  creator      User @relation(fields: [creatorId], references: [id])
}

enum IdeaStatus {
  IDEA
  IN_PROGRESS
  POSTED
}

// One pipeline run = one idea going through the full pipeline
model PipelineRun {
  id        String       @id @default(cuid())
  ideaId    String
  creatorId String
  status    RunStatus    @default(PENDING)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  idea   Idea          @relation(fields: [ideaId], references: [id])
  stages PipelineStage[]
}

enum RunStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

// One record per stage per run
model PipelineStage {
  id          String      @id @default(cuid())
  runId       String
  stage       StageType
  status      StageStatus @default(PENDING)
  outputUrl   String?     // S3/R2 URL for media outputs
  outputData  Json?       // Structured output (e.g. script JSON)
  errorMsg    String?
  attempts    Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  run PipelineRun @relation(fields: [runId], references: [id])
}

enum StageType {
  SCRIPT
  AUDIO
  VIDEO
  CAPTIONS
  EXPORT
}

enum StageStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  RETRYING
}

// Creator persona profile (built from social scraping)
model PersonaProfile {
  id              String   @id @default(cuid())
  creatorId       String   @unique
  scriptStructure Json     // Extracted patterns
  avgVideoLength  Int?     // Seconds
  captionStyle    String?
  titleConventions String?
  toneDescriptor  String?
  rawExtracts     Json?    // Raw scraped samples used to build profile
  updatedAt       DateTime @updatedAt

  creator User @relation(fields: [creatorId], references: [id])
}

// Connected social accounts per creator
model SocialAccount {
  id           String   @id @default(cuid())
  creatorId    String
  platform     Platform
  accessToken  String   // Encrypted
  refreshToken String?  // Encrypted
  platformUserId String
  expiresAt    DateTime?
  createdAt    DateTime @default(now())

  creator User @relation(fields: [creatorId], references: [id])
}

enum Platform {
  TIKTOK
  INSTAGRAM
  YOUTUBE
}

7. JOB QUEUE DESIGN (BullMQ)
Each pipeline stage maps to a dedicated BullMQ queue:
script-generation-queue
audio-generation-queue
video-generation-queue
caption-generation-queue
export-queue
persona-analysis-queue
Job payload structure (example — script stage):
typescriptinterface ScriptJobPayload {
  pipelineRunId: string;
  stageId: string;
  ideaId: string;
  creatorId: string;
  personaProfileId?: string;
}
Job lifecycle:

Stage is triggered → job added to queue
Worker picks up job → stage status set to IN_PROGRESS
Worker calls external API → awaits result
On success → output stored to S3 → stage status set to COMPLETED → next stage job enqueued
On failure → stage status set to FAILED or RETRYING → BullMQ handles retries with backoff

Retry policy:

Max 3 attempts per job
Exponential backoff: 1s, 5s, 30s
On final failure: mark stage as FAILED, alert creator via UI


8. REAL-TIME UI UPDATES
The frontend must show live pipeline progress without manual refresh.
Approach:

Backend emits WebSocket events (or SSE) when stage status changes
Frontend subscribes to events scoped to the current pipelineRunId
TanStack Query invalidates cache on WS event to refetch fresh state
Each stage in the UI shows: Pending → Running → Done / Failed


9. API INTEGRATION CONTRACTS
ElevenLabs (Audio)
typescriptinterface ElevenLabsAdapter {
  generateSpeech(params: {
    text: string;
    voiceId: string;       // Creator's cloned voice ID
    modelId: string;
  }): Promise<{ audioUrl: string }>;
}
HeyGen (Video)
typescriptinterface HeyGenAdapter {
  generateVideo(params: {
    avatarId: string;      // Creator's cloned avatar ID
    audioUrl: string;      // S3 URL of the generated audio
    script: string;        // For lip sync reference
  }): Promise<{ jobId: string }>;  // Async — poll for result

  getVideoStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
  }>;
}
Script Generation (Claude API)
typescriptinterface ScriptGenerationAdapter {
  generateScript(params: {
    idea: string;
    personaContext?: string;  // Stringified persona profile injected as system prompt
    targetDuration: number;   // Seconds
  }): Promise<{
    hook: string;
    body: string;
    cta: string;
    fullScript: string;
  }>;
}

10. CODING STANDARDS & CONVENTIONS

TypeScript strict mode — no any, no implicit returns
Zod for all runtime validation — never trust unvalidated external data (API responses, user input, job payloads)
Adapter pattern for all external APIs — business logic never calls external APIs directly
Repository pattern for all database access — no raw Prisma calls in service files
Error handling — every async operation must have explicit error handling; propagate structured errors, not raw exceptions
Environment variables — all secrets via .env; never hardcode keys; validate env vars at startup using Zod
Logging — structured JSON logs (use pino); log job start, completion, failure with runId, stageId, creatorId
Testing — unit tests for all adapters (mock external APIs); integration tests for pipeline orchestration
No business logic in controllers — controllers handle HTTP only; all logic lives in services


11. WHAT NOT TO DO

❌ Do not make this synchronous — every generation step takes seconds to minutes
❌ Do not pass video/audio binary data through the job queue — always use S3 URLs
❌ Do not call external APIs (ElevenLabs, HeyGen) directly from controllers or route handlers
❌ Do not skip the state machine — every stage must update its status record before and after processing
❌ Do not mix creator data — every query must filter by creatorId
❌ Do not build all stages at once — build and test one stage fully before moving to the next
❌ Do not assume Buffer API works as expected — it's unverified; build it behind a feature flag
❌ Do not fine-tune or embed models for persona — this is prompt conditioning only


12. BUILD ORDER (Recommended Sequence)
Build the system in this order to validate the pipeline architecture early:

Auth + User model — get creators into the system
Idea CRUD — core data entity; the "0" state
Pipeline Run + Stage state machine — the backbone of everything
Job queue infrastructure — BullMQ + Redis + a hello-world job
Script generation stage — first real AI call; validate the async pattern end-to-end
Persona AI — add style conditioning to scripting
Audio stage — ElevenLabs integration
Video stage — HeyGen integration (most complex async job)
Captions stage — Kalakaar.io integration
Export stage — download first, then add platform publishing one by one
Real-time UI — WebSocket pipeline status updates
Editing upsell — marketplace/service layer last


This document defines the system. When in doubt, refer back to the pipeline stages, the architecture principles, and the tech stack decisions above before writing any code.