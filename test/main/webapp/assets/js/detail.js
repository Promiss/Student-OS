/**
 * detail.js
 * 详情页面的主要业务逻辑
 */

// 常量声明
const DetailConfig = {
    ANIMATION_DELAY: 50,
    SEARCH_DELAY: 300,
    MAX_NESTING_DEPTH: 3
};

// 主题与功能映射
const ThemeMapping = {
    'teaching': ['教务系统', '认证考试报名申请', '图书借阅'],
    'life': ['外校人员入校申请', '教室维修申请', '寝室维修申请'],
    'education': ['学生证申请', '应征入伍申请', '校外住宿申请', '荣誉称号申请', '违纪处分办理', '学生活动申请', '志愿服务申请'],
    'aid': ['勤工助学申请', '家庭经济困难申请', '奖助学金申请', '心理咨询预约'],
    'career': ['AI智能简历', '网上签约', '毕业去向登记', '职业生涯咨询预约', '职位化精准推送', '校园招聘信息查询', '大学生创业申请']
};

// 部门与功能映射
const DepartmentMapping = {
    '教务处': ['教务系统', '认证考试报名申请'],
    '招生就业处': ['AI智能简历', '网上签约', '毕业去向登记', '职业生涯咨询预约', '职位化精准推送', '校园招聘信息查询', '大学生创业申请'],
    '学生工作部': ['学生证申请', '应征入伍申请', '校外住宿申请', '荣誉称号申请', '违纪处分办理', '勤工助学申请', '家庭经济困难申请', '奖助学金申请', '心理咨询预约', '学生活动申请', '志愿服务申请'],
    '保卫处': ['外校人员入校申请'],
    '图书馆': ['图书借阅'],
    '总务处': ['教室维修申请', '寝室维修申请']
};

// 详情页面模块
const DetailModule = {
    // 缓存DOM元素
    $elements: {},
    
    // 状态数据
    state: {
        currentType: 'theme',
        currentCategory: 'all',
        searchTimer: null,
        isSearching: false
    },

    /**
     * 初始化模块
     */
    init() {
        this.cacheElements();
        this.initializeState();
        this.bindEvents();
        this.handleUrlParams();
        this.updateCategoryCount();
    },

    /**
     * 缓存常用DOM元素
     */
    cacheElements() {
        this.$elements = {
            tabs: $('.detail-tab'),
            themeMenu: $('#themeMenu'),
            departmentMenu: $('#departmentMenu'),
            menuItems: $('.detail-menu-item'),
            subMenuItems: $('.detail-submenu-item'),
            breadcrumb: $('.detail-breadcrumb'),
            searchInput: $('#searchInput'),
            blocks: $('.detail-block'),
            blockLinks: $('.detail-block-link'),
            submenus: $('.detail-submenu')
        };
    },

    /**
     * 初始化状态
     */
    initializeState() {
        this.$elements.submenus.hide();
        this.$elements.departmentMenu.hide();
        this.addEmptySearchTip();
    },

    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 标签切换事件
        this.$elements.tabs.on('click', (e) => this.handleTabClick($(e.currentTarget)));
        
        // 菜单项点击事件
        this.$elements.menuItems.on('click', (e) => this.handleMenuItemClick($(e.currentTarget)));
        
        // 子菜单项点击事件
        this.$elements.subMenuItems.on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleSubMenuItemClick($(e.currentTarget));
        });

        // 搜索输入事件
        this.$elements.searchInput.on('input', (e) => this.handleSearch($(e.currentTarget)));

        // 功能块交互效果
        this.bindBlockInteractions();
    },

    /**
     * 绑定功能块交互效果
     */
    bindBlockInteractions() {
        this.$elements.blockLinks.each((_, link) => {
            const $link = $(link);
            $link.on('mouseenter', () => {
                $link.closest('.detail-block').addClass('detail-block-hover');
            }).on('mouseleave', () => {
                $link.closest('.detail-block').removeClass('detail-block-hover');
            }).on('click', (e) => this.addRippleEffect(e, $link));
        });
    },

    /**
     * 处理标签点击
     * @param {jQuery} $tab 被点击的标签元素
     */
    handleTabClick($tab) {
        const type = $tab.data('type');
        this.state.currentType = type;

        this.$elements.tabs.removeClass('active');
        $tab.addClass('active');

        this.resetMenuState();
        this.switchMenu(type);
        this.updateUrl({ type });
    },

    /**
     * 处理菜单项点击
     * @param {jQuery} $item 被点击的菜单项
     */
    handleMenuItemClick($item) {
        if ($item.hasClass('disabled')) return;

        const category = $item.data('category');
        this.state.currentCategory = category;

        this.$elements.menuItems.removeClass('active');
        $item.addClass('active');

        if (category === 'all') {
            this.$elements.submenus.slideUp(300);
            this.showAllFunctionBlocks();
        } else {
            this.toggleSubmenu($item);
        }

        this.updateBreadcrumb($item);
    },

    /**
     * 处理子菜单项点击
     * @param {jQuery} $item 被点击的子菜单项
     */
    handleSubMenuItemClick($item) {
        const isDepartment = $item.closest('#departmentMenu').length > 0;
        const parentText = $item.closest('.detail-menu-item').clone()
            .children().remove().end().text().trim();

        this.$elements.subMenuItems.removeClass('active');
        $item.addClass('active');

        if (isDepartment) {
            this.filterFunctionBlocks([parentText], true);
        } else {
            this.filterFunctionBlocks([$item.data('category')], false);
        }

        this.updateBreadcrumb($item);
    },

    /**
     * 处理搜索输入
     * @param {jQuery} $input 搜索输入框元素
     */
    handleSearch($input) {
        clearTimeout(this.state.searchTimer);
        $input.addClass('searching');

        this.state.searchTimer = setTimeout(() => {
            const searchText = $input.val().toLowerCase();
            this.performSearch(searchText);
            $input.removeClass('searching');
        }, DetailConfig.SEARCH_DELAY);
    },

    /**
     * 执行搜索
     * @param {string} searchText 搜索文本
     */
    performSearch(searchText) {
        if (!searchText) {
            this.$elements.blocks.removeClass('search-hide search-show');
            $('.detail-search-empty').removeClass('show');
            this.showAllFunctionBlocks();
            return;
        }

        let hasResults = false;
        this.$elements.blocks.addClass('search-hide').removeClass('search-show');

        this.$elements.blocks.each((index, block) => {
            const $block = $(block);
            const title = $block.find('.detail-block-title').text().toLowerCase();
            const desc = $block.find('.detail-block-desc').text().toLowerCase();
            const category = $block.data('category');
            const categoryText = this.getCategoryText(category);

            if (title.includes(searchText) || 
                desc.includes(searchText) || 
                categoryText.includes(searchText)) {
                hasResults = true;
                setTimeout(() => {
                    $block.removeClass('search-hide').addClass('search-show');
                }, index * DetailConfig.ANIMATION_DELAY);
            }
        });

        $('.detail-search-empty').toggleClass('show', !hasResults);
    },

    /**
     * 添加水波纹效果
     * @param {Event} e 点击事件对象
     * @param {jQuery} $element 目标元素
     */
    addRippleEffect(e, $element) {
        const x = e.pageX - $element.offset().left;
        const y = e.pageY - $element.offset().top;

        const $ripple = $('<span class="ripple"></span>').appendTo($element);
        $ripple.css({
            left: x + 'px',
            top: y + 'px'
        });

        setTimeout(() => {
            $ripple.remove();
        }, 600);
    },

    /**
     * 切换菜单显示
     * @param {string} type 菜单类型
     */
    switchMenu(type) {
        if (type === 'theme') {
            this.$elements.departmentMenu.hide();
            this.$elements.themeMenu.fadeIn(300);
            const $firstItem = this.$elements.themeMenu.find('.detail-menu-item[data-category="all"]');
            $firstItem.addClass('active');
            this.updateBreadcrumb($firstItem);
            this.filterFunctionBlocks();
        } else {
            this.$elements.themeMenu.hide();
            this.$elements.departmentMenu.fadeIn(300);
            const $firstItem = this.$elements.departmentMenu.find('.detail-menu-item[data-category="all"]');
            $firstItem.addClass('active');
            this.updateBreadcrumb($firstItem);
            this.filterFunctionBlocks();
        }
    },

    /**
     * 重置菜单状态
     */
    resetMenuState() {
        this.$elements.menuItems.removeClass('active');
        this.$elements.subMenuItems.removeClass('active');
        this.$elements.submenus.hide();
    },

    /**
     * 切换子菜单显示状态
     * @param {jQuery} $item 菜单项元素
     */
    toggleSubmenu($item) {
        const $submenu = $item.find('.detail-submenu');
        if ($submenu.length) {
            this.$elements.submenus.not($submenu).slideUp(300);
            $submenu.slideToggle(300);

            if ($submenu.is(':visible')) {
                const text = $item.clone().children().remove().end().text().trim();
                this.filterFunctionBlocks([text], this.state.currentType === 'department');
            }
        }
    },

    /**
     * 更新面包屑导航
     * @param {jQuery} $item 当前选中的菜单项
     */
    updateBreadcrumb($item) {
        const type = this.$elements.tabs.filter('.active').text();
        let html = `<span class="detail-breadcrumb-item">${type}</span>`;

        if ($item.hasClass('detail-submenu-item')) {
            const parent = $item.closest('.detail-menu-item').clone()
                .children().remove().end().text().trim();
            const current = $item.text().trim();
            html += `<span class="detail-breadcrumb-item">${parent}</span>`;
            html += `<span class="detail-breadcrumb-item">${current}</span>`;
        } else if ($item.hasClass('detail-menu-item')) {
            const current = $item.clone().children().remove().end().text().trim();
            html += `<span class="detail-breadcrumb-item">${current}</span>`;
        }

        this.$elements.breadcrumb.html(html);
    },

    /**
     * 处理URL参数
     */
    handleUrlParams() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category');
            const type = urlParams.get('type');
            const dept = urlParams.get('dept');

            // 默认显示主题视图
            if (!type || (type !== 'theme' && type !== 'department')) {
                this.switchToThemeView();
                const $firstItem = this.$elements.themeMenu.find('.detail-menu-item[data-category="all"]');
                $firstItem.addClass('active');
                this.updateBreadcrumb($firstItem);
                this.showAllFunctionBlocks();
                return;
            }

            if (type === 'theme') {
                this.switchToThemeView();
                if (category) {
                    // 不显示所有功能块，直接处理分类
                    this.handleCategoryParam(category);
                } else {
                    const $firstItem = this.$elements.themeMenu.find('.detail-menu-item[data-category="all"]');
                    $firstItem.addClass('active');
                    this.updateBreadcrumb($firstItem);
                    this.showAllFunctionBlocks();
                }
            } else if (type === 'department') {
                this.switchToDepartmentView();
                if (dept) {
                    // 不显示所有功能块，直接处理部门
                    this.handleDepartmentParam(dept);
                } else {
                    const $firstItem = this.$elements.departmentMenu.find('.detail-menu-item[data-category="all"]');
                    $firstItem.addClass('active');
                    this.updateBreadcrumb($firstItem);
                    this.showAllFunctionBlocks();
                }
            }
        } catch (error) {
            console.error('处理URL参数时出错:', error);
            this.switchToThemeView();
            const $firstItem = this.$elements.themeMenu.find('.detail-menu-item[data-category="all"]');
            $firstItem.addClass('active');
            this.updateBreadcrumb($firstItem);
            this.showAllFunctionBlocks();
        }
    },

    /**
     * 切换到主题视图
     */
    switchToThemeView() {
        this.$elements.tabs.filter('[data-type="theme"]').addClass('active');
        this.$elements.tabs.filter('[data-type="department"]').removeClass('active');
        this.$elements.departmentMenu.hide();
        this.$elements.themeMenu.show();
    },

    /**
     * 切换到部门视图
     */
    switchToDepartmentView() {
        this.$elements.tabs.filter('[data-type="department"]').addClass('active');
        this.$elements.tabs.filter('[data-type="theme"]').removeClass('active');
        this.$elements.themeMenu.hide();
        this.$elements.departmentMenu.show();
    },

    /**
     * 处理分类参数
     * @param {string} category 分类名称
     */
    handleCategoryParam(category) {
        if (!ThemeMapping[category]) {
            console.warn('无效的分类参数:', category);
            return;
        }

        // 更新菜单状态
        const categoryText = this.getCategoryText(category);
        const $menuItem = this.$elements.themeMenu.find('.detail-menu-item').filter(function() {
            const menuText = $(this).clone().children().remove().end().text().trim();
            return menuText.includes(categoryText);
        });

        if ($menuItem.length) {
            // 更新菜单状态
            this.$elements.menuItems.removeClass('active');
            $menuItem.addClass('active');
            
            // 显示子菜单
            this.$elements.submenus.hide();
            const $submenu = $menuItem.find('.detail-submenu');
            if ($submenu.length) {
                $submenu.show();
            }

            // 更新面包屑
            this.updateBreadcrumb($menuItem);

            // 过滤功能块
            this.$elements.blocks.hide().removeClass('detail-block-animate');
            const titles = ThemeMapping[category];
            this.showFilteredBlocks(titles);
        }
    },

    /**
     * 处理部门参数
     * @param {string} dept 部门名称
     */
    handleDepartmentParam(dept) {
        if (!DepartmentMapping[dept]) {
            console.warn('无效的部门参数:', dept);
            return;
        }

        // 更新菜单状态
        const $menuItem = this.$elements.departmentMenu.find('.detail-menu-item').filter(function() {
            const menuText = $(this).clone().children().remove().end().text().trim();
            return menuText.includes(dept);
        });

        if ($menuItem.length) {
            // 更新菜单状态
            this.$elements.menuItems.removeClass('active');
            $menuItem.addClass('active');
            
            // 显示子菜单
            this.$elements.submenus.hide();
            const $submenu = $menuItem.find('.detail-submenu');
            if ($submenu.length) {
                $submenu.show();
            }

            // 更新面包屑
            this.updateBreadcrumb($menuItem);

            // 过滤功能块
            this.$elements.blocks.hide().removeClass('detail-block-animate');
            const titles = DepartmentMapping[dept];
            this.showFilteredBlocks(titles);
        }
    },

    /**
     * 更新分类计数
     */
    updateCategoryCount() {
        const totalBlocks = this.$elements.blocks.length;
        $('[data-category="all"] .detail-badge').text(totalBlocks);

        // 更新主题菜单计数
        Object.keys(ThemeMapping).forEach(category => {
            const count = ThemeMapping[category].length;
            $(`#themeMenu .detail-menu-item:contains("${this.getCategoryText(category)}")`).find('.detail-badge').text(count);
        });

        // 更新部门菜单计数
        Object.keys(DepartmentMapping).forEach(dept => {
            const count = DepartmentMapping[dept].length;
            $(`#departmentMenu .detail-menu-item:contains("${dept}")`).find('.detail-badge').text(count);
        });
    },

    /**
     * 获取分类中文名称
     * @param {string} category 分类代码
     * @returns {string} 分类中文名称
     */
    getCategoryText(category) {
        const categoryMap = {
            'teaching': '教学服务',
            'life': '生活服务',
            'education': '育人服务',
            'aid': '资助服务',
            'career': '发展服务'
        };
        return categoryMap[category] || '';
    },

    /**
     * 显示所有功能块
     */
    showAllFunctionBlocks() {
        this.$elements.blocks.each((index, block) => {
            setTimeout(() => {
                $(block).fadeIn().addClass('detail-block-animate');
            }, index * DetailConfig.ANIMATION_DELAY);
        });
    },

    /**
     * 过滤功能块
     * @param {Array} categories 分类列表
     * @param {boolean} isDepartment 是否按部门过滤
     */
    filterFunctionBlocks(categories, isDepartment = false) {
        if (!categories || categories.length === 0) {
            this.showAllFunctionBlocks();
            return;
        }

        this.$elements.blocks.hide().removeClass('detail-block-animate');
        let titles = [];

        if (isDepartment) {
            categories.forEach(dept => {
                if (DepartmentMapping[dept]) {
                    titles = titles.concat(DepartmentMapping[dept]);
                }
            });
        } else {
            categories.forEach(category => {
                // 如果是主题名称而不是分类代码，需要查找对应的分类
                if (ThemeMapping[category]) {
                    titles = titles.concat(ThemeMapping[category]);
                } else {
                    // 尝试通过主题名称查找分类
                    const foundCategory = Object.keys(ThemeMapping).find(key => 
                        this.getCategoryText(key) === category.trim()
                    );
                    if (foundCategory) {
                        titles = titles.concat(ThemeMapping[foundCategory]);
                    }
                }
            });
        }

        if (titles.length > 0) {
            this.showFilteredBlocks(titles);
        } else {
            console.warn('未找到匹配的功能块');
            this.showAllFunctionBlocks();
        }
    },

    /**
     * 显示筛选后的功能块
     * @param {Array} titles 标题列表
     */
    showFilteredBlocks(titles) {
        if (!Array.isArray(titles)) {
            console.warn('无效的标题列表:', titles);
            return;
        }

        let hasVisibleBlocks = false;
        this.$elements.blocks.each((index, block) => {
            const $block = $(block);
            const blockTitle = $block.find('.detail-block-title').text().trim();
            
            if (titles.includes(blockTitle)) {
                hasVisibleBlocks = true;
                setTimeout(() => {
                    $block.fadeIn().addClass('detail-block-animate');
                }, index * DetailConfig.ANIMATION_DELAY);
            }
        });

        // 如果没有找到匹配的功能块，显示所有功能块
        if (!hasVisibleBlocks) {
            console.warn('未找到匹配的功能块，显示所有功能块');
            this.showAllFunctionBlocks();
        }
    },

    /**
     * 更新URL参数
     * @param {Object} params 参数对象
     */
    updateUrl(params) {
        const urlParams = new URLSearchParams(window.location.search);
        Object.entries(params).forEach(([key, value]) => {
            urlParams.set(key, value);
        });
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
    },

    /**
     * 添加空搜索提示
     */
    addEmptySearchTip() {
        $('.detail-search').after(`
            <div class="detail-search-empty">
                <i class="fas fa-search"></i>
                <p>未找到相关功能，请尝试其他关键词</p>
            </div>
        `);
    }
};

// 页面加载完成后初始化
$(document).ready(() => {
    DetailModule.init();
}); 