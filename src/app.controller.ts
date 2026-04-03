import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { join } from 'path';
import * as express from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('admin')
  getAdmin(@Res() res: express.Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'admin.html'));
  }
}
