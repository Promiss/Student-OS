// 全局配置
const CONFIG = {
    // API配置
    API: {
        BASE_URL: '/api',
        TIMEOUT: 5000
    },
    
    // 动画配置
    ANIMATION: {
        DURATION: 800,
        DELAY: 200
    },
    
    // UI配置
    UI: {
        TOAST_DURATION: 3000,
        MODAL_BACKDROP: true
    }
};

// 防止配置被修改
Object.freeze(CONFIG);

// 导出配置
export default CONFIG; 