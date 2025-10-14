/**
 * Service Worker - 资源缓存和离线支持
 * 实现静态资源缓存、API缓存和离线功能
 */

const CACHE_NAME = 'h5-app-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/common.css',
    '/css/themes.css',
    '/css/global-background.css',
    '/js/smart-back.js',
    '/js/global-background.js',
    '/js/websocket.js',
    '/图标/favicon.ico'
];

// 需要缓存的动态资源模式
const DYNAMIC_PATTERNS = [
    /\/api\//,
    /\.css$/,
    /\.js$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.webp$/,
    /\.svg$/
];

/**
 * Service Worker安装事件
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装中...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('缓存静态资源...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('静态资源缓存完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('静态资源缓存失败:', error);
            })
    );
});

/**
 * Service Worker激活事件
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 删除旧版本缓存
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker 激活完成');
                return self.clients.claim();
            })
    );
});

/**
 * 拦截网络请求
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // 只处理GET请求
    if (request.method !== 'GET') {
        return;
    }
    
    // 处理不同类型的请求
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isDynamicAsset(request)) {
        event.respondWith(handleDynamicAsset(request));
    } else {
        event.respondWith(handleOtherRequest(request));
    }
});

/**
 * 判断是否为静态资源
 */
function isStaticAsset(request) {
    const url = new URL(request.url);
    return STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset));
}

/**
 * 判断是否为API请求
 */
function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/');
}

/**
 * 判断是否为动态资源
 */
function isDynamicAsset(request) {
    const url = new URL(request.url);
    return DYNAMIC_PATTERNS.some(pattern => pattern.test(url.pathname));
}

/**
 * 处理静态资源请求 - 缓存优先策略
 */
async function handleStaticAsset(request) {
    try {
        // 先从缓存查找
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 缓存未命中，从网络获取
        const networkResponse = await fetch(request);
        
        // 缓存响应
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('静态资源请求失败:', error);
        
        // 返回离线页面或默认响应
        if (request.destination === 'document') {
            return caches.match('/offline.html') || new Response('离线模式', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        }
        
        return new Response('资源不可用', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * 处理API请求 - 网络优先策略
 */
async function handleAPIRequest(request) {
    try {
        // 先尝试网络请求
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 缓存成功的API响应
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('API请求失败，尝试缓存:', error);
        
        // 网络失败，尝试从缓存获取
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // 添加离线标识
            const response = cachedResponse.clone();
            response.headers.set('X-Served-By', 'sw-cache');
            return response;
        }
        
        // 返回错误响应
        return new Response(JSON.stringify({
            error: '网络连接失败',
            message: '请检查网络连接后重试',
            offline: true
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

/**
 * 处理动态资源请求 - 缓存优先策略
 */
async function handleDynamicAsset(request) {
    try {
        // 先从缓存查找
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // 后台更新缓存
            updateCacheInBackground(request);
            return cachedResponse;
        }
        
        // 缓存未命中，从网络获取
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 缓存响应
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('动态资源请求失败:', error);
        
        // 返回缓存或默认响应
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('资源不可用', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * 处理其他请求 - 网络优先策略
 */
async function handleOtherRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('其他请求失败:', error);
        
        // 尝试从缓存获取
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('请求失败', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * 后台更新缓存
 */
async function updateCacheInBackground(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse);
        }
    } catch (error) {
        console.error('后台缓存更新失败:', error);
    }
}

/**
 * 处理消息事件
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_INFO':
            getCacheInfo().then(info => {
                event.ports[0].postMessage(info);
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache(data.cacheName).then(result => {
                event.ports[0].postMessage(result);
            });
            break;
            
        case 'UPDATE_CACHE':
            updateCache(data.urls).then(result => {
                event.ports[0].postMessage(result);
            });
            break;
            
        default:
            console.warn('未知消息类型:', type);
    }
});

/**
 * 获取缓存信息
 */
async function getCacheInfo() {
    try {
        const cacheNames = await caches.keys();
        const cacheInfo = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheInfo[cacheName] = {
                count: keys.length,
                urls: keys.map(request => request.url)
            };
        }
        
        return {
            success: true,
            caches: cacheInfo,
            totalCaches: cacheNames.length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 清理缓存
 */
async function clearCache(cacheName) {
    try {
        if (cacheName) {
            const deleted = await caches.delete(cacheName);
            return {
                success: true,
                deleted,
                message: `缓存 ${cacheName} ${deleted ? '已删除' : '删除失败'}`
            };
        } else {
            const cacheNames = await caches.keys();
            const results = await Promise.all(
                cacheNames.map(name => caches.delete(name))
            );
            
            return {
                success: true,
                deleted: results.filter(Boolean).length,
                total: cacheNames.length,
                message: '所有缓存已清理'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 更新缓存
 */
async function updateCache(urls) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const results = [];
        
        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    results.push({ url, success: true });
                } else {
                    results.push({ url, success: false, error: `HTTP ${response.status}` });
                }
            } catch (error) {
                results.push({ url, success: false, error: error.message });
            }
        }
        
        return {
            success: true,
            results,
            updated: results.filter(r => r.success).length,
            total: urls.length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 定期清理过期缓存
 */
setInterval(async () => {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                    const responseDate = new Date(dateHeader).getTime();
                    if (now - responseDate > maxAge) {
                        await cache.delete(request);
                        console.log('删除过期缓存:', request.url);
                    }
                }
            }
        }
    } catch (error) {
        console.error('清理过期缓存失败:', error);
    }
}, 60 * 60 * 1000); // 每小时执行一次

console.log('Service Worker 脚本加载完成');