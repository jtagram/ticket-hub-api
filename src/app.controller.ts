import { Controller, Get } from '@nestjs/common';
import { ResponseBody } from './common/dto/response-body.dto';
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
	getHello(): ResponseBody<string> {
		return this.appService.getHello();
	}
}
