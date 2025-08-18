import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS，允许所有来源的跨域请求
  // 在生产环境中，为了安全，您可能希望配置为只允许您的前端域名
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
