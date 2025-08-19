import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { HttpExceptionFilter } from './video-processing/6-common/filters/http-exception.filter';
import { TransformInterceptor } from './video-processing/6-common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS，允许所有来源的跨域请求
  // 在生产环境中，为了安全，您可能希望配置为只允许您的前端域名
  app.enableCors();

  // 全局管道：用于数据验证和转换
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true, // 自动转换DTO类型
  //     whitelist: true, // 过滤掉DTO中未定义的属性
  //     forbidNonWhitelisted: true, // 禁止非白名单属性，并抛出错误
  //   }),
  // );

  // 全局异常过滤器：统一处理所有HTTP异常
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器：统一处理所有成功响应
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
