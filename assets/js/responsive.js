// 响应式导航菜单函数
document.addEventListener('DOMContentLoaded', function() {
    // 错误处理和备用方案
    function setupErrorHandling() {
        // 全局错误处理
        window.onerror = function(message, source, lineno, colno, error) {
            console.error('全局错误:', message, source, lineno, colno);
            
            // 防止关键功能失效
            if (source && source.includes('responsive.js')) {
                // 如果响应式脚本发生错误，尝试应用最基本的响应式设置
                applyBasicResponsiveness();
            }
            
            // 不阻止默认错误处理
            return false;
        };
        
        // Promise错误处理
        window.addEventListener('unhandledrejection', function(event) {
            console.error('未处理的Promise拒绝:', event.reason);
        });
        
        // 监听资源加载失败
        window.addEventListener('error', function(event) {
            if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                console.error('资源加载失败:', event.target.src || event.target.href);
                
                // 尝试处理关键资源错误
                if (event.target.dataset && event.target.dataset.critical === 'true') {
                    handleCriticalResourceError(event.target);
                }
            }
        }, true);  // 捕获阶段捕获以便拦截资源错误
    }
    
    // 应用基本响应式设置的备用函数
    function applyBasicResponsiveness() {
        console.log('应用基本响应式设置作为备用方案');
        
        // 添加基本的响应式样式
        const basicStyles = document.createElement('style');
        basicStyles.innerHTML = `
            @media (max-width: 768px) {
                nav ul {
                    display: none;
                }
                
                #home h1 {
                    font-size: 2.5rem !important;
                }
                
                .feature-grid {
                    flex-direction: column;
                    align-items: center;
                }
                
                .feature-card {
                    width: 100%;
                    max-width: 300px;
                }
            }
        `;
        document.head.appendChild(basicStyles);
        
        // 添加简单菜单按钮
        const nav = document.querySelector('nav');
        if (nav && !document.querySelector('.menu-button')) {
            const menuButton = document.createElement('button');
            menuButton.className = 'menu-button basic-fallback';
            menuButton.textContent = '菜单';
            menuButton.style.cssText = 'position: absolute; right: 20px; top: 15px; padding: 8px 12px; z-index: 1000; display: none;';
            
            // 添加简单的媒体查询
            const buttonStyle = document.createElement('style');
            buttonStyle.innerHTML = `
                @media (max-width: 768px) {
                    .menu-button.basic-fallback {
                        display: block;
                    }
                }
            `;
            document.head.appendChild(buttonStyle);
            
            // 添加基本的点击切换功能
            menuButton.addEventListener('click', function() {
                const navMenu = document.querySelector('nav ul');
                if (navMenu) {
                    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
                    navMenu.style.flexDirection = 'column';
                    navMenu.style.position = 'absolute';
                    navMenu.style.top = '60px';
                    navMenu.style.left = '0';
                    navMenu.style.width = '100%';
                    navMenu.style.backgroundColor = '#fff';
                    navMenu.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                }
            });
            
            nav.appendChild(menuButton);
        }
    }
    
    // 处理关键资源错误
    function handleCriticalResourceError(resourceElement) {
        const resourceType = resourceElement.tagName.toLowerCase();
        const resourceUrl = resourceElement.src || resourceElement.href;
        
        console.log('尝试处理关键资源错误:', resourceType, resourceUrl);
        
        // 尝试加载备用资源
        if (resourceElement.dataset.fallback) {
            console.log('加载备用资源:', resourceElement.dataset.fallback);
            
            if (resourceType === 'script') {
                const fallbackScript = document.createElement('script');
                fallbackScript.src = resourceElement.dataset.fallback;
                document.head.appendChild(fallbackScript);
            } else if (resourceType === 'link' && resourceElement.rel === 'stylesheet') {
                const fallbackStyle = document.createElement('link');
                fallbackStyle.rel = 'stylesheet';
                fallbackStyle.href = resourceElement.dataset.fallback;
                document.head.appendChild(fallbackStyle);
            }
        }
    }
    
    // 设置错误处理
    setupErrorHandling();
    
    // 汉堡菜单相关元素
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;
    
    // 创建背景遮罩元素
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
    
    // 切换菜单状态
    function toggleMenu() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        body.classList.toggle('no-scroll');
    }
    
    // 点击汉堡菜单按钮时
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
    
    // 点击背景遮罩时关闭菜单
    overlay.addEventListener('click', toggleMenu);
    
    // 点击导航链接时关闭菜单
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (hamburger.classList.contains('active')) {
                toggleMenu();
            }
        });
    });
    
    // 窗口大小变化时处理
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && hamburger.classList.contains('active')) {
            toggleMenu();
        }
    });
    
    // 添加平台检测
    function detectPlatform() {
        const userAgent = navigator.userAgent;
        const html = document.documentElement;
        
        // 检测并添加平台类
        if (/Windows/.test(userAgent)) {
            html.classList.add('is-windows');
        } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
            html.classList.add('is-mac');
        } else if (/iPad|iPhone|iPod/.test(userAgent)) {
            html.classList.add('is-ios');
        } else if (/Android/.test(userAgent)) {
            html.classList.add('is-android');
        }
        
        // 检测并添加浏览器类
        if (/Edge/.test(userAgent)) {
            html.classList.add('is-edge');
        } else if (/Chrome/.test(userAgent)) {
            html.classList.add('is-chrome');
        } else if (/Firefox/.test(userAgent)) {
            html.classList.add('is-firefox');
        } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
            html.classList.add('is-safari');
        } else if (/MSIE|Trident/.test(userAgent)) {
            html.classList.add('is-ie');
        }
        
        // 检测触摸设备
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            html.classList.add('is-touch');
        } else {
            html.classList.add('is-no-touch');
        }
    }
    
    // 运行平台检测
    detectPlatform();
    
    // 添加CSS变量根据屏幕尺寸
    function updateCSSVariables() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // 初始更新和添加事件监听
    updateCSSVariables();
    window.addEventListener('resize', updateCSSVariables);
    
    // 给body添加loaded类，去除预加载
    setTimeout(function() {
        document.body.classList.add('loaded');
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 300);
        }
    }, 500);
    
    // 图片懒加载支持
    function handleImageLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            // 浏览器原生支持懒加载
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            lazyImages.forEach(img => {
                img.addEventListener('load', function() {
                    this.classList.add('loaded');
                });
            });
        } else {
            // 不支持原生懒加载的浏览器使用IntersectionObserver（如果支持）
            if ('IntersectionObserver' in window) {
                const lazyImages = document.querySelectorAll('img.lazy');
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            if (img.dataset.srcset) {
                                img.srcset = img.dataset.srcset;
                            }
                            img.classList.remove('lazy');
                            img.classList.add('loaded');
                            imageObserver.unobserve(img);
                        }
                    });
                });
                
                lazyImages.forEach(img => {
                    imageObserver.observe(img);
                });
            } else {
                // 对于不支持IntersectionObserver的老浏览器，使用简单的scroll事件
                let lazyLoadThrottleTimeout;
                const lazyImages = document.querySelectorAll('img.lazy');
                
                function lazyLoad() {
                    if (lazyLoadThrottleTimeout) {
                        clearTimeout(lazyLoadThrottleTimeout);
                    }
                    
                    lazyLoadThrottleTimeout = setTimeout(function() {
                        const scrollTop = window.pageYOffset;
                        lazyImages.forEach(function(img) {
                            if (img.offsetTop < (window.innerHeight + scrollTop)) {
                                img.src = img.dataset.src;
                                if (img.dataset.srcset) {
                                    img.srcset = img.dataset.srcset;
                                }
                                img.classList.remove('lazy');
                                img.classList.add('loaded');
                            }
                        });
                        
                        if (lazyImages.length == 0) { 
                            document.removeEventListener("scroll", lazyLoad);
                            window.removeEventListener("resize", lazyLoad);
                            window.removeEventListener("orientationChange", lazyLoad);
                        }
                    }, 20);
                }
                
                document.addEventListener("scroll", lazyLoad);
                window.addEventListener("resize", lazyLoad);
                window.addEventListener("orientationChange", lazyLoad);
                
                // 初始调用一次
                lazyLoad();
            }
        }
    }
    
    // 运行图片懒加载
    handleImageLoading();
    
    // IE11和旧版Edge对CSS变量的polyfill
    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--foo: red)')) {
        // 为不支持CSS变量的浏览器添加基本颜色支持
        // 这是最简化版本，仅添加主要颜色变量
        const styleSheet = document.createElement('style');
        styleSheet.innerHTML = `
            body {
                background-color: #f8f9fd;
                color: #2c3e50;
            }
            .feature-card {
                background-color: white;
                color: #2c3e50;
            }
            /* 添加其他关键颜色 */
        `;
        document.head.appendChild(styleSheet);
    }
    
    // 检测并处理Windows平台上不同版本的兼容性
    function handleWindowsCompatibility() {
        if (navigator.userAgent.indexOf('Windows') !== -1) {
            // 检测Windows版本
            let windowsVersion = 'unknown';
            const ntVersionMatch = navigator.userAgent.match(/Windows NT (\d+\.\d+)/);
            
            if (ntVersionMatch) {
                const ntVersion = parseFloat(ntVersionMatch[1]);
                
                if (ntVersion === 6.1) {
                    windowsVersion = 'win7';
                    document.documentElement.classList.add('win7');
                } else if (ntVersion === 6.2 || ntVersion === 6.3) {
                    windowsVersion = 'win8';
                    document.documentElement.classList.add('win8');
                } else if (ntVersion >= 10.0) {
                    windowsVersion = 'win10';
                    document.documentElement.classList.add('win10');
                    
                    // Windows 11检测（基于构建版本号）
                    if (navigator.userAgent.match(/; (?:Windows NT 10.0; )?Win64; x64;?/) && 
                        navigator.userAgent.match(/build\/(\d+)/i) && 
                        parseInt(navigator.userAgent.match(/build\/(\d+)/i)[1]) >= 22000) {
                        windowsVersion = 'win11';
                        document.documentElement.classList.add('win11');
                    }
                }
            }
            
            console.log('Windows版本:', windowsVersion);
        }
    }
    
    // 运行Windows兼容性处理
    handleWindowsCompatibility();
}); 