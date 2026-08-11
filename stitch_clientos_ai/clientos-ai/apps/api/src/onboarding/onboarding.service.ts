import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@clientos/database';
import { onboardingSchema } from '@clientos/validation';

@Injectable()
export class OnboardingService {
  async completeOnboarding(userId: string, data: any) {
    const parsed = onboardingSchema.parse(data);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
      },
    });

    const member = await prisma.organizationMember.findFirst({
      where: { userId, role: 'OWNER' },
    });

    if (member) {
      await prisma.organization.update({
        where: { id: member.organizationId },
        data: {
          name: parsed.companyName,
          country: parsed.country,
          currency: parsed.currency,
          timezone: parsed.timezone,
        },
      });
    }

    const orgId = member?.organizationId;
    if (!orgId) throw new BadRequestException('No organization found');

    const services = await Promise.all(
      parsed.services.map((s) =>
        prisma.service.create({
          data: {
            organizationId: orgId,
            name: s.name,
            description: s.description,
            startingPrice: s.startingPrice,
            currency: s.currency,
            deliveryDays: s.deliveryDays,
            idealCustomer: s.idealCustomer,
            keywords: s.keywords,
            active: true,
          },
        }),
      ),
    );

    return {
      message: 'Onboarding completed',
      servicesCreated: services.length,
    };
  }
}
