import { Controller, Get } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Controller('health')
export class HealthController {
  @Get()
  async health() {
    let dbStatus = 'connected';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
