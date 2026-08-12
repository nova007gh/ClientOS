import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ServicesModule } from './services/services.module';
import { ProspectsModule } from './prospects/prospects.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { AuditsModule } from './audits/audits.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ContractsModule } from './contracts/contracts.module';
import { ProjectsModule } from './projects/projects.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InboxModule } from './inbox/inbox.module';
import { TemplatesModule } from './templates/templates.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    OrganizationsModule,
    OnboardingModule,
    ServicesModule,
    ProspectsModule,
    OpportunitiesModule,
    AuditsModule,
    CampaignsModule,
    ProposalsModule,
    ContractsModule,
    ProjectsModule,
    PortfolioModule,
    DashboardModule,
    InboxModule,
    TemplatesModule,
    HealthModule,
  ],
})
export class AppModule {}
