import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/guards/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetHello } from './swagger/app.swagger';

@Controller()
@ApiTags('App')
export class AppController {
	constructor(private readonly appService: AppService) {}

	@ApiGetHello()
	@Get()
	@Public()
	getHello(): string {
		return this.appService.getHello();
	}
}
