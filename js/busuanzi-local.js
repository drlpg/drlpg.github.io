/*!
 * Local Busuanzi Implementation
 * 本地busuanzi统计实现 - 无需外部API依赖
 */
(function() {
    'use strict';
    
    // 防止重复初始化
    if (window.localBusuanziInitialized) return;
    window.localBusuanziInitialized = true;
    
    // 存储键名
    const STORAGE_KEYS = {
        SITE_UV: 'busuanzi_site_uv',
        SITE_PV: 'busuanzi_site_pv', 
        PAGE_PV: 'busuanzi_page_pv_',
        VISITOR_ID: 'busuanzi_visitor_id',
        LAST_VISIT: 'busuanzi_last_visit'
    };
    
    // 生成唯一访客ID
    function generateVisitorId() {
        return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 获取或创建访客ID
    function getVisitorId() {
        let visitorId = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
        if (!visitorId) {
            visitorId = generateVisitorId();
            localStorage.setItem(STORAGE_KEYS.VISITOR_ID, visitorId);
        }
        return visitorId;
    }
    
    // 检查是否为新访客（基于日期）
    function isNewVisitor() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT);
        
        if (lastVisit !== today) {
            localStorage.setItem(STORAGE_KEYS.LAST_VISIT, today);
            return true;
        }
        return false;
    }
    
    // 获取当前页面路径
    function getCurrentPagePath() {
        return location.pathname + location.search;
    }
    
    // 更新统计数据
    function updateStats() {
        const currentPath = getCurrentPagePath();
        const pageKey = STORAGE_KEYS.PAGE_PV + encodeURIComponent(currentPath);
        
        // 更新站点PV（每次访问都增加）
        let sitePV = parseInt(localStorage.getItem(STORAGE_KEYS.SITE_PV) || '0');
        sitePV += 1;
        localStorage.setItem(STORAGE_KEYS.SITE_PV, sitePV.toString());
        
        // 更新站点UV（每天只增加一次）
        let siteUV = parseInt(localStorage.getItem(STORAGE_KEYS.SITE_UV) || '0');
        if (isNewVisitor()) {
            siteUV += 1;
            localStorage.setItem(STORAGE_KEYS.SITE_UV, siteUV.toString());
        }
        
        // 更新页面PV
        let pagePV = parseInt(localStorage.getItem(pageKey) || '0');
        pagePV += 1;
        localStorage.setItem(pageKey, pagePV.toString());
        
        return {
            site_pv: sitePV,
            site_uv: siteUV,
            page_pv: pagePV
        };
    }
    
    // 显示统计数据
    function displayStats(stats) {
        const elements = {
            site_pv: document.getElementById('busuanzi_site_pv'),
            site_uv: document.getElementById('busuanzi_site_uv'),
            page_pv: document.getElementById('busuanzi_page_pv')
        };
        
        const containers = {
            site_pv: document.getElementById('busuanzi_container_site_pv'),
            site_uv: document.getElementById('busuanzi_container_site_uv'),
            page_pv: document.getElementById('busuanzi_container_page_pv')
        };
        
        // 更新数值并显示容器
        Object.keys(elements).forEach(key => {
            const element = elements[key];
            const container = containers[key];
            
            if (element && stats[key]) {
                // 直接替换整个元素内容，包括移除转圈动画
                element.innerHTML = stats[key].toString();
                
                if (container) {
                    container.style.display = 'inline';
                }
            }
        });
        
        // 特别处理：确保所有转圈动画都被隐藏
        hideSpinners();
    }
    
    // 隐藏加载动画
    function hideSpinners() {
        // 查找所有busuanzi相关的转圈动画
        const selectors = [
            '#busuanzi_site_pv .fa-spin',
            '#busuanzi_site_uv .fa-spin', 
            '#busuanzi_page_pv .fa-spin',
            '#busuanzi_container_site_pv .fa-spin',
            '#busuanzi_container_site_uv .fa-spin',
            '#busuanzi_container_page_pv .fa-spin'
        ];
        
        selectors.forEach(selector => {
            const spinners = document.querySelectorAll(selector);
            spinners.forEach(spinner => {
                spinner.style.display = 'none';
            });
        });
    }
    
    // 初始化函数
    function init() {
        try {
            // 确保访客ID存在
            getVisitorId();
            
            // 更新统计数据
            const stats = updateStats();
            
            // 显示统计数据
            displayStats(stats);
            
        } catch (error) {
            // 静默处理错误，不输出到控制台
            hideSpinners();
        }
    }
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
    
    // PJAX兼容性
    if (typeof btf !== 'undefined' && btf.addGlobalFn) {
        btf.addGlobalFn('pjaxComplete', function() {
            setTimeout(init, 100);
        }, 'localBusuanziReinit');
    } else {
        window.addEventListener('pjax:complete', function() {
            setTimeout(init, 100);
        });
    }
    
    
    // 导出重置函数（用于调试）
    window.resetBusuanziStats = function() {
        Object.values(STORAGE_KEYS).forEach(key => {
            if (key.includes('busuanzi_')) {
                localStorage.removeItem(key);
            }
        });
        // 统计数据已重置 - 静默操作
        init();
    };
    
})();
