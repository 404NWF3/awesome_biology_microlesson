// 3D模型查看器脚本
const modelViewers = [];
let modelsInitialized = false;

// 初始化所有模型查看器
function initModelViewers() {
    // 如果已初始化，避免重复初始化
    if (modelsInitialized) return;
    modelsInitialized = true;
    
    const containers = document.querySelectorAll('.model-container');
    
    // 使用Intersection Observer实现懒加载
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target;
                const modelPath = container.getAttribute('data-model');
                const modelTitle = container.getAttribute('data-title');
                const modelDescription = container.getAttribute('data-description');
                
                // 创建模型查看器
                const viewer = new ModelViewer(container, modelPath, modelTitle, modelDescription);
                modelViewers.push(viewer);
                viewer.init();
                
                // 停止观察已加载的容器
                observer.unobserve(container);
            }
        });
    }, {
        threshold: 0.1, // 当10%的元素可见时触发
        rootMargin: '100px' // 提前100px开始加载
    });
    
    // 对每个容器进行观察
    containers.forEach(container => {
        observer.observe(container);
    });
}

// 模型查看器类
class ModelViewer {
    constructor(container, modelPath, title, description) {
        this.container = container;
        this.modelPath = modelPath;
        this.title = title;
        this.description = description;
        
        // Three.js 组件
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.controls = null;
        
        // 动画ID
        this.animationId = null;
        
        // 容器尺寸
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        // 渲染状态
        this.isRendering = false;
        this.needsRender = false;
        this.lastRenderTime = 0;
    }
    
    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        
        // 创建渲染器 - 降低像素比以提高性能
        const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // 关闭抗锯齿以提高性能
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(pixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // 添加环境光和方向光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // 添加轨道控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // 配置控制器事件 - 仅在交互时渲染
        this.controls.addEventListener('start', () => {
            this.needsRender = true;
            if (!this.isRendering) {
                this.startRendering();
            }
        });
        
        this.controls.addEventListener('end', () => {
            // 交互结束后再渲染几帧确保平滑停止
            setTimeout(() => {
                this.needsRender = false;
            }, 1000);
        });
        
        // 加载模型
        this.loadModel();
        
        // 添加窗口大小调整事件
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 初始渲染一帧
        this.renderer.render(this.scene, this.camera);
    }
    
    loadModel() {
        // 显示加载中提示
        const loadingElem = document.createElement('div');
        loadingElem.className = 'model-loading';
        loadingElem.textContent = '加载中...';
        this.container.appendChild(loadingElem);
        
        // 优化模型加载 - 使用draco压缩的加载器如果可用
        const GLTFLoader = THREE.GLTFLoader || window.GLTFLoader;
        const loader = new GLTFLoader();
        
        // 降低加载优先级
        loader.load(
            this.modelPath,
            (gltf) => {
                this.model = gltf.scene;
                
                // 优化模型 - 减少多边形数量或细节
                this.optimizeModel(this.model);
                
                // 调整模型大小和位置
                const box = new THREE.Box3().setFromObject(this.model);
                const size = box.getSize(new THREE.Vector3()).length();
                const center = box.getCenter(new THREE.Vector3());
                
                // 重置模型位置
                this.model.position.x = -center.x;
                this.model.position.y = -center.y;
                this.model.position.z = -center.z;
                
                // 调整相机位置
                this.camera.position.copy(center);
                this.camera.position.x += size / 2.0;
                this.camera.position.y += size / 5.0;
                this.camera.position.z += size / 2.0;
                this.camera.lookAt(center);
                
                // 调整控制器目标
                this.controls.target.copy(center);
                
                // 添加模型到场景
                this.scene.add(this.model);
                
                // 移除加载提示
                this.container.removeChild(loadingElem);
                
                // 初始渲染一帧
                this.renderer.render(this.scene, this.camera);
                
                // 监听可见性变化
                this.setupVisibilityObserver();
            },
            (xhr) => {
                // 更新加载进度
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                loadingElem.textContent = `加载中: ${percent}%`;
            },
            (error) => {
                console.error('模型加载错误:', error);
                loadingElem.textContent = '加载失败';
            }
        );
    }
    
    // 优化模型
    optimizeModel(model) {
        model.traverse(child => {
            if (child.isMesh) {
                // 禁用不必要的功能
                child.frustumCulled = true;
                
                // 简化材质
                if (child.material) {
                    child.material.precision = 'lowp'; // 低精度
                    child.material.fog = false;
                }
            }
        });
    }
    
    // 设置可见性观察器
    setupVisibilityObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 容器可见时，如果用户交互过则开始渲染
                    if (this.needsRender && !this.isRendering) {
                        this.startRendering();
                    } else {
                        // 单帧渲染
                        this.renderer.render(this.scene, this.camera);
                    }
                } else {
                    // 容器不可见时停止渲染
                    this.stopRendering();
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(this.container);
    }
    
    startRendering() {
        if (this.isRendering) return;
        this.isRendering = true;
        this.lastRenderTime = performance.now();
        this.animate();
    }
    
    stopRendering() {
        this.isRendering = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        if (!this.isRendering) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const now = performance.now();
        // 限制帧率 - 最大30fps
        if (now - this.lastRenderTime < 33.33) {
            return;
        }
        
        this.lastRenderTime = now;
        
        // 更新控制器
        if (this.controls) {
            this.controls.update();
        }
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
        
        // 如果不需要渲染，并且控制器不在活动状态，停止渲染
        if (!this.needsRender && !this.controls.enabled) {
            this.stopRendering();
        }
    }
    
    onWindowResize() {
        // 更新容器尺寸
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        // 更新相机
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        // 更新渲染器
        this.renderer.setSize(this.width, this.height);
        
        // 触发一次渲染
        this.renderer.render(this.scene, this.camera);
    }
}

// 页面加载完成后初始化模型查看器
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，让页面其他部分先加载完成
    setTimeout(() => {
        // 确保Three.js和OrbitControls已加载
        if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
            initModelViewers();
        } else {
            console.error('Three.js或其组件未加载');
        }
    }, 1000); // 延迟1秒初始化模型
});