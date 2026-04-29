import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'pipeline',
})
export class PipelineGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PipelineGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:run')
  handleSubscribe(
    @MessageBody() data: { runId: string },
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`run:${data.runId}`);
    this.logger.debug(`Client ${client.id} subscribed to run:${data.runId}`);
  }

  emitStageUpdate(runId: string, payload: {
    stageId: string;
    stage: string;
    status: string;
    outputUrl?: string | null;
    errorMsg?: string | null;
  }) {
    this.server.to(`run:${runId}`).emit('stage:update', payload);
  }

  emitRunComplete(runId: string, status: string) {
    this.server.to(`run:${runId}`).emit('run:complete', { runId, status });
  }
}
