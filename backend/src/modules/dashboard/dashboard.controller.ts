import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('仪表盘')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取统计数据' })
  async getStatistics() {
    return this.dashboardService.getStatistics();
  }

  @Get('stage-distribution')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取患者阶段分布' })
  async getStageDistribution() {
    return this.dashboardService.getStageDistribution();
  }

  @Get('weekly-monthly-comparison')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取周月数据对比' })
  async getWeeklyMonthlyComparison() {
    return this.dashboardService.getWeeklyMonthlyComparison();
  }

  @Get('adverse-event-stats')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取不良事件统计' })
  async getAdverseEventStats() {
    return this.dashboardService.getAdverseEventStats();
  }

  @Get('recent-activities')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取最近动态' })
  @ApiQuery({ name: 'limit', required: false, description: '返回条数，默认10' })
  async getRecentActivities(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivities(limit || 10);
  }

  @Get('daily-activity-trend')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: '获取最近7天活跃趋势' })
  async getDailyActivityTrend() {
    return this.dashboardService.getDailyActivityTrend();
  }
}
