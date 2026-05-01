<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
%>
<!DOCTYPE html>
<html>
	<head>
		<base href="<%=basePath%>">
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<meta name="description"
			content="Probably the most complete UI kit out there. Multiple functionalities and controls added,  extended color palette and beautiful typography, designed as its own extended version of Bootstrap at  the highest level of quality.                             ">
		<meta name="author" content="Webpixels">
		<title>"一站式"学生社区综合服务平台（试运行）</title>
		<!-- Fonts -->
		<link href="https://fonts.googleapis.com/css?family=Nunito:400,600,700,800|Roboto:400,500,700" rel="stylesheet">
		<!-- Theme CSS -->
		<link type="text/css" href="${pageContext.request.contextPath}/assets/css/theme.css" rel="stylesheet">
		<!-- Demo CSS - No need to use these in your project -->
		<link type="text/css" href="${pageContext.request.contextPath}/assets/css/demo.css" rel="stylesheet">
		<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/login.css">
		<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/detail.css">
	</head>
	<body>
		<div id="app">
			<nav class="navbar navbar-expand-lg navbar-transparent navbar-dark py-4">
				<div class="container">
					<a class="navbar-brand" href="#"><img src="${pageContext.request.contextPath}/assets/images/backgrounds/logo.png" width="80%">
						<!-- <strong>"一站式"学生服务信息平台</strong>（试运行） --></a>
					<button class="navbar-toggler" type="button" data-action="offcanvas-open" data-target="#navbar_main"
						aria-controls="navbar_main" aria-expanded="false" aria-label="Toggle navigation">
						<span class="navbar-toggler-icon"></span>
					</button>
					<div class="navbar-collapse offcanvas-collapse" id="navbar_main">
						<ul class="navbar-nav ml-auto align-items-lg-center">
							<li class="nav-item">
								<a class="nav-link" href="http://www.hngzy.edu.cn/">学院主页</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" href="../main.html">系统应用</a>
							</li>
							<li class="nav-item active">
								<a class="nav-link" href="#">流程服务</a>
							</li>
							<li class="nav-item">
								<a class="nav-link" href="index.jsp?choice=4">数据中心</a>
							</li>
							<li  class="nav-item">
								<div class="dropdown">
									<button class="btn btn-primary btn-icon-only rounded-circle" type="button" id="dropdown_user_account" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
										<!-- <span class="btn-inner--icon">
											<i class="fas fa-user"></i>
										</span>  -->
										<img src="${pageContext.request.contextPath}/assets/images/avatars/user.jpg" class="avatar avatar-lg mr-3" style="width: 50px; height: 50px;">
									</button>
									<div class="dropdown-menu" aria-labelledby="dropdown_user_account" >
										<h6 class="dropdown-header">我是学号</h6>
										<a class="dropdown-item" href="#">
											<span class="float-right badge badge-primary">4</span>
											<i class="fas fa-envelope text-primary"></i>系统消息
										</a>
										<a class="dropdown-item" href="#">
											<i class="fas fa-cog text-primary"></i>个人资料
										</a>
										<div class="dropdown-divider" role="presentation"></div>
										<a class="dropdown-item" href="#">
											<i class="fas fa-sign-out-alt text-primary"></i>退出登录
										</a>
									</div>
								</div>
							</li>
						</ul>
					</div>
				</div>
			</nav>
			<!-- 轮播图 -->
			<div class="banner-carousel">
				<div id="carouselExample" class="carousel slide" data-ride="carousel">
					<!-- 添加轮播指示器 -->
					<ol class="carousel-indicators">
						<li data-target="#carouselExample" data-slide-to="0" class="active"></li>
						<li data-target="#carouselExample" data-slide-to="1" class="active"></li>
						
					</ol>

					<div class="carousel-inner">
						<div class="carousel-item active">
							<img src="${pageContext.request.contextPath}/assets/images/brand/banner1.jpg" alt="Banner 1">
							<!-- 修改文字内容结构 -->
							<div class="text-overlay">
								<div class="text-center">
									<img src="${pageContext.request.contextPath}/assets/images/brand/icon.png" style="width: 200px;"
										class="img-fluid animated" data-animation-in="jackInTheBox"
										data-animation-delay="1000">
									<h2 class="heading display-4 font-weight-400 text-white mt-5 animated"
										data-animation-in="fadeInUp" data-animation-delay="2000">
										<span class="font-weight-600">"一站式"学生社区综合服务平台</span>V0.5（试运行）
									</h2>
									<p class="lead text-white mt-3 lh-180 c-white animated" data-animation-in="fadeInUp" data-animation-delay="2500">
										One-Stop Student Community Comprehensive Service Platform V0.5 (Pilot Run)
									</p>
								</div>
							</div>
						</div>
						<div class="carousel-item">
							<img src="http://www.hngzy.edu.cn/images/banner.png" alt="Banner 2">
							<!-- 修改文字内容结构 -->
							<div class="text-overlay">
								<div class="text-center">
									<img src="${pageContext.request.contextPath}/assets/images/brand/icon.png" style="width: 200px;"
										class="img-fluid animated" data-animation-in="jackInTheBox"
										data-animation-delay="1000">
									<h2 class="heading display-4 font-weight-400 text-white mt-5 animated"
										data-animation-in="fadeInUp" data-animation-delay="2000">
										<span class="font-weight-600">"一站式"学生社区综合服务平台</span>V0.5（试运行）
									</h2>
									<p class="lead text-white mt-3 lh-180 c-white animated" data-animation-in="fadeInUp" data-animation-delay="2500">
										One-Stop Student Community Comprehensive Service Platform V0.5 (Pilot Run)
									</p>
								</div>
							</div>
						</div>
					</div>
					<a class="carousel-control-prev" href="#carouselExample" role="button" data-slide="prev">
						<span class="carousel-control-prev-icon" aria-hidden="true"></span>
						<span class="sr-only">Previous</span>
					</a>
					<a class="carousel-control-next" href="#carouselExample" role="button" data-slide="next">
						<span class="carousel-control-next-icon" aria-hidden="true"></span>
						<span class="sr-only">Next</span>
					</a>
				</div>
			</div>
		</div>
		<!-- 轮播图结束 -->
		<main class="detail-container">
			<!-- 左侧导航栏 -->
			<div class="detail-sidebar">
				<!-- 导航标签切换 -->
				<div class="detail-tabs">
					<div class="detail-tab active" data-type="theme">按主题</div>
					<div class="detail-tab" data-type="department">按部门</div>
				</div>

				<!-- 主题导航菜单 -->
				<div class="detail-menu" id="themeMenu">
					<div class="detail-menu-item active" data-category="all">
						全部事项 <span class="detail-badge">24</span>
					</div>
					<div class="detail-menu-item">
						教学服务 <span class="detail-badge">3</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="teaching">教务系统</div>
							<div class="detail-submenu-item" data-category="teaching">认证考试报名申请</div>
							<div class="detail-submenu-item" data-category="teaching">图书借阅</div>
						</div>
					</div>
					<div class="detail-menu-item">
						生活服务 <span class="detail-badge">3</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="life">外校人员入校申请</div>
							<div class="detail-submenu-item" data-category="life">教室维修申请</div>
							<div class="detail-submenu-item" data-category="life">寝室维修申请</div>
						</div>
					</div>
					<div class="detail-menu-item">
						育人服务 <span class="detail-badge">7</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="education">学生证申请</div>
							<div class="detail-submenu-item" data-category="education">应征入伍申请</div>
							<div class="detail-submenu-item" data-category="education">校外住宿申请</div>
							<div class="detail-submenu-item" data-category="education">荣誉称号申请</div>
							<div class="detail-submenu-item" data-category="education">违纪处分办理</div>
							<div class="detail-submenu-item" data-category="education">学生活动申请</div>
							<div class="detail-submenu-item" data-category="education">志愿服务申请</div>
						</div>
					</div>
					<div class="detail-menu-item">
						资助服务 <span class="detail-badge">4</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="aid">勤工助学申请</div>
							<div class="detail-submenu-item" data-category="aid">家庭经济困难申请</div>
							<div class="detail-submenu-item" data-category="aid">奖助学金申请</div>
							<div class="detail-submenu-item" data-category="aid">心理咨询预约</div>
						</div>
					</div>
					<div class="detail-menu-item">
						发展服务 <span class="detail-badge">7</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="career">AI智能简历</div>
							<div class="detail-submenu-item" data-category="career">网上签约</div>
							<div class="detail-submenu-item" data-category="career">毕业去向登记</div>
							<div class="detail-submenu-item" data-category="career">职业生涯咨询预约</div>
							<div class="detail-submenu-item" data-category="career">职位化精准推送</div>
							<div class="detail-submenu-item" data-category="career">校园招聘信息查询</div>
							<div class="detail-submenu-item" data-category="career">大学生创业申请</div>
						</div>
					</div>
				</div>

				<!-- 部门导航菜单 -->
				<div class="detail-menu" id="departmentMenu" style="display: none;">
					<div class="detail-menu-item active" data-category="all">
						全部事项 <span class="detail-badge">24</span>
					</div>
					<div class="detail-menu-item">
						教务处 <span class="detail-badge">2</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="teaching">教务系统</div>
							<div class="detail-submenu-item" data-category="teaching">认证考试报名申请</div>
						</div>
					</div>
					<div class="detail-menu-item">
						招生就业处 <span class="detail-badge">7</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="career">AI智能简历</div>
							<div class="detail-submenu-item" data-category="career">网上签约</div>
							<div class="detail-submenu-item" data-category="career">毕业去向登记</div>
							<div class="detail-submenu-item" data-category="career">职业生涯咨询预约</div>
							<div class="detail-submenu-item" data-category="career">职位化精准推送</div>
							<div class="detail-submenu-item" data-category="career">校园招聘信息查询</div>
							<div class="detail-submenu-item" data-category="career">大学生创业申请</div>
						</div>
					</div>
					<div class="detail-menu-item">
						学生工作部 <span class="detail-badge">11</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="education">学生证申请</div>
							<div class="detail-submenu-item" data-category="education">应征入伍申请</div>
							<div class="detail-submenu-item" data-category="education">校外住宿申请</div>
							<div class="detail-submenu-item" data-category="education">荣誉称号申请</div>
							<div class="detail-submenu-item" data-category="education">违纪处分办理</div>
							<div class="detail-submenu-item" data-category="aid">勤工助学申请</div>
							<div class="detail-submenu-item" data-category="aid">家庭经济困难申请</div>
							<div class="detail-submenu-item" data-category="aid">奖助学金申请</div>
							<div class="detail-submenu-item" data-category="aid">心理咨询预约</div>
							<div class="detail-submenu-item" data-category="education">学生活动申请</div>
							<div class="detail-submenu-item" data-category="education">志愿服务申请</div>
						</div>
					</div>
					<div class="detail-menu-item">
						保卫处 <span class="detail-badge">1</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="life">外校人员入校申请</div>
						</div>
					</div>
					<div class="detail-menu-item">
						图书馆 <span class="detail-badge">1</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="teaching">图书借阅</div>
						</div>
					</div>
					<div class="detail-menu-item">
						总务处 <span class="detail-badge">2</span>
						<div class="detail-submenu">
							<div class="detail-submenu-item" data-category="life">教室维修申请</div>
							<div class="detail-submenu-item" data-category="life">寝室维修申请</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 右侧内容区 -->
			<div class="detail-content">
				<!-- 面包屑导航 -->
				<div class="detail-breadcrumb">
					<span class="detail-breadcrumb-item">按主题</span>
					<span class="detail-breadcrumb-item">全部事项</span>
				</div>

				<!-- 添加搜索框 -->
				<div class="detail-search">
					<input type="text" id="searchInput" class="detail-search-input" placeholder="搜索功能...">
					<i class="fas fa-search detail-search-icon"></i>
				</div>

				<!-- 添加加载状态和错误处理组件 -->
				<div class="detail-loading" style="display: none;">
					<div class="detail-loading-spinner"></div>
					<span>加载中...</span>
				</div>

				<div class="detail-error" style="display: none;">
					<i class="fas fa-exclamation-circle"></i>
					<span>加载失败，请稍后重试</span>
					<button class="detail-error-retry">重试</button>
				</div>

				<!-- 功能块网格 -->
				<div class="detail-grid">
					<!-- 教学服务功能块 -->
					<div class="detail-block" data-category="teaching">
						<img src="${pageContext.request.contextPath}/assets/images/icons/education.png" class="detail-block-icon" alt="教务系统">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">教务系统</h5>
								<p class="detail-block-desc">学生教务管理系统入口</p>
							</div>
							<div class="detail-block-actions">
								<a href="https://hljswkj.jw.chaoxing.com/admin/login" class="detail-block-link">
									立即进入
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="teaching">
						<img src="${pageContext.request.contextPath}/assets/images/icons/exam.png" class="detail-block-icon" alt="认证考试">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">认证考试报名申请</h5>
								<p class="detail-block-desc">各类认证考试报名与管理服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=teaching&id=2" class="detail-block-link">
									立即报名
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="teaching">
						<img src="${pageContext.request.contextPath}/assets/images/icons/library.png" class="detail-block-icon" alt="图书借阅">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">图书借阅</h5>
								<p class="detail-block-desc">图书馆借阅服务与资源查询</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=teaching&id=22" class="detail-block-link">
									立即借阅
								</a>
							</div>
						</div>
					</div>

					<!-- 发展服务功能块 -->
					<div class="detail-block" data-category="career">
						<img src="${pageContext.request.contextPath}/assets/images/icons/resume.png" class="detail-block-icon" alt="AI智能简历">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">AI智能简历</h5>
								<p class="detail-block-desc">智能简历制作与优化服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=career&id=3" class="detail-block-link">
									开始制作
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="career">
						<img src="${pageContext.request.contextPath}/assets/images/icons/contract.png" class="detail-block-icon" alt="网上签约">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">网上签约</h5>
								<p class="detail-block-desc">在线签署就业协议与合同服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=career&id=4" class="detail-block-link">
									立即签约
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="career">
						<img src="${pageContext.request.contextPath}/assets/images/icons/graduation.png" class="detail-block-icon" alt="毕业去向">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">毕业去向登记</h5>
								<p class="detail-block-desc">毕业生就业信息统计与登记</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=career&id=5" class="detail-block-link">
									立即登记
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="career">
						<img src="${pageContext.request.contextPath}/assets/images/icons/consult.png" class="detail-block-icon" alt="职业咨询">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">职业生涯咨询预约</h5>
								<p class="detail-block-desc">专业职业规划指导与咨询服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=career&id=6" class="detail-block-link">
									预约咨询
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="career">
						<img src="${pageContext.request.contextPath}/assets/images/icons/job.png" class="detail-block-icon" alt="职位推送">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">职位化精准推送</h5>
								<p class="detail-block-desc">基于专业特点的就业岗位推荐</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=career&id=7" class="detail-block-link">
									查看推荐
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="career">
						<img src="${pageContext.request.contextPath}/assets/images/icons/recruitment.png" class="detail-block-icon" alt="校园招聘">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">校园招聘信息查询</h5>
								<p class="detail-block-desc">校园招聘信息发布与查询平台</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=career&id=8" class="detail-block-link">
									查看招聘
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="career">
						<img src="${pageContext.request.contextPath}/assets/images/icons/startup.png" class="detail-block-icon" alt="创业申请">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">大学生创业申请</h5>
								<p class="detail-block-desc">创业项目申请与扶持服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=career&id=9" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<!-- 育人服务功能块 -->
					<div class="detail-block" data-category="education">
						<img src="${pageContext.request.contextPath}/assets/images/icons/student-card.png" class="detail-block-icon" alt="学生证">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">学生证申请</h5>
								<p class="detail-block-desc">学生证办理与补办服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=education&id=10" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="education">
						<img src="${pageContext.request.contextPath}/assets/images/icons/military.png" class="detail-block-icon" alt="应征入伍">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">应征入伍申请</h5>
								<p class="detail-block-desc">大学生应征入伍办理服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=education&id=11" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="education">
						<img src="${pageContext.request.contextPath}/assets/images/icons/dormitory.png" class="detail-block-icon" alt="校外住宿">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">校外住宿申请</h5>
								<p class="detail-block-desc">学生校外住宿申请与备案</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=education&id=12" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="education">
						<img src="${pageContext.request.contextPath}/assets/images/icons/honor.png" class="detail-block-icon" alt="荣誉称号">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">荣誉称号申请</h5>
								<p class="detail-block-desc">学生荣誉称号申请与评定</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=education&id=13" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="education">
						<img src="${pageContext.request.contextPath}/assets/images/icons/discipline.png" class="detail-block-icon" alt="违纪处分">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">违纪处分办理</h5>
								<p class="detail-block-desc">学生违纪处分管理服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=education&id=14" class="detail-block-link">
									立即办理
								</a>
							</div>
						</div>
					</div>

					<!-- 资助服务功能块 -->
					<div class="detail-block" data-category="aid">
						<img src="${pageContext.request.contextPath}/assets/images/icons/work.png" class="detail-block-icon" alt="勤工助学">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">勤工助学申请</h5>
								<p class="detail-block-desc">校园勤工助学岗位申请</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=aid&id=15" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="aid">
						<img src="${pageContext.request.contextPath}/assets/images/icons/poverty.png" class="detail-block-icon" alt="困难申请">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">家庭经济困难申请</h5>
								<p class="detail-block-desc">困难学生认定与资助服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=aid&id=16" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="aid">
						<img src="${pageContext.request.contextPath}/assets/images/icons/scholarship.png" class="detail-block-icon" alt="奖助学金">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">奖助学金申请</h5>
								<p class="detail-block-desc">各类奖学金和助学金申请</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=aid&id=17" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="aid">
						<img src="${pageContext.request.contextPath}/assets/images/icons/psychology.png" class="detail-block-icon" alt="心理咨询">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">心理咨询预约</h5>
								<p class="detail-block-desc">心理健康咨询与辅导服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=aid&id=18" class="detail-block-link">
									立即预约
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="education">
						<img src="${pageContext.request.contextPath}/assets/images/icons/activity.png" class="detail-block-icon" alt="学生活动">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">学生活动申请</h5>
								<p class="detail-block-desc">学生活动场地与项目申请</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=education&id=19" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="education">
						<img src="${pageContext.request.contextPath}/assets/images/icons/volunteer.png" class="detail-block-icon" alt="志愿服务">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">志愿服务申请</h5>
								<p class="detail-block-desc">志愿服务活动报名与管理</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_Volunteering.html" class="detail-block-link">
									立即报名
								</a>
							</div>
						</div>
					</div>

					<!-- 生活服务功能块 -->
					<div class="detail-block" data-category="life">
						<img src="${pageContext.request.contextPath}/assets/images/icons/visitor.png" class="detail-block-icon" alt="外校人员">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">外校人员入校申请</h5>
								<p class="detail-block-desc">外来人员入校预约与审批</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=life&id=21" class="detail-block-link">
									立即申请
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="life">
						<img src="${pageContext.request.contextPath}/assets/images/icons/repair.png" class="detail-block-icon" alt="教室维修">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">教室维修申请</h5>
								<p class="detail-block-desc">教室设施维修报修服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=life&id=23" class="detail-block-link">
									立即报修
								</a>
							</div>
						</div>
					</div>

					<div class="detail-block" data-category="life">
						<img src="${pageContext.request.contextPath}/assets/images/icons/dorm-repair.png" class="detail-block-icon" alt="寝室维修">
						<div class="detail-block-content">
							<div class="detail-block-info">
								<h5 class="detail-block-title">寝室维修申请</h5>
								<p class="detail-block-desc">寝室设施维修报修服务</p>
							</div>
							<div class="detail-block-actions">
								<a href="${pageContext.request.contextPath}/pages/detail_get.jsp?category=life&id=24" class="detail-block-link">
									立即报修
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
		<footer class="pt-5 pb-3 footer  footer-dark bg-tertiary  bj  ">
			<!-- bg-size--cover -->
			<div class="container">
				<div class="row">
					<div class="col-12 col-md-4">
						<div class="pr-lg-5">
							<h1 class="heading h6 text-uppercase font-weight-700 mb-3"><a
									href="http://www.hngzy.edu.cn">
									<img src="http://www.hngzy.edu.cn/images/foot-logo.png" width="100%"></a></h1>
							<P><img src="${pageContext.request.contextPath}/assets/images/backgrounds/xx.png"></P>
						</div>
					</div>
					<div class="col-6 col-md">
						<h5 class="heading h6 text-uppercase font-weight-700 mb-3">新手入门</h5>
						<ul class="list-unstyled text-small">
							<li><a class="text-muted" href="#">名词解释</a></li>
							<li><a class="text-muted" href="#">使用手册（学生端）</a></li>
							<li><a class="text-muted" href="#">操作文档（教师端）</a></li>
						</ul>
					</div>
					<div class="col-6 col-md">
						<h5 class="heading h6 text-uppercase font-weight-700 mb-3">服务支持</h5>
						<ul class="list-unstyled text-small">
							<li><a class="text-muted" href="#">帮助中心</a></li>
							<li><a class="text-muted" href="#">隐私政策</a></li>
							<li><a class="text-muted" href="#">服务协议</a></li>
							<li><a class="text-muted" href="#">知识产权</a></li>
						</ul>
					</div>
					<div class="col-6 col-md">
						<h5 class="heading h6 text-uppercase font-weight-700 mb-3">加入我们</h5>
						<ul class="list-unstyled text-small">
							<li><a class="text-muted" href="#">社团</a></li>
							<li><a class="text-muted" href="#">新媒体</a></li>
							<li><a class="text-muted" href="#">志愿服务队</a></li>
						</ul>
					</div>
					<div class="col-6 col-md">
						<h5 class="heading h6 text-uppercase font-weight-700 mb-3">友情链接</h5>
						<ul class="list-unstyled text-small">
							<li><a class="text-muted" href="https://hljswkj.jw.chaoxing.com/admin/login">教务系统</a></li>
							<li><a class="text-muted" href="https://www.hljbys.org.cn/school/index?mark=hngzy">就业平台</a>
							</li>
							<li><a class="text-muted" href="#">VPN客户端</a></li>
							<li><a class="text-muted" href="#">双创竞赛平台</a></li>
						</ul>
					</div>
				</div>
				<hr>
				<div class="d-flex align-items-center">
					<span class="">
						Copyright &copy; 2025 <a href="http://www.hngzy.edu.cn/index.htm" class="footer-link"
							target="_blank">黑龙江农业工程职业学院 · 版权所有</a> All Rights Reserved <a
							href="https://beian.miit.gov.cn/" class="footer-link" target="_blank">黑ICP备05004682号-1</a>
					</span>
					<ul class="nav ml-lg-auto">
						<li class="nav-item">
							<a class="nav-link" href="http://www.hngzy.edu.cn/" target="_blank"><i
									class="fas fa-university"></i></a>
						</li>
						<li class="nav-item">
							<a class="nav-link" href="http://weixin.qq.com/r/GkhocHPE6y6UrTcT9x0I" target="_blank"><i
									class="fab fa-weixin"></i></a>
						</li>
						<li class="nav-item">
							<a class="nav-link" href="https://im.qq.com/index/" target="_blank"><i
									class="fab fa-qq"></i></a>
						</li>
						<!-- <li class="nav-item">
							<a class="nav-link active" href="https://www.douyin.com/" target="_blank"><i class="fab fa-tiktok"></i></a>
						</li> -->
					</ul>
				</div>
			</div>
		</footer>
		<!-- Core -->
		<script src="${pageContext.request.contextPath}/assets/vendor/jquery/jquery.min.js"></script>
		<script src="${pageContext.request.contextPath}/assets/vendor/popper/popper.min.js"></script>
		<script src="${pageContext.request.contextPath}/assets/js/bootstrap/bootstrap.min.js"></script>
		<!-- FontAwesome 5 -->
		<script src="${pageContext.request.contextPath}/assets/vendor/fontawesome/js/fontawesome-all.min.js" defer></script>
		<!-- Page plugins -->
		<script src="${pageContext.request.contextPath}/assets/vendor/bootstrap-select/js/bootstrap-select.min.js"></script>
		<script src="${pageContext.request.contextPath}/assets/vendor/bootstrap-tagsinput/bootstrap-tagsinput.min.js"></script>
		<script src="${pageContext.request.contextPath}/assets/vendor/input-mask/input-mask.min.js"></script>
		<script src="${pageContext.request.contextPath}/assets/vendor/nouislider/js/nouislider.min.js"></script>
		<script src="${pageContext.request.contextPath}/assets/vendor/textarea-autosize/textarea-autosize.min.js"></script>
		<!-- Theme JS -->
		<script src="${pageContext.request.contextPath}/assets/js/theme.js"></script>

		<!-- 添加交互逻辑 -->
		<script>
			// 主题与功能块的映射关系
			const themeMapping = {
				'teaching': ['教务系统', '认证考试报名申请', '图书借阅'],
				'life': ['外校人员入校申请', '教室维修申请', '寝室维修申请'],
				'education': ['学生证申请', '应征入伍申请', '校外住宿申请', '荣誉称号申请', '违纪处分办理', '学生活动申请', '志愿服务申请'],
				'aid': ['勤工助学申请', '家庭经济困难申请', '奖助学金申请', '心理咨询预约'],
				'career': ['AI智能简历', '网上签约', '毕业去向登记', '职业生涯咨询预约', '职位化精准推送', '校园招聘信息查询', '大学生创业申请']
			};

			// 部门与功能块的映射关系
			const departmentMapping = {
				'教务处': ['教务系统', '认证考试报名申请'],
				'招生就业处': ['AI智能简历', '网上签约', '毕业去向登记', '职业生涯咨询预约', '职位化精准推送', '校园招聘信息查询', '大学生创业申请'],
				'学生工作部': ['学生证申请', '应征入伍申请', '校外住宿申请', '荣誉称号申请', '违纪处分办理', '勤工助学申请', '家庭经济困难申请', '奖助学金申请', '心理咨询预约', '学生活动申请', '志愿服务申请'],
				'保卫处': ['外校人员入校申请'],
				'图书馆': ['图书借阅'],
				'总务处': ['教室维修申请', '寝室维修申请']
			};

			// 调试日志函数
			function log(message, type = 'info') {
				const styles = {
					info: 'color: #2196F3',
					success: 'color: #4CAF50',
					warning: 'color: #FFC107',
					error: 'color: #F44336'
				};
				console.log(`%c[${type.toUpperCase()}] ${message}`, styles[type]);
			}

			$(document).ready(function() {
				log('页面加载完成，开始初始化...');

				// 初始化
				$('.detail-submenu').hide();
				$('#departmentMenu').hide();
				updateCategoryCount();
				
				// 立即处理URL参数
				handleUrlParams();

				// 导航标签切换（按主题/按部门）
				$('.detail-tab').on('click', function() {
					const $this = $(this);
					const type = $this.data('type');
					
					log(`切换导航标签: ${type}`);
					
					// 更新标签状态
					$('.detail-tab').removeClass('active');
					$this.addClass('active');
					
					// 重置所有状态
					$('.detail-menu-item, .detail-submenu-item').removeClass('active');
					$('.detail-submenu').hide();
					
					// 切换菜单显示
					if (type === 'theme') {
						$('#departmentMenu').hide();
						$('#themeMenu').fadeIn(300);
						const $firstItem = $('#themeMenu .detail-menu-item[data-category="all"]');
						$firstItem.addClass('active');
						updateBreadcrumb($firstItem);
						filterFunctionBlocks();
					} else {
						$('#themeMenu').hide();
						$('#departmentMenu').fadeIn(300);
						const $firstItem = $('#departmentMenu .detail-menu-item[data-category="all"]');
						$firstItem.addClass('active');
						updateBreadcrumb($firstItem);
						filterFunctionBlocks();
					}

					// 更新URL参数
					const urlParams = new URLSearchParams(window.location.search);
					urlParams.set('type', type);
					const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
					window.history.replaceState({}, '', newUrl);
				});
				
				// 主菜单项点击事件处理
				$('.detail-menu-item').on('click', function(e) {
					e.preventDefault();
					const $this = $(this);
					const category = $this.data('category');
					const isDepartment = $this.closest('#departmentMenu').length > 0;
					
					log(`点击主菜单项: ${category}, 是否部门菜单: ${isDepartment}`);
					
					if ($this.hasClass('disabled')) return;
					
					$('.detail-menu-item').removeClass('active');
					$this.addClass('active');
					
					if (category === 'all') {
						$('.detail-submenu').slideUp(300);
						showAllFunctionBlocks();
					} else {
						const $submenu = $this.find('.detail-submenu');
						if ($submenu.length) {
							$('.detail-submenu').not($submenu).slideUp(300);
							$submenu.slideToggle(300);
							
							if ($submenu.is(':visible')) {
								const text = $this.clone().children().remove().end().text().trim();
								filterFunctionBlocks([text], isDepartment);
							}
						}
					}
					
					updateBreadcrumb($this);
				});
				
				// 子菜单项点击事件处理
				$('.detail-submenu-item').on('click', function(e) {
					e.preventDefault();
					e.stopPropagation();
					
					const $this = $(this);
					const isDepartment = $this.closest('#departmentMenu').length > 0;
					const parentText = $this.closest('.detail-menu-item').clone().children().remove().end().text().trim();
					
					log(`点击子菜单项: ${$this.text()}, 父菜单: ${parentText}`);
					
					$('.detail-submenu-item').removeClass('active');
					$this.addClass('active');
					
					if (isDepartment) {
						filterFunctionBlocks([parentText], true);
					} else {
						filterFunctionBlocks([$this.data('category')], false);
					}
					
					updateBreadcrumb($this);
				});

				// 功能块过滤函数
				function filterFunctionBlocks(categories, isDepartment = false) {
					log(`过滤功能块: ${categories}, 是否部门筛选: ${isDepartment}`);

					const $blocks = $('.detail-block');
					
					if (!categories || categories.length === 0) {
						showAllFunctionBlocks();
						return;
					}
					
					$blocks.hide().removeClass('detail-block-animate');
					
					if (isDepartment) {
						categories.forEach(dept => {
							if (departmentMapping[dept]) {
								const titles = departmentMapping[dept];
								showFilteredBlocks($blocks, titles);
							}
						});
					} else {
						categories.forEach(category => {
							if (themeMapping[category]) {
								const titles = themeMapping[category];
								showFilteredBlocks($blocks, titles);
							}
						});
					}
				}

				// 显示所有功能块
				function showAllFunctionBlocks() {
					log('显示所有功能块');
					$('.detail-block').each(function(index) {
						const $block = $(this);
						setTimeout(() => {
							$block.fadeIn().addClass('detail-block-animate');
						}, index * 50);
					});
				}

				// 显示筛选后的功能块
				function showFilteredBlocks($blocks, titles) {
					$blocks.each(function(index) {
						const $block = $(this);
						const blockTitle = $block.find('.detail-block-title').text().trim();
						if (titles.includes(blockTitle)) {
							setTimeout(() => {
								$block.fadeIn().addClass('detail-block-animate');
							}, index * 50);
						}
					});
				}

				// 处理URL参数
				function handleUrlParams() {
					const urlParams = new URLSearchParams(window.location.search);
					const category = urlParams.get('category');
					const type = urlParams.get('type');
					const dept = urlParams.get('dept');

					log(`处理URL参数: type=${type}, category=${category}, dept=${dept}`);

					if (type === 'theme') {
						$('.detail-tab[data-type="theme"]').click();
						
						if (category && themeMapping[category]) {
							setTimeout(() => {
								const $menuItem = $('#themeMenu .detail-menu-item').filter(function() {
									const menuText = $(this).clone().children().remove().end().text().trim();
									switch(category) {
										case 'teaching': return menuText.includes('教学服务');
										case 'life': return menuText.includes('生活服务');
										case 'education': return menuText.includes('育人服务');
										case 'aid': return menuText.includes('资助服务');
										case 'career': return menuText.includes('发展服务');
										default: return false;
									}
								});

								if ($menuItem.length) {
									$('.detail-menu-item').removeClass('active');
									$menuItem.addClass('active');
									$('.detail-submenu').hide();
									$menuItem.find('.detail-submenu').show();
									filterFunctionBlocks([category], false);
									updateBreadcrumb($menuItem);
								} else {
									log('未找到对应的主题菜单项', 'warning');
								}
							}, 100);
						}
					} else if (type === 'department') {
						$('.detail-tab[data-type="department"]').click();
						
						if (dept && departmentMapping[dept]) {
							setTimeout(() => {
								const $menuItem = $('#departmentMenu .detail-menu-item').filter(function() {
									const menuText = $(this).clone().children().remove().end().text().trim();
									return menuText.includes(dept);
								});

								if ($menuItem.length) {
									$('.detail-menu-item').removeClass('active');
									$menuItem.addClass('active');
									$('.detail-submenu').hide();
									$menuItem.find('.detail-submenu').show();
									filterFunctionBlocks([dept], true);
									updateBreadcrumb($menuItem);
								} else {
									log('未找到对应的部门菜单项', 'warning');
								}
							}, 100);
						}
					}
				}

				// 更新分类计数
				function updateCategoryCount() {
					log('更新分类计数');
					const totalBlocks = $('.detail-block').length;
					$('[data-category="all"] .detail-badge').text(totalBlocks);
					
					// 更新主题菜单计数
					Object.keys(themeMapping).forEach(category => {
						const count = themeMapping[category].length;
						$(`#themeMenu .detail-menu-item:contains("${getCategoryText(category)}")`).find('.detail-badge').text(count);
					});
					
					// 更新部门菜单计数
					Object.keys(departmentMapping).forEach(dept => {
						const count = departmentMapping[dept].length;
						$(`#departmentMenu .detail-menu-item:contains("${dept}")`).find('.detail-badge').text(count);
					});
				}

				// 获取分类中文名称
				function getCategoryText(category) {
					const categoryMap = {
						'teaching': '教学服务',
						'life': '生活服务',
						'education': '育人服务',
						'aid': '资助服务',
						'career': '发展服务'
					};
					return categoryMap[category] || '';
				}

				// 更新面包屑导航
				function updateBreadcrumb(item) {
					const $breadcrumb = $('.detail-breadcrumb');
					const type = $('.detail-tab.active').text();
					let html = `<span class="detail-breadcrumb-item">${type}</span>`;
					
					if (item.hasClass('detail-submenu-item')) {
						const parent = item.closest('.detail-menu-item').clone()
							.children().remove().end().text().trim();
						const current = item.text().trim();
						
						html += `<span class="detail-breadcrumb-item">${parent}</span>`;
						html += `<span class="detail-breadcrumb-item">${current}</span>`;
					} else if (item.hasClass('detail-menu-item')) {
						const current = item.clone().children().remove().end().text().trim();
						html += `<span class="detail-breadcrumb-item">${current}</span>`;
					}
					
					$breadcrumb.html(html);
				}

				// 按钮悬停效果
				$('.detail-block-link').each(function() {
					$(this).on('mouseenter', function() {
						$(this).closest('.detail-block').addClass('detail-block-hover');
					}).on('mouseleave', function() {
						$(this).closest('.detail-block').removeClass('detail-block-hover');
					});
				});

				// 按钮点击波纹效果
				$('.detail-block-link').on('click', function(e) {
					let x = e.pageX - $(this).offset().left;
					let y = e.pageY - $(this).offset().top;

					let ripple = $('<span class="ripple"></span>').appendTo(this);
					ripple.css({
						left: x + 'px',
						top: y + 'px'
					});

					setTimeout(() => {
						ripple.remove();
					}, 600);
				});

				// 搜索功能优化
				let searchTimer;
				$('#searchInput').on('input', function() {
					const $this = $(this);
					const $blocks = $('.detail-block');
					const $empty = $('.detail-search-empty');
					clearTimeout(searchTimer);
					
					// 添加搜索中的视觉反馈
					$this.addClass('searching');
					
					searchTimer = setTimeout(() => {
						const searchText = $this.val().toLowerCase();
						
						log(`执行搜索: ${searchText}`);
						
						if (!searchText) {
							$blocks.removeClass('search-hide search-show');
							$empty.removeClass('show');
							showAllFunctionBlocks();
							$this.removeClass('searching');
							return;
						}
						
						let hasResults = false;
						$blocks.addClass('search-hide').removeClass('search-show');
						
						$blocks.each(function(index) {
							const $block = $(this);
							const title = $block.find('.detail-block-title').text().toLowerCase();
							const desc = $block.find('.detail-block-desc').text().toLowerCase();
							const category = $block.data('category');
							const categoryText = getCategoryText(category);
							
							if (title.includes(searchText) || 
								desc.includes(searchText) || 
								categoryText.includes(searchText)) {
								hasResults = true;
								setTimeout(() => {
									$block.removeClass('search-hide').addClass('search-show');
								}, index * 50);
							}
						});
						
						// 显示/隐藏空结果提示
						if (!hasResults) {
							$empty.addClass('show');
						} else {
							$empty.removeClass('show');
						}
						
						$this.removeClass('searching');
					}, 300);
				});

				// 添加搜索为空的提示DOM
				$('.detail-search').after(`
					<div class="detail-search-empty">
						<i class="fas fa-search"></i>
						<p>未找到相关功能，请尝试其他关键词</p>
					</div>
				`);
			});
		</script>

		<style>
			/* 添加波纹效果样式 */
			.detail-block-link {
				position: relative;
				overflow: hidden;
				transition: transform 0.3s ease;
			}

			.ripple {
				position: absolute;
				background: rgba(255, 255, 255, 0.3);
				border-radius: 50%;
				transform: scale(0);
				animation: ripple 0.6s linear;
				pointer-events: none;
			}

			@keyframes ripple {
				to {
					transform: scale(4);
					opacity: 0;
				}
			}

			.detail-block-hover {
				transform: translateY(-5px);
				box-shadow: 0 5px 15px rgba(0,0,0,0.1);
				transition: all 0.3s ease;
			}

			/* 优化动画效果 */
			.detail-block {
				transition: all 0.3s ease-in-out;
			}

			.detail-block-animate {
				animation: fadeInUp 0.5s ease-out forwards;
			}

			@keyframes fadeInUp {
				from {
					opacity: 0;
					transform: translateY(20px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			/* 面包屑导航样式优化 */
			.detail-breadcrumb {
				transition: all 0.3s ease;
			}

			.detail-breadcrumb-item {
				position: relative;
				transition: color 0.3s ease;
			}

			.detail-breadcrumb-item:hover {
				color: #007bff;
			}

			/* 搜索框样式优化 */
			.detail-search {
				position: relative;
				width: 100%;
				margin: 20px 0;
				padding: 0 15px;
			}

			.detail-search-input {
				width: 100%;
				padding: 12px 45px 12px 20px;
				font-size: 16px;
				color: #495057;
				background-color: #fff;
				border: 2px solid #e9ecef;
				border-radius: 8px;
				transition: all 0.3s ease;
				box-shadow: 0 2px 4px rgba(0,0,0,0.02);
			}

			.detail-search-input:focus {
				outline: none;
				border-color: #007bff;
				box-shadow: 0 0 0 0.2rem rgba(0,123,255,.15);
				transform: translateY(-1px);
			}

			.detail-search-icon {
				position: absolute;
				right: 30px;
				top: 50%;
				transform: translateY(-50%);
				color: #adb5bd;
				transition: all 0.3s ease;
			}

			.detail-search-input:focus + .detail-search-icon {
				color: #007bff;
				transform: translateY(-50%) scale(1.1);
			}

			/* 搜索结果动画 */
			.detail-block {
				opacity: 1;
				transform: translateY(0);
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			}

			.detail-block.search-hide {
				opacity: 0;
				transform: translateY(20px);
				pointer-events: none;
			}

			.detail-block.search-show {
				animation: searchFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
			}

			@keyframes searchFadeIn {
				from {
					opacity: 0;
					transform: translateY(20px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			/* 搜索为空时的提示 */
			.detail-search-empty {
				display: none;
				text-align: center;
				padding: 40px 20px;
				color: #6c757d;
				font-size: 16px;
				animation: fadeIn 0.3s ease;
			}

			.detail-search-empty.show {
				display: block;
			}

			.detail-search-empty i {
				font-size: 48px;
				margin-bottom: 15px;
				color: #adb5bd;
			}

			@keyframes fadeIn {
				from {
					opacity: 0;
				}
				to {
					opacity: 1;
				}
			}
		</style>
	</body>
</html>
