/**
 * 盲水印功能
 * 使用 LSB 算法在图片中嵌入不可见水印
 * 仅在下载时添加，非文章页面使用
 */

(function() {
  'use strict';

  // 盲水印配置
  const blindWatermarkConfig = {
    text: '© Dran Blog', // 水印文字
    enabled: true // 是否启用
  };

  // 将文本转换为二进制
  function textToBinary(text) {
    return text.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
  }

  // 将二进制转换为文本
  function binaryToText(binary) {
    const bytes = binary.match(/.{8}/g);
    if (!bytes) return '';
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
  }

  // 在图片中嵌入盲水印（LSB 算法）
  function embedBlindWatermark(imageData, watermarkText) {
    const binary = textToBinary(watermarkText);
    const data = imageData.data;
    
    // 在前缀添加长度信息（16位）
    const lengthBinary = binary.length.toString(2).padStart(16, '0');
    const fullBinary = lengthBinary + binary;
    
    // 将二进制数据嵌入到像素的最低位
    for (let i = 0; i < fullBinary.length && i < data.length; i++) {
      // 只修改 RGB 通道，不修改 Alpha
      if ((i + 1) % 4 !== 0) {
        data[i] = (data[i] & 0xFE) | parseInt(fullBinary[i], 10);
      }
    }
    
    return imageData;
  }

  // 从图片中提取盲水印
  function extractBlindWatermark(imageData) {
    const data = imageData.data;
    let binary = '';
    
    // 提取长度信息
    for (let i = 0; i < 16 && i < data.length; i++) {
      if ((i + 1) % 4 !== 0) {
        binary += (data[i] & 1).toString();
      }
    }
    
    const length = parseInt(binary, 2);
    binary = '';
    
    // 提取水印数据
    for (let i = 16; i < 16 + length && i < data.length; i++) {
      if ((i + 1) % 4 !== 0) {
        binary += (data[i] & 1).toString();
      }
    }
    
    return binaryToText(binary);
  }

  // 为图片添加盲水印
  function addBlindWatermarkToImage(img) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      
      tempImg.onload = function() {
        canvas.width = tempImg.naturalWidth || tempImg.width;
        canvas.height = tempImg.naturalHeight || tempImg.height;
        
        ctx.drawImage(tempImg, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const watermarkedData = embedBlindWatermark(imageData, blindWatermarkConfig.text);
          ctx.putImageData(watermarkedData, 0, 0);
          
          canvas.toBlob(blob => {
            resolve(blob);
          }, 'image/png');
        } catch (e) {
          reject(e);
        }
      };
      
      tempImg.onerror = reject;
      
      // 使用 CORS 代理
      const corsProxyUrl = img.src.replace('r2.lpblog.dpdns.org', 'cors.lpblog.dpdns.org');
      tempImg.src = corsProxyUrl;
    });
  }

  // 拦截图片下载
  function interceptImageDownload() {
    if (!blindWatermarkConfig.enabled) return;
    
    // 检查是否在文章页面
    const isArticlePage = document.querySelector('#article-container, .post-content') !== null;
    if (isArticlePage) return; // 文章页面不添加盲水印
    
    // 监听右键菜单
    document.addEventListener('contextmenu', function(e) {
      const target = e.target;
      if (target.tagName === 'IMG') {
        // 标记图片，用于下载时处理
        target.dataset.needBlindWatermark = 'true';
      }
    });
    
    // 拦截下载链接点击
    document.addEventListener('click', async function(e) {
      const target = e.target;
      
      // 检查是否是下载图片的操作
      if (target.tagName === 'A' && target.download) {
        const img = document.querySelector('img[data-need-blind-watermark="true"]');
        if (img) {
          e.preventDefault();
          
          try {
            const blob = await addBlindWatermarkToImage(img);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = target.download || 'image.png';
            a.click();
            URL.revokeObjectURL(url);
            
            // 清除标记
            img.removeAttribute('data-need-blind-watermark');
          } catch (e) {
            console.warn('无法添加盲水印:', e);
            // 失败时使用原始下载
            window.open(target.href);
          }
        }
      }
    });
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptImageDownload);
  } else {
    interceptImageDownload();
  }

  // 暴露接口
  window.blindWatermark = {
    config: blindWatermarkConfig,
    embed: embedBlindWatermark,
    extract: extractBlindWatermark,
    addToImage: addBlindWatermarkToImage
  };

})();
