document.addEventListener('DOMContentLoaded', function() {
    // 创建一个性能优化的节流函数
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 使用Intersection Observer API优化滚动监听
    // 只有元素进入视口时才应用动画效果
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 添加动画类
                entry.target.classList.add('visible');
                // 优化：动画完成后移除观察
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15, // 元素15%可见时触发
        rootMargin: '0px 0px -50px 0px' // 提前50px触发动画
    });
    
    // 首页动画处理 - 减少同时执行的动画
    const homeSection = document.getElementById('home');
    if (homeSection) {
        window.requestAnimationFrame(() => {
            // 立即处理背景动画
            homeSection.classList.add('animate-background');
            
            // 重要标题和按钮有序动画，提高感知性能
            setTimeout(() => {
                const mainTitle = document.querySelector('#home h1');
                if (mainTitle) mainTitle.classList.add('animate-title');
                
                setTimeout(() => {
                    const startLearningBtn = document.querySelector('.start-learning-btn');
                    if (startLearningBtn) startLearningBtn.classList.add('animate-button');
                    
                    // 优化：功能卡片交错动画
                    const featureCards = document.querySelectorAll('.feature-card');
                    featureCards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('animate-card');
                        }, index * 100); // 100ms交错效果
                    });
                }, 150); // 更短延迟
            }, 150); // 更短延迟
        });
    }
    
    // 注册所有需要动画的节
    const animatedElements = [
        ...document.querySelectorAll('.intro-feature'), 
        ...document.querySelectorAll('.model-card')
    ];
    
    animatedElements.forEach(el => {
        animateOnScroll.observe(el);
    });
    
    // 优化：轻量级的导航栏滚动处理
    const header = document.querySelector('header');
    
    // 使用节流函数优化滚动事件处理
    const handleScroll = throttle(function() {
        // 简化DOM读取，减少重排
        const scrollY = window.scrollY || window.pageYOffset;
        
        if (scrollY > 50) { // 提高阈值，减少触发次数
            if (!header.classList.contains('visible')) {
                header.classList.add('visible');
                document.body.classList.add('header-visible');
            }
        } else {
            if (header.classList.contains('visible')) {
                header.classList.remove('visible');
                document.body.classList.remove('header-visible');
            }
        }
    }, 100); // 100ms节流
    
    // 使用passive选项提高滚动性能
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 初始处理
    handleScroll();
}); 