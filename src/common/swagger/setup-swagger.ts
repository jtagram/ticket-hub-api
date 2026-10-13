import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication): void {
	const config = new DocumentBuilder()
		.setTitle('Ticket Hub API')
		.setDescription(
			'API to create, search, approve and reject infrastructure tickets (database, server and Kubernetes).',
		)
		.setVersion('1.0')
		.addBearerAuth()
		.build();

	SwaggerModule.setup(SWAGGER_PATH, app, SwaggerModule.createDocument(app, config));
}
