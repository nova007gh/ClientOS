import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post()
  async complete(@CurrentUser() user: any, @Body() body: any) {
    return this.onboardingService.completeOnboarding(user.id, body);
  }
}
