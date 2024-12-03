import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ProcessDataDto } from './dto/process-data-dto';
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    @Render('dashboard')
    renderDashboardPage() {
        return {
            title: 'dashboard',
        };
    }
    @Post()
    async processTask(@Body() processDataDto: ProcessDataDto) {
        const data = await this.dashboardService.process(processDataDto);
        console.log(data);
    }
}
