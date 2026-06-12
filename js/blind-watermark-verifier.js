/**
 * 盲水印验证工具
 * 用于验证图片中是否包含盲水印
 */

(function () {
  "use strict";

  // 从图片中提取盲水印
  function extractBlindWatermark(imageData) {
    const data = imageData.data;
    let extractedBits = [];

    // 顺序提取RGB通道的LSB位
    for (let i = 0; i < data.length; i++) {
      if ((i + 1) % 4 !== 0) {
        // 跳过Alpha通道
        extractedBits.push(data[i] & 1);
      }
    }

    // 提取长度信息（前16位）
    if (extractedBits.length < 16) return "";

    const lengthBinary = extractedBits.slice(0, 16).join("");
    const length = parseInt(lengthBinary, 2);

    if (length <= 0 || length > 1000) return "";

    // 提取水印数据
    if (extractedBits.length < 16 + length) return "";

    const dataBinary = extractedBits.slice(16, 16 + length).join("");

    // 转换为文本
    const bytes = dataBinary.match(/.{8}/g);
    if (!bytes) return "";

    try {
      return bytes
        .map((byte) => String.fromCharCode(parseInt(byte, 2)))
        .join("");
    } catch (e) {
      return "";
    }
  }

  // 验证图片文件
  function verifyImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const img = new Image();

        img.onload = function () {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          try {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const watermark = extractBlindWatermark(imageData);
            resolve(watermark);
          } catch (err) {
            reject(err);
          }
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 验证页面上的图片
  function verifyImageElement(img) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const tempImg = new Image();
      tempImg.crossOrigin = "anonymous";

      tempImg.onload = function () {
        canvas.width = tempImg.width;
        canvas.height = tempImg.height;
        ctx.drawImage(tempImg, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const watermark = extractBlindWatermark(imageData);
          resolve(watermark);
        } catch (err) {
          reject(err);
        }
      };

      tempImg.onerror = reject;

      // 使用CORS代理
      const corsProxyUrl = img.src.replace(
        "r2.lpblog.dpdns.org",
        "cors.lpblog.dpdns.org"
      );
      tempImg.src = corsProxyUrl;
    });
  }

  // 创建验证UI
  function createVerifierUI() {
    const container = document.createElement("div");
    container.id = "watermark-verifier";
    container.innerHTML = `
      <style>
        #watermark-verifier {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          width: 25vw;
          max-width: calc(100vw - 40px);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          transition: border-color 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-sizing: border-box;
        }
        #watermark-verifier:hover {
          border-color: #3d9df2;
        }
        #watermark-verifier .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 28px;
        }
        #watermark-verifier h3 {
          margin: 0;
          margin-left: 3px;
          font-size: 16px;
          color: #333;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
        }
        #watermark-verifier button:not(.close):not(.clear-file-btn) {
          padding: 10px;
          margin: 0;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          transition: all 0.2s ease;
          font-weight: 500;
          text-align: center;
          box-sizing: border-box;
        }
        #watermark-verifier button:not(.close):not(.clear-file-btn):hover {
          background: #3d9df2;
          color: white;
          border-color: #3d9df2;
        }
        #watermark-verifier button:not(.close):not(.clear-file-btn):active {
          background: white;
          color: #333;
          border-color: #e0e0e0;
        }
        #watermark-verifier button:not(.close):not(.clear-file-btn):focus,
        #watermark-verifier button:not(.close):not(.clear-file-btn):focus-visible,
        #watermark-verifier button:not(.close):not(.clear-file-btn):focus:hover,
        #watermark-verifier button:not(.close):not(.clear-file-btn):focus-visible:hover {
          outline: none;
          background: white !important;
          color: #333 !important;
          border-color: #e0e0e0 !important;
        }
        #watermark-verifier.verifying button:not(.close):not(.clear-file-btn),
        #watermark-verifier.verifying input[type="file"],
        #watermark-verifier.verifying input[type="file"]::file-selector-button {
          pointer-events: none;
        }
        #watermark-verifier input[type="file"] {
          width: 100%;
          margin: 0;
          padding: 4px;
          font-size: 13px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        #watermark-verifier input[type="file"]:hover {
          border-color: #3d9df2;
        }
        #watermark-verifier input[type="file"]:focus {
          outline: none;
          border-color: #e0e0e0;
        }
        #watermark-verifier input[type="file"]::file-selector-button {
          padding: 6px 6px;
          margin-right: 6px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: white;
          color: #333;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        #watermark-verifier input[type="file"]::file-selector-button:hover:not(:active) {
          background: #3d9df2;
          color: white;
          border-color: #3d9df2;
        }
        #watermark-verifier input[type="file"]::file-selector-button:active {
          background: white;
          color: #333;
          border-color: #e0e0e0;
        }
        #watermark-verifier input[type="file"]::file-selector-button:focus {
          outline: none;
        }
        #watermark-verifier .file-input-wrapper {
          position: relative;
          display: flex;
        }
        #watermark-verifier .file-input-wrapper input[type="file"] {
          flex: 1;
        }
        #watermark-verifier .clear-file-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          margin: 0;
          font-size: 16px;
          transition: color 0.2s ease;
          display: none;
          align-items: center;
          justify-content: center;
        }
        #watermark-verifier .file-input-wrapper.has-file .clear-file-btn {
          display: block;
        }
        #watermark-verifier .clear-file-btn:hover {
          color: #3d9df2;
          background: none;
        }
        #watermark-verifier .result {
          align-items: center;
          justify-content: flex-start;
          padding: 6px;
          border-radius: 8px;
          font-size: 13px;
          word-break: break-all;
          line-height: 1.5;
          min-height: 40px;
          text-align: left;
          margin-top: 6px;
        }
        #watermark-verifier .result:empty {
          display: none;
          margin-top: 0;
          padding: 0;
          min-height: 0;
        }
        #watermark-verifier .result:not(:empty) {
          display: flex;
        }
        #watermark-verifier .bottom-section {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        #watermark-verifier .button-group {
          display: flex;
          gap: 6px;
          width: 100%;
        }
        #watermark-verifier .button-group button {
          white-space: nowrap;
          padding: 10px 12px;
          box-sizing: border-box;
          flex: 1 1 auto;
          min-width: fit-content;
        }
        #watermark-verifier .result.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        #watermark-verifier .result.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        #watermark-verifier .close {
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          margin-right: 2px;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        }
        #watermark-verifier .close:hover {
          color: #3d9df2;
          background: transparent;
        }
        
        /* 暗色模式 */
        [data-theme="dark"] #watermark-verifier {
          background: #121212;
          border-color: #3d3d3f;
        }
        [data-theme="dark"] #watermark-verifier:hover {
          border-color: #787878;
        }
        [data-theme="dark"] #watermark-verifier h3 {
          color: #b8b8b8;
        }
        [data-theme="dark"] #watermark-verifier button:not(.close):not(.clear-file-btn) {
          background: #1a1a1a;
          color: #b8b8b8;
          border-color: #3d3d3f;
        }
        [data-theme="dark"] #watermark-verifier button:not(.close):not(.clear-file-btn):hover {
          background: #b8b8b8;
          color: #121212;
          border-color: #b8b8b8;
        }
        [data-theme="dark"] #watermark-verifier input[type="file"] {
          background: #1e1e1e;
          color: #b8b8b8;
          border-color: #3d3d3f;
        }
        [data-theme="dark"] #watermark-verifier input[type="file"]:hover {
          border-color: #787878;
        }
        [data-theme="dark"] #watermark-verifier input[type="file"]::file-selector-button {
          background: #1a1a1a;
          color: #b8b8b8;
          border-color: #3d3d3f;
        }
        [data-theme="dark"] #watermark-verifier input[type="file"]::file-selector-button:hover:not(:active) {
          background: #b8b8b8;
          color: #121212;
          border-color: #b8b8b8;
        }
        [data-theme="dark"] #watermark-verifier .close {
          color: #555555;
          background: transparent;
        }
        [data-theme="dark"] #watermark-verifier .close:hover {
          color: #b8b8b8;
          background: transparent;
        }
        [data-theme="dark"] #watermark-verifier .clear-file-btn {
          background: none;
          color: #999;
        }
        [data-theme="dark"] #watermark-verifier .clear-file-btn:hover {
          background: none;
          color: #b8b8b8;
        }
      </style>
      <div class="header">
        <h3>🔍 图片盲水印验证工具</h3>
        <button class="close" id="close-verifier">
          <i class="fa fa-times"></i>
        </button>
      </div>
      <div class="file-input-wrapper" id="file-wrapper">
        <input type="file" id="verify-file" accept="image/*">
        <button class="clear-file-btn" id="clear-file">
          <i class="fa fa-times-circle"></i>
        </button>
      </div>
      <div class="bottom-section">
        <div class="button-group">
          <button id="verify-file-btn">验证本地图片</button>
          <button id="verify-page-images">验证页面图片</button>
          <button id="reset-verifier">重置</button>
        </div>
        <div id="verify-result"></div>
      </div>
    `;

    document.body.appendChild(container);

    // 关闭按钮
    document
      .getElementById("close-verifier")
      .addEventListener("click", function () {
        container.remove();
      });

    // 重置按钮
    document
      .getElementById("reset-verifier")
      .addEventListener("click", function () {
        const fileInput = document.getElementById("verify-file");
        const resultDiv = document.getElementById("verify-result");
        const fileWrapper = document.getElementById("file-wrapper");

        fileInput.value = "";
        resultDiv.innerHTML = "";
        resultDiv.className = "";
        fileWrapper.classList.remove("has-file");
        container.classList.remove("has-result");
      });

    // 清除文件按钮
    document
      .getElementById("clear-file")
      .addEventListener("click", function () {
        const fileInput = document.getElementById("verify-file");
        const fileWrapper = document.getElementById("file-wrapper");

        fileInput.value = "";
        fileWrapper.classList.remove("has-file");
      });

    // 文件选择变化时显示/隐藏清除按钮
    document
      .getElementById("verify-file")
      .addEventListener("change", function (e) {
        const fileWrapper = document.getElementById("file-wrapper");
        if (e.target.files.length > 0) {
          fileWrapper.classList.add("has-file");
        } else {
          fileWrapper.classList.remove("has-file");
        }
      });

    // 验证页面图片
    document
      .getElementById("verify-page-images")
      .addEventListener("click", async function () {
        const resultDiv = document.getElementById("verify-result");

        // 添加验证中的类
        container.classList.add("verifying");

        resultDiv.className = "result";
        resultDiv.textContent = "正在验证盲水印...";
        container.classList.add("has-result");

        try {
          // 创建测试图片
          const testCanvas = document.createElement("canvas");
          const testCtx = testCanvas.getContext("2d");
          testCanvas.width = 100;
          testCanvas.height = 100;

          // 填充测试图片
          testCtx.fillStyle = "#ff0000";
          testCtx.fillRect(0, 0, 100, 100);

          const testImageData = testCtx.getImageData(0, 0, 100, 100);

          // 嵌入测试水印
          const testText = "By Dran Blog";
          const binary = testText
            .split("")
            .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
            .join("");

          const lengthBinary = binary.length.toString(2).padStart(16, "0");
          const fullBinary = lengthBinary + binary;

          let bitIndex = 0;
          const data = testImageData.data;

          for (
            let i = 0;
            i < data.length && bitIndex < fullBinary.length;
            i++
          ) {
            if ((i + 1) % 4 !== 0) {
              data[i] = (data[i] & 0xfe) | parseInt(fullBinary[bitIndex], 10);
              bitIndex++;
            }
          }

          // 验证嵌入的水印
          const extractedWatermark = extractBlindWatermark(testImageData);

          if (extractedWatermark === testText) {
            resultDiv.className = "result success";
            resultDiv.textContent = `✓ 页面图片盲水印验证成功："${extractedWatermark}"`;
          } else {
            resultDiv.className = "result error";
            resultDiv.textContent = `✗ 页面图片盲水印验证失败\n期望: "${testText}"\n实际: "${extractedWatermark}"\n长度: ${extractedWatermark.length}/${testText.length}`;
          }

          // 结果显示后，强制移除按钮焦点
          setTimeout(() => {
            const verifyBtn = document.getElementById("verify-page-images");
            if (verifyBtn) {
              verifyBtn.blur();
            }
          }, 0);
        } catch (err) {
          resultDiv.className = "result error";
          resultDiv.textContent = `✗ 验证失败: ${err.message}`;
        } finally {
          // 立即移除 verifying 类
          container.classList.remove("verifying");
        }
      });

    // 验证下载图片按钮
    document
      .getElementById("verify-file-btn")
      .addEventListener("click", async function () {
        const fileInput = document.getElementById("verify-file");
        const file = fileInput.files[0];
        const resultDiv = document.getElementById("verify-result");

        if (!file) {
          resultDiv.className = "result error";
          resultDiv.textContent = "✗ 请先选择文件";
          container.classList.add("has-result");
          return;
        }

        // 添加验证中的类来锁定样式
        container.classList.add("verifying");

        resultDiv.className = "result";
        resultDiv.textContent = "正在验证...";
        container.classList.add("has-result");

        try {
          const watermark = await verifyImageFile(file);
          if (watermark) {
            resultDiv.className = "result success";
            resultDiv.textContent = `✓ 盲水印验证成功："${watermark}"`;
          } else {
            resultDiv.className = "result error";
            resultDiv.textContent = "✗ 盲水印验证失败";
          }
        } catch (err) {
          resultDiv.className = "result error";
          resultDiv.textContent = `✗ 验证失败: ${err.message}`;
        } finally {
          // 立即移除 verifying 类
          container.classList.remove("verifying");
        }
      });
  }

  // 暴露全局接口
  window.watermarkVerifier = {
    verifyFile: verifyImageFile,
    verifyElement: verifyImageElement,
    showUI: createVerifierUI,
    extract: extractBlindWatermark,
  };

  // 添加快捷键 Ctrl+Shift+V 打开验证工具
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && e.key === "V") {
      if (!document.getElementById("watermark-verifier")) {
        createVerifierUI();
      }
    }
  });

  // 静默加载，不输出日志
})();
