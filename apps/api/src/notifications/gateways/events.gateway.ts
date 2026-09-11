import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEvent, DomainEventType } from '../domain-events.interface';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Strict authentication: Extract token from handshake auth or Authorization header ONLY.
      // Query string token is explicitly rejected for security.
      const authHeader = client.handshake.headers['authorization'];
      const authToken = client.handshake.auth?.token;

      let token: string | null = null;
      if (typeof authToken === 'string' && authToken.trim().length > 0) {
        token = authToken.trim();
      } else if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: Missing handshake authentication token`);
        client.disconnect(true);
        return;
      }

      const secret =
        this.configService.get<string>('app.jwt.secret') || 'caregrid-jwt-secret-key-2026';
      const decoded = this.jwtService.verify(token, { secret });

      if (!decoded || !decoded.sub) {
        this.logger.warn(`Client ${client.id} rejected: Invalid JWT token payload`);
        client.disconnect(true);
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, name: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        this.logger.warn(`Client ${client.id} rejected: User not found or inactive`);
        client.disconnect(true);
        return;
      }

      client.data.user = user;

      // Join targeted personal and role rooms
      client.join(`user:${user.id}`);
      client.join(`role:${user.role}`);

      this.logger.log(`Client ${client.id} authenticated for user ${user.id} (${user.role})`);
    } catch (err: any) {
      this.logger.warn(`Client ${client.id} connection failed authentication: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client ${client.id} disconnected`);
  }

  /**
   * Broadcasts domain events to appropriate rooms based on event type.
   */
  broadcastDomainEvent(event: DomainEvent) {
    if (!this.server) return;

    const eventName = event.type.replace('.', ':');
    const safePayload = {
      type: event.type,
      payload: event.payload,
      occurredAt: event.occurredAt,
    };

    switch (event.type) {
      case DomainEventType.REFERRAL_CREATED:
        this.server.to('role:DOCTOR').to('role:HOSPITAL_ADMIN').emit(eventName, safePayload);
        break;

      case DomainEventType.REFERRAL_APPROVED:
      case DomainEventType.REFERRAL_REJECTED:
      case DomainEventType.REFERRAL_TIMED_OUT:
      case DomainEventType.REFERRAL_CANCELLED:
        if (event.payload?.patientId) {
          // Send to doctors and administrators
          this.server.to('role:DOCTOR').to('role:HOSPITAL_ADMIN').emit(eventName, safePayload);
        }
        break;

      case DomainEventType.APPOINTMENT_BOOKED:
      case DomainEventType.APPOINTMENT_CONFIRMED:
      case DomainEventType.APPOINTMENT_CANCELLED:
        this.server.to('role:DOCTOR').emit(eventName, safePayload);
        break;

      case DomainEventType.AVAILABILITY_STALE:
      case DomainEventType.BEDS_STALE:
      case DomainEventType.EQUIPMENT_STALE:
      case DomainEventType.INVENTORY_STALE:
      case DomainEventType.ESCALATION_TRIGGERED:
        this.server.to('role:HOSPITAL_ADMIN').to('role:SUPER_ADMIN').emit(eventName, safePayload);
        break;

      default:
        this.server.to('role:SUPER_ADMIN').emit(eventName, safePayload);
        break;
    }
  }

  /**
   * Directly sends a real-time event to a specific user room.
   */
  sendToUser(userId: string, eventName: string, data: any) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(eventName, data);
  }
}
