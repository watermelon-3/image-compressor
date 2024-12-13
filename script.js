// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const compressAllBtn = document.getElementById('compressAllBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const imagesList = document.getElementById('imagesList');

let imagesData = [];

// 上传区域点击事件
uploadArea.addEventListener('click', () => {
    imageInput.click();
});

// 处理文件拖放
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#007AFF';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#ddd';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#ddd';
    const files = Array.from(e.dataTransfer.files);
    handleMultipleFiles(files);
});

// 处理文件选择
imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleMultipleFiles(files);
});

// 处理多个文件
function handleMultipleFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            // 检查是否存在重复图片
            const isDuplicate = imagesData.some(item => 
                item.file.name === file.name && 
                item.file.size === file.size
            );
            
            if (isDuplicate) {
                showToast(`图片 "${file.name}" 已存在，请勿重复上传`);
                return;
            }
            
            const imageData = {
                id: Math.floor(Date.now() + Math.random() * 1000),
                file: file,
                originalSize: file.size,
                compressedSize: 0,
                quality: 80
            };
            imagesData.push(imageData);
            createImageItem(imageData);
        }
    });
    
    if (imagesData.length > 0) {
        previewContainer.style.display = 'block';
    }
}

// 创建图片项
function createImageItem(imageData) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'image-item';
    itemDiv.id = `image-${imageData.id}`;
    
    itemDiv.innerHTML = `
        <div class="preview-pair">
            <div class="preview-box" data-label="原图">
                <button class="delete-btn" data-id="${imageData.id}">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <img class="original" alt="原图">
                <div class="size-info">
                    <span>原始大小：</span>
                    <span class="size">${formatFileSize(imageData.originalSize)}</span>
                </div>
            </div>
            <div class="preview-box" data-label="压缩后">
                <img class="compressed" alt="压缩后">
                <div class="size-info">
                    <span>压缩大小：</span>
                    <span class="compressed-size">待压缩</span>
                </div>
            </div>
        </div>
        <div class="controls">
            <label class="quality-label">压缩质量：</label>
            <input type="range" class="quality-slider" value="${imageData.quality}" min="0" max="100">
            <span class="quality-value">${imageData.quality}%</span>
        </div>
        <div class="actions">
            <button class="primary-btn compress-btn">压缩</button>
            <button class="primary-btn download-btn" disabled>下载</button>
        </div>
    `;
    
    // 加载原图预览
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = itemDiv.querySelector('.original');
        img.src = e.target.result;
    };
    reader.readAsDataURL(imageData.file);
    
    // 添加事件监听
    const qualitySlider = itemDiv.querySelector('.quality-slider');
    const qualityValue = itemDiv.querySelector('.quality-value');
    const compressBtn = itemDiv.querySelector('.compress-btn');
    const downloadBtn = itemDiv.querySelector('.download-btn');
    const deleteBtn = itemDiv.querySelector('.preview-box .delete-btn');
    
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value + '%';
        imageData.quality = parseInt(e.target.value);
    });
    
    compressBtn.addEventListener('click', () => {
        compressImage(imageData, itemDiv);
    });
    
    downloadBtn.addEventListener('click', () => {
        downloadCompressedImage(imageData);
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const id = deleteBtn.dataset.id;
        
        itemDiv.remove();
        
        imagesData = imagesData.filter(item => item.id !== Number(id));
        
        if (imagesData.length === 0) {
            previewContainer.style.display = 'none';
            imageInput.value = '';
        }
        
        console.log('删除图片：', id);
        console.log('剩余图片数量：', imagesData.length);
    });
    
    imagesList.appendChild(itemDiv);
}

// 压缩单张图片
function compressImage(imageData, itemDiv) {
    // 显示压缩中状态
    const compressedSizeElement = itemDiv.querySelector('.compressed-size');
    compressedSizeElement.textContent = '压缩中...';
    
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const quality = imageData.quality / 100;
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        const compressedImg = itemDiv.querySelector('.compressed');
        compressedImg.src = compressedDataUrl;
        
        const compressedSize = calculateImageSize(compressedDataUrl);
        imageData.compressedSize = compressedSize;
        const sizeText = formatFileSize(compressedSize);
        
        itemDiv.querySelector('.download-btn').disabled = false;
        
        const compressionRatio = ((imageData.originalSize - compressedSize) / imageData.originalSize * 100).toFixed(1);
        const sizeInfo = itemDiv.querySelector('.compressed-size').parentElement;
        sizeInfo.innerHTML = `
            <span>压缩大小：${sizeText}</span>
            <span>压缩率：${compressionRatio}%</span>
        `;
    };
    
    img.onerror = () => {
        console.error('图片加载失败');
        compressedSizeElement.textContent = '压缩失败';
        imageData.compressedSize = -1; // 标记压缩失败
    };
    
    const reader = new FileReader();
    reader.onload = (e) => img.src = e.target.result;
    reader.onerror = () => {
        console.error('文件读取失败');
        compressedSizeElement.textContent = '文件读取失败';
        imageData.compressedSize = -1; // 标记压缩失败
    };
    reader.readAsDataURL(imageData.file);
}

// 批量操作事件监听
compressAllBtn.addEventListener('click', () => {
    // 获取所有未压缩的图片
    const uncompressedImages = imagesData.filter(imageData => imageData.compressedSize === 0);
    
    if (uncompressedImages.length === 0) {
        showToast('没有需要压缩的图片');
        return;
    }
    
    // 禁用压缩全部按钮，防止重复点击
    compressAllBtn.disabled = true;
    compressAllBtn.textContent = '压缩中...';
    
    // 记录完成的压缩数量
    let completedCount = 0;
    
    uncompressedImages.forEach(imageData => {
        const itemDiv = document.getElementById(`image-${imageData.id}`);
        if (!itemDiv) return;
        
        // 禁用单个压缩按钮
        const compressBtn = itemDiv.querySelector('.compress-btn');
        compressBtn.disabled = true;
        
        compressImage(imageData, itemDiv);
        
        // 监听压缩完成
        const checkCompletion = setInterval(() => {
            if (imageData.compressedSize > 0) {
                clearInterval(checkCompletion);
                completedCount++;
                compressBtn.disabled = false;
                
                // 所有图片压缩完成
                if (completedCount === uncompressedImages.length) {
                    compressAllBtn.disabled = false;
                    compressAllBtn.textContent = '压缩全部';
                    showToast('所有图片压缩完成');
                }
            }
        }, 100);
    });
});

downloadAllBtn.addEventListener('click', () => {
    const compressedImages = imagesData.filter(imageData => imageData.compressedSize > 0);
    
    if (compressedImages.length === 0) {
        showToast('没有可下载的压缩图片');
        return;
    }
    
    // 禁用下载按钮
    downloadAllBtn.disabled = true;
    downloadAllBtn.textContent = '打包中...';
    
    // 创建ZIP文件
    const zip = new JSZip();
    const folder = zip.folder("compressed_images");
    
    // 记录处理完成的图片数量
    let processedCount = 0;
    
    compressedImages.forEach(imageData => {
        const itemDiv = document.getElementById(`image-${imageData.id}`);
        if (!itemDiv) return;
        
        const compressedImg = itemDiv.querySelector('.compressed');
        // 将base64图片数据转换为二进制
        const base64Data = compressedImg.src.split(',')[1];
        
        // 获取文件扩展名
        const extension = imageData.file.name.split('.').pop().toLowerCase();
        const fileName = `compressed-${imageData.file.name}`;
        
        // 添加文件到ZIP
        folder.file(fileName, base64Data, {base64: true});
        
        processedCount++;
        
        // 所有图片都处理完成后，生成并下载ZIP文件
        if (processedCount === compressedImages.length) {
            zip.generateAsync({type: "blob"})
                .then(content => {
                    // 创建下载链接
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = "compressed_images.zip";
                    link.click();
                    
                    // 清理
                    URL.revokeObjectURL(link.href);
                    
                    // 恢复按钮状态
                    downloadAllBtn.disabled = false;
                    downloadAllBtn.textContent = '下载全部';
                    
                    showToast('压缩包下载完成');
                })
                .catch(err => {
                    console.error('ZIP文件生成失败:', err);
                    showToast('下载失败，请重试');
                    
                    // 恢复按钮状态
                    downloadAllBtn.disabled = false;
                    downloadAllBtn.textContent = '下载全部';
                });
        }
    });
});

clearAllBtn.addEventListener('click', () => {
    imagesList.innerHTML = '';
    imagesData = [];
    previewContainer.style.display = 'none';
});

// 下载压缩后的图片
function downloadCompressedImage(imageData) {
    const itemDiv = document.getElementById(`image-${imageData.id}`);
    const compressedImg = itemDiv.querySelector('.compressed');
    const link = document.createElement('a');
    link.download = `compressed-${imageData.file.name}`;
    link.href = compressedImg.src;
    link.click();
}

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 工具函数：计算base64图片大小
function calculateImageSize(base64String) {
    const padding = base64String.endsWith('==') ? 2 : 1;
    return Math.floor((base64String.length * 3) / 4 - padding);
}

// 显示提示信息
function showToast(message) {
    // 检查是否已存在toast元素，如果有则移除
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新的toast元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // 添加到页面
    document.body.appendChild(toast);

    // 添加显示类名触发动画
    setTimeout(() => toast.classList.add('show'), 10);

    // 3秒后移除toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
} 