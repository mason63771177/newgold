import { useState, useCallback, useRef } from 'react';

/**
 * API缓存接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * API缓存配置
 */
interface CacheConfig {
  ttl?: number; // 缓存时间（毫秒），默认5分钟
  maxSize?: number; // 最大缓存条目数，默认50
}

/**
 * API响应缓存Hook
 * 提供简单的内存缓存机制，避免重复的API请求
 */
export const useApiCache = <T = any>(config: CacheConfig = {}) => {
  const { ttl = 5 * 60 * 1000, maxSize = 50 } = config;
  const cacheRef = useRef<Map<string, CacheItem<T>>>(new Map());

  /**
   * 生成缓存键
   */
  const generateKey = useCallback((url: string, params?: any): string => {
    if (!params) return url;
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as any);
    return `${url}?${JSON.stringify(sortedParams)}`;
  }, []);

  /**
   * 获取缓存数据
   */
  const get = useCallback((key: string): T | null => {
    const cache = cacheRef.current;
    const item = cache.get(key);
    
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  }, []);

  /**
   * 设置缓存数据
   */
  const set = useCallback((key: string, data: T): void => {
    const cache = cacheRef.current;
    
    // 如果缓存已满，删除最旧的条目
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
    
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }, [ttl, maxSize]);

  /**
   * 删除缓存数据
   */
  const remove = useCallback((key: string): void => {
    cacheRef.current.delete(key);
  }, []);

  /**
   * 清空所有缓存
   */
  const clear = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  /**
   * 获取缓存统计信息
   */
  const getStats = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;

    cache.forEach((item) => {
      if (now > item.expiry) {
        expiredCount++;
      } else {
        validCount++;
      }
    });

    return {
      total: cache.size,
      valid: validCount,
      expired: expiredCount
    };
  }, []);

  /**
   * 缓存装饰器函数
   * 自动处理缓存逻辑的API调用包装器
   */
  const withCache = useCallback(
    <R>(
      apiCall: () => Promise<R>,
      cacheKey: string,
      forceRefresh = false
    ): Promise<R> => {
      return new Promise(async (resolve, reject) => {
        try {
          // 如果不强制刷新，先尝试从缓存获取
          if (!forceRefresh) {
            const cached = get(cacheKey);
            if (cached !== null) {
              resolve(cached as R);
              return;
            }
          }

          // 调用API并缓存结果
          const result = await apiCall();
          set(cacheKey, result as T);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    },
    [get, set]
  );

  return {
    get,
    set,
    remove,
    clear,
    getStats,
    generateKey,
    withCache
  };
};

/**
 * 全局API缓存实例
 * 用于在不同组件间共享缓存
 */
class GlobalApiCache {
  private cache = new Map<string, CacheItem<any>>();
  private ttl = 5 * 60 * 1000; // 5分钟
  private maxSize = 100;

  generateKey(url: string, params?: any): string {
    if (!params) return url;
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as any);
    return `${url}?${JSON.stringify(sortedParams)}`;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set<T>(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.ttl
    });
  }

  remove(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  async withCache<T>(
    apiCall: () => Promise<T>,
    cacheKey: string,
    forceRefresh = false
  ): Promise<T> {
    if (!forceRefresh) {
      const cached = this.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const result = await apiCall();
    this.set(cacheKey, result);
    return result;
  }
}

export const globalApiCache = new GlobalApiCache();