import { Controller, Get, Render } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

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

    @Get('me')
    @Render('profileSettings')
    renderProfilePage() {
        return {
            title: 'Profile Settings',
        };
    }

    @Get('settings')
    @Render('settings')
    renderSettingsPage() {
        return {
            title: 'settings',
        };
    }
}
