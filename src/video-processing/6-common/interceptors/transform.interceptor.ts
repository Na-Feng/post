import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 统一响应体格式
 *
 * @export
 * @interface Response
 * @template T
 */
export interface Response<T> {
  data: T;
  code: number;
  message: string;
}

/**
 * 全局响应拦截器
 *
 * @description 将所有成功的请求响应体包装在 { data, code, message } 对象中
 * @export
 * @class TransformInterceptor
 * @template T
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        code: 200,
        message: '请求成功',
        data,
      })),
    );
  }
}
