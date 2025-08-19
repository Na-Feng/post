import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 全局异常过滤器
 *
 * @description 捕获所有 HttpException 类型的异常，并格式化为统一的 JSON 响应
 * @export
 * @class HttpExceptionFilter
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 获取状态码和错误信息
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : exception;

    // 构造更详细的错误消息
    let message: string | string[];
    if (typeof errorResponse === 'string') {
      message = errorResponse;
    } else if (typeof errorResponse === 'object' && errorResponse !== null) {
      message =
        ((errorResponse as Record<string, unknown>).message as string) ||
        'Internal server error';
    } else {
      message = 'Internal server error';
    }

    // 发送格式化的 JSON 响应
    response.status(status).json({
      code: status,
      message: message,
      error: (errorResponse as Record<string, unknown>).error || 'Error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
