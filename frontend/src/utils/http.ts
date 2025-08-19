import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosRequestHeaders,
} from 'axios';

// 定义后端标准响应数据结构
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 定义一个自定义的 HttpClient 类
class HttpClient {
  private instance = axios.create({
    baseURL: 'http://localhost:3000', // Your API base URL
    headers: {
      'Content-Type': 'application/json',
    } as AxiosRequestHeaders, // Type assertion for headers
    timeout: 10000, // 请求超时时间
  });

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      <T>(response: AxiosResponse<ApiResponse<T>>) => {
        if (
          response.config.responseType === 'blob' ||
          response.config.responseType === 'arraybuffer'
        ) {
          return response; // 返回整个响应对象
        }

        const apiResponse = response.data;
        if (apiResponse.code === 200) {
          return apiResponse.data; // 返回实际的业务数据
        } else {
          console.error('业务错误:', apiResponse.message);
          return Promise.reject(new Error(apiResponse.message || '请求失败'));
        }
      },
      (error: AxiosError) => {
        console.error('响应错误:', error.response || error.message);
        if (error.response) {
          switch (error.response.status) {
            case 401:
              console.error('未授权，请重新登录');
              break;
            case 403:
              console.error('您没有权限访问此资源');
              break;
            case 404:
              console.error('请求的资源不存在');
              break;
            case 500:
              console.error('服务器内部错误，请稍后再试');
              break;
            default:
              console.error(
                `HTTP 错误: ${error.response.status} - ${error.response.statusText}`,
              );
          }
        } else if (error.request) {
          console.error('无响应，请检查网络连接');
        } else {
          console.error('请求设置错误:', error.message);
        }
        return Promise.reject(error);
      },
    );
  }

  // 封装常用的请求方法
  public get<T>(url: string, config?: InternalAxiosRequestConfig): Promise<T> {
    return this.instance.get<ApiResponse<T>, T>(url, config);
  }

  public post<T>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    return this.instance.post<ApiResponse<T>, T>(url, data, config);
  }

  public put<T>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    return this.instance.put<ApiResponse<T>, T>(url, data, config);
  }

  public patch<T>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    return this.instance.patch<ApiResponse<T>, T>(url, data, config);
  }

  public delete<T>(
    url: string,
    config?: InternalAxiosRequestConfig,
  ): Promise<T> {
    return this.instance.delete<ApiResponse<T>, T>(url, config);
  }

  // 文件下载方法，返回完整的 AxiosResponse
  public download(
    url: string,
    config?: InternalAxiosRequestConfig,
  ): Promise<AxiosResponse<Blob | ArrayBuffer>> {
    return this.instance.get(url, { ...config, responseType: 'blob' });
  }
}

const http = new HttpClient();
export default http;
