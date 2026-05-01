/**
 * 志愿服务申请页面JavaScript
 * @author Your Name
 * @version 1.0
 */

// 常量定义
const PAGE_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
    PHOTO_TYPES: ['image/jpeg', 'image/png']
};

// 页面主模块
const VolunteerModule = {
    // 缓存DOM元素
    elements: {
        $form: null,
        $uploadArea: null,
        $uploadInput: null,
        $uploadList: null,
        $uploadPreview: null,
        $uploadDefault: null,
        $photoFrame: null,
        $photoInput: null,
        $photoPreview: null,
        $locationSection: null,
        $mapContainer: null,
        $startTime: null,
        $endTime: null,
        $contact: null
    },

    // 初始化方法
    init() {
        this.cacheElements();
        this.initializeMap();
        this.bindEvents();
        this.initializeValidation();
    },

    // 缓存DOM元素
    cacheElements() {
        const elements = this.elements;
        elements.$form = $('#applicationForm');
        elements.$uploadArea = $('#uploadArea');
        elements.$uploadInput = $('.upload-input');
        elements.$uploadList = $('.upload-list');
        elements.$uploadPreview = $('.upload-preview');
        elements.$uploadDefault = $('.upload-default');
        elements.$photoFrame = $('#photoDropZone');
        elements.$photoInput = $('#photoInput');
        elements.$photoPreview = $('#photoPreview');
        elements.$locationSection = $('#locationSection');
        elements.$mapContainer = $('#container').parent();
        elements.$startTime = $('#startTime');
        elements.$endTime = $('#endTime');
        elements.$contact = $('#contact');
    },

    // 绑定事件
    bindEvents() {
        // 文件上传相关事件
        this.bindFileUploadEvents();
        // 照片上传相关事件
        this.bindPhotoUploadEvents();
        // 表单相关事件
        this.bindFormEvents();
    },

    // 绑定文件上传事件
    bindFileUploadEvents() {
        const { $uploadArea, $uploadInput } = this.elements;

        $uploadArea
            .on('dragover', (e) => {
                e.preventDefault();
                $uploadArea.addClass('dragover');
            })
            .on('dragleave drop', (e) => {
                e.preventDefault();
                $uploadArea.removeClass('dragover');
            });

        $uploadInput.on('change', (e) => this.handleFiles(e.target.files));
    },

    // 绑定照片上传事件
    bindPhotoUploadEvents() {
        const { $photoFrame, $photoInput, $photoPreview } = this.elements;

        // 点击上传 - 修改事件委托方式
        $photoFrame.on('click', '.photo-overlay, .photo-frame:not(.has-photo)', (e) => {
            if ($(e.target).closest('.student-photo').length === 0) {
                $photoInput.trigger('click');
            }
        });

        // 拖拽上传
        $photoFrame
            .on('dragover', (e) => {
                e.preventDefault();
                $photoFrame.addClass('dragover');
            })
            .on('dragleave', (e) => {
                e.preventDefault();
                $photoFrame.removeClass('dragover');
            })
            .on('drop', (e) => {
                e.preventDefault();
                $photoFrame.removeClass('dragover');
                
                const file = e.originalEvent.dataTransfer.files[0];
                if (file) {
                    this.handlePhotoUpload(file);
                }
            });

        // 文件选择变更
        $photoInput.on('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handlePhotoUpload(file);
            }
            // 重置input以允许选择相同文件
            e.target.value = '';
        });
    },

    // 绑定表单事件
    bindFormEvents() {
        const { $form, $startTime, $endTime, $contact } = this.elements;

        // 服务类型切换事件
        $('input[name="servicetype"]').on('change', (e) => this.handleServiceTypeChange(e));

        // 时间验证
        $endTime.on('change', () => this.validateTimeRange());

        // 电话号码验证
        $contact.on('input', () => this.validatePhoneNumber());

        // 表单提交
        $form.on('submit', (e) => this.handleFormSubmit(e));
    },

    // 处理文件上传
    handleFiles(files) {
        if (!files.length) return;

        const { $uploadDefault, $uploadPreview, $uploadList } = this.elements;
        $uploadDefault.hide();
        $uploadPreview.show();

        Array.from(files).forEach(file => {
            const isValid = this.validateFile(file);
            this.addFileToList(file, isValid);
        });
    },

    // 添加文件到列表
    addFileToList(file, isValid) {
        const { $uploadList } = this.elements;
        const status = isValid ? 'success' : 'error';
        const statusText = isValid ? '准备上传' : '文件无效';

        const $item = $(`
            <li class="upload-item">
                <i class="fas ${this.getFileIcon(file.name)} upload-item-icon"></i>
                <span class="upload-item-name">${file.name}</span>
                <span class="upload-item-size">${this.formatFileSize(file.size)}</span>
                <span class="upload-item-status ${status}">${statusText}</span>
                <div class="upload-item-actions">
                    <i class="fas fa-times" title="移除"></i>
                </div>
            </li>
        `);

        $item.find('.fa-times').on('click', () => this.removeFileFromList($item));
        $uploadList.append($item);
    },

    // 从列表中移除文件
    removeFileFromList($item) {
        const { $uploadList, $uploadPreview, $uploadDefault } = this.elements;
        $item.remove();
        if ($uploadList.children().length === 0) {
            $uploadPreview.hide();
            $uploadDefault.show();
        }
    },

    // 处理照片上传
    handlePhotoUpload(file) {
        if (!file) {
            return;
        }

        // 检查文件类型
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            Utils.showMessage('请上传图片文件（jpg、jpeg、png格式）', 'error');
            return;
        }

        // 检查文件大小（限制为2MB）
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            Utils.showMessage('图片大小不能超过2MB', 'error');
            return;
        }

        // 预览图片
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // 检查图片尺寸是否符合一寸证件照要求（413x531像素）
                // 允许一定的误差范围（±50像素）
                const isValidSize = 
                    (Math.abs(img.width - 413) <= 50) && 
                    (Math.abs(img.height - 531) <= 50);

                if (!isValidSize) {
                    Utils.showMessage('请上传标准一寸证件照（建议尺寸413x531像素）', 'warning');
                }

                // 更新预览图片和状态
                const { $photoFrame, $photoPreview } = this.elements;
                $photoPreview
                    .attr('src', e.target.result)
                    .removeClass('d-none');
                
                $photoFrame
                    .addClass('has-photo')
                    .find('.photo-overlay')
                    .css('opacity', '0');

                // 悬停时显示更换提示
                $photoFrame.hover(
                    function() {
                        $(this).find('.photo-overlay')
                            .css('opacity', '1')
                            .find('p')
                            .text('点击更换照片');
                    },
                    function() {
                        $(this).find('.photo-overlay')
                            .css('opacity', '0');
                    }
                );
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            Utils.showMessage('图片读取失败，请重试', 'error');
        };
        reader.readAsDataURL(file);
    },

    // 处理服务类型变更
    handleServiceTypeChange(e) {
        const { $locationSection, $mapContainer } = this.elements;
        const isOffline = e.target.value === 'offline';
        
        $locationSection.toggle(isOffline);
        $mapContainer.toggle(isOffline);
        $('#location').prop('required', isOffline);
    },

    // 验证文件
    validateFile(file) {
        return PAGE_CONFIG.ALLOWED_FILE_TYPES.includes(file.type) && 
               file.size <= PAGE_CONFIG.MAX_FILE_SIZE;
    },

    // 验证时间范围
    validateTimeRange() {
        const { $startTime, $endTime } = this.elements;
        const startValue = $startTime.val();
        const endValue = $endTime.val();

        if (startValue && endValue && endValue < startValue) {
            $endTime[0].setCustomValidity('结束时间不能早于开始时间');
        } else {
            $endTime[0].setCustomValidity('');
        }
    },

    // 验证手机号
    validatePhoneNumber() {
        const { $contact } = this.elements;
        const phoneRegex = /^1[3-9]\d{9}$/;
        
        if (!phoneRegex.test($contact.val())) {
            $contact[0].setCustomValidity('请输入有效的手机号码');
        } else {
            $contact[0].setCustomValidity('');
        }
    },

    // 处理表单提交
    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.elements.$form[0].checkValidity()) {
            e.stopPropagation();
            this.elements.$form.addClass('was-validated');
            return;
        }

        // TODO: 实现表单提交逻辑
        this.submitForm();
    },

    // 提交表单
    submitForm() {
        const formData = new FormData(this.elements.$form[0]);
        
        $.ajax({
            url: 'volunteer_success.jsp',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => {
                Utils.showMessage('申请提交成功！', 'success');
                setTimeout(() => {
                    window.location.href = 'volunteer_success.jsp';
                }, 1500);
            },
            error: (xhr, status, error) => {
                Utils.showMessage('提交失败，请稍后重试', 'error');
                console.error('[VolunteerModule]', error);
            }
        });
    },

    // 获取文件图标
    getFileIcon(filename) {
        if (/\.(jpg|jpeg|png)$/i.test(filename)) return 'fa-file-image';
        if (/\.pdf$/i.test(filename)) return 'fa-file-pdf';
        return 'fa-file';
    },

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 初始化地图
    initializeMap() {
        // 高德地图初始化代码
        if (typeof AMap !== 'undefined') {
            this.map = new AMap.Map('container', {
                zoom: 11
            });

            this.map.on('complete', () => {
                console.log('地图加载完成！');
            });
        }
    },

    // 初始化表单验证
    initializeValidation() {
        const forms = document.getElementsByClassName('needs-validation');
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }
};

// 工具类
const Utils = {
    showMessage(message, type = 'info') {
        const $alert = $(`
            <div class="alert alert-${type} alert-float alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `);

        $('body').append($alert);
        setTimeout(() => $alert.alert('close'), 3000);
    }
};

// 页面加载完成后初始化
$(document).ready(() => {
    VolunteerModule.init();
}); 