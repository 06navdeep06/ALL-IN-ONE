'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { usePipelineStore } from '@/lib/stores/pipeline.store';
import type { PipelineStage } from '@repo/shared-types';

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_API_URL}/pipeline`, {
      transports: ['websocket'],
    });
  }
  return socket;
}

export function usePipelineSocket(runId: string | null) {
  const queryClient = useQueryClient();
  const { updateStage } = usePipelineStore();

  useEffect(() => {
    if (!runId) return;

    const s = getSocket();

    s.emit('subscribe:run', { runId });

    const handleStageUpdate = (payload: {
      stageId: string;
      stage: string;
      status: PipelineStage['status'];
      outputUrl?: string | null;
      errorMsg?: string | null;
    }) => {
      updateStage(runId, payload.stageId, {
        status: payload.status,
        outputUrl: payload.outputUrl,
        errorMsg: payload.errorMsg,
      });
      void queryClient.invalidateQueries({ queryKey: ['pipeline-run', runId] });
    };

    const handleRunComplete = () => {
      void queryClient.invalidateQueries({ queryKey: ['pipeline-run', runId] });
      void queryClient.invalidateQueries({ queryKey: ['ideas'] });
    };

    s.on('stage:update', handleStageUpdate);
    s.on('run:complete', handleRunComplete);

    return () => {
      s.off('stage:update', handleStageUpdate);
      s.off('run:complete', handleRunComplete);
    };
  }, [runId, queryClient, updateStage]);
}
