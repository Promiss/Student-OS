-- ============================================================
--  一站式学生综合服务系统 (SUDT) - 完整数据库备份脚本
--  数据库名称: sudt_db
--  字符集: utf8mb4 / utf8mb4_unicode_ci
--  版本: V4.1 (2026-04-09 更新)
--  更新内容:
--    - 优化学生用户表增加 password_hash 字段支持系统用户注册/重置
--    - moral_credit 新增 activity_type 字段（来源类型）
--    - 修复 student_credit_balance 视图 Bug（change_type 字段不存在）
--    - 补全 student_003~005 个人信息字段
--    - 新增教职工/管理员测试用户 (admin_001/su_001/college_001/fa_001-003/teacher_001)
--    - 新增大量德育分历史测试记录（19条，覆盖所有来源类型）
--    - 新增荣誉申请测试记录（覆盖 pending/approved/rejected）
--  适用环境: MySQL 5.7+ / 8.0+
--  使用方法: mysql -u root -p < sudt_db_backup.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET TIME_ZONE = '+08:00';

CREATE DATABASE IF NOT EXISTS `sudt_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sudt_db`;

-- 清空旧表
DROP TABLE IF EXISTS `student_honors`;
DROP TABLE IF EXISTS `honor_applications`;
DROP TABLE IF EXISTS `honor_categories`;
DROP TABLE IF EXISTS `moral_credit`;
DROP TABLE IF EXISTS `student_change`;
DROP TABLE IF EXISTS `approval_notice`;
DROP TABLE IF EXISTS `approval_log`;
DROP TABLE IF EXISTS `notice_read_log`;
DROP TABLE IF EXISTS `message`;
DROP TABLE IF EXISTS `apply`;
DROP TABLE IF EXISTS `notice`;
DROP TABLE IF EXISTS `family`;
DROP TABLE IF EXISTS `role_permission`;
DROP TABLE IF EXISTS `student`;
DROP TABLE IF EXISTS `system_log`;
DROP TABLE IF EXISTS `user_role`;


-- ============================================================
--  TABLE: user_role
-- ============================================================
CREATE TABLE `user_role` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `role_name`   VARCHAR(50)  NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_role` (`role_name`, `description`) VALUES
  ('student',        '普通学生，可提交申请与查阅个人信息'),
  ('counselor',      '辅导员，负责初步审批与学生日常管理'),
  ('college_admin',  '二级学院管理员，负责复核审批'),
  ('school_admin',   '校级管理员，负责终审'),
  ('super_admin',    '系统超级管理员，拥有全部权限'),
  ('instructor',     '学业导师，可查看学情并发送消息');


-- ============================================================
--  TABLE: role_permission
-- ============================================================
CREATE TABLE `role_permission` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `role_id`         INT         NOT NULL,
  `permission_name` VARCHAR(100) NOT NULL,
  `permission_type` ENUM('data','transaction','message','other') NOT NULL,
  FOREIGN KEY (`role_id`) REFERENCES `user_role`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  TABLE: student  (V4: 完整字段 + 教职工账号)
-- ============================================================
CREATE TABLE `student` (
  `id`                VARCHAR(50)  NOT NULL PRIMARY KEY,
  `student_no`        VARCHAR(50)  NOT NULL UNIQUE,
  `name`              VARCHAR(100) NOT NULL,
  `id_card`           VARCHAR(18)  NOT NULL,
  `id_type`           VARCHAR(20)  DEFAULT '居民身份证',
  `gender`            ENUM('男','女') NOT NULL DEFAULT '男',
  `political_status`  VARCHAR(50)  DEFAULT '群众',
  `nation`            VARCHAR(30)  DEFAULT '汉族',
  `native_place`      VARCHAR(100),
  `birth_date`        DATE,
  `enroll_year`       VARCHAR(10),
  `grad_year`         VARCHAR(10),
  `college`           VARCHAR(100),
  `major`             VARCHAR(100),
  `class_name`        VARCHAR(100),
  `status`            ENUM('正常','休学','退学','入伍','毕业') DEFAULT '正常',
  `position`          VARCHAR(100),
  `department`        VARCHAR(100),
  `title`             VARCHAR(50),
  `work_type`         VARCHAR(50),
  `is_party_member`   TINYINT(1)   DEFAULT 0,
  `phone`             VARCHAR(20),
  `wechat`            VARCHAR(50),
  `email`             VARCHAR(100),
  `emergency_contact_name`  VARCHAR(100),
  `emergency_contact_phone` VARCHAR(20),
  `address`           VARCHAR(255),
  `bio`               TEXT,
  `avatar_url`        VARCHAR(255),
  `family_info`       TEXT,
  `resume`            TEXT,
  `family_members`    JSON,
  `work_history`      JSON,
  `personal_summary`  TEXT,
  `password_hash`     VARCHAR(255) DEFAULT NULL,
  `instructor_id`     VARCHAR(50),
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学生数据（完整）
INSERT INTO `student` (`id`,`student_no`,`name`,`id_card`,`gender`,`political_status`,`nation`,`native_place`,`birth_date`,`enroll_year`,`grad_year`,`college`,`major`,`class_name`,`status`,`position`,`phone`,`wechat`,`email`,`emergency_contact_name`,`emergency_contact_phone`,`address`,`instructor_id`,`family_members`,`work_history`,`personal_summary`) VALUES
  ('student_001','2023010101','张伟','110101200301150011','男','共青团员','汉族','黑龙江省哈尔滨市','2003-01-15','2023','2027','计算机学院','软件工程','软工2301','正常','班长','13800001111','wx_zhangwei','zhangwei@stu.edu.cn','张国强','13900001111','黑龙江省哈尔滨市香坊区XX路1号','fa_001','[{"name":"张国强","relation":"父亲","phone":"13900001111","work":"某国企工程师"},{"name":"李秀梅","relation":"母亲","phone":"13900001112","work":"教师"}]','[{"start":"2023-09","end":"至今","org":"某某大学","role":"在校学生"}]','本人品学兼优，积极参与学生活动，具有良好的团队合作与创新能力。'),
  ('student_002','2023010102','李晓梅','110101200312220022','女','中共党员','汉族','山东省济南市','2003-12-22','2023','2027','计算机学院','数据科学与大数据','数据2301','正常','学习委员','13800002222','wx_lixiaomei','lixiaomei@stu.edu.cn','赵丽华','13900002222','山东省济南市历下区XX花园15楼','fa_001','[{"name":"李建国","relation":"父亲","phone":"13900002221","work":"私营企业主"},{"name":"赵丽华","relation":"母亲","phone":"13900002222","work":"护士"}]','[{"start":"2023-09","end":"至今","org":"某某大学","role":"在校学生"}]','学习刻苦，成绩优异，连续两学年综合排名全学院第一，多次获得荣誉表彰。'),
  ('student_003','2022020201','王鹏','110102200208180033','男','共青团员','汉族','河南省郑州市','2002-08-18','2022','2026','经济管理学院','会计学','会计2201','正常','团支书','13800003333','wx_wpeng','wangpeng@stu.edu.cn','王建国','13900003331','河南省郑州市金水区XX路99号','fa_002','[{"name":"王建国","relation":"父亲","phone":"13900003331","work":"建筑工程师"},{"name":"吴秀芳","relation":"母亲","phone":"13900003332","work":"会计"}]','[{"start":"2022-09","end":"至今","org":"某某大学","role":"在校学生"},{"start":"2021-07","end":"2022-07","org":"郑州市XX公司","role":"实习生"}]','本人责任心强，担任班级团支书，积极参与志愿活动，综合素质较为全面。'),
  ('student_004','2022020202','陈思雨','110103200105090044','女','群众','汉族','湖南省长沙市','2001-05-09','2022','2026','经济管理学院','工商管理','工管2202','休学','宣传委员','13800004444','wx_csiy','chensiy@stu.edu.cn','陈凤英','13900004441','湖南省长沙市天心区XX街道1栋2单元','fa_002','[{"name":"陈凤英","relation":"母亲","phone":"13900004441","work":"退休教师"},{"name":"陈建华","relation":"父亲","phone":"13900004442","work":"个体经营"}]','[{"start":"2022-09","end":"2025-03","org":"某某大学","role":"在校学生（休学中）"}]','本人曾任宣传委员，具有较强的艺术创作能力，因健康原因休学，期望早日康复复学。'),
  ('student_005','2021030301','刘杨','110104200007220055','男','共青团员','汉族','江苏省南京市','2000-07-22','2021','2025','外国语学院','英语','英语2101','正常','文艺委员','13800005555','wx_liuyang','liuyang@stu.edu.cn','刘建军','13900005551','江苏省南京市鼓楼区XX新村3号楼','fa_003','[{"name":"刘建军","relation":"父亲","phone":"13900005551","work":"军人（退役）"},{"name":"赵美娟","relation":"母亲","phone":"13900005552","work":"幼儿园教师"}]','[{"start":"2021-09","end":"至今","org":"某某大学","role":"在校学生"},{"start":"2023-07","end":"2023-09","org":"南京某外贸公司","role":"翻译实习生"}]','本人英语口语流利，曾在英语演讲比赛中获奖，擅长跨文化交流与沟通。');

-- 教职工/管理员测试用户
INSERT INTO `student` (`id`,`student_no`,`name`,`id_card`,`gender`,`political_status`,`college`,`position`,`phone`,`email`,`status`) VALUES
  ('admin_001','ADMIN001','超级管理员','110101199001010001','男','中共党员',NULL,'系统管理员','13800000001','admin001@school.edu.cn','正常'),
  ('su_001','SU001','王志远','110101198801020002','男','中共党员',NULL,'校长助理','13800000002','su001@school.edu.cn','正常'),
  ('college_001','COL001','张海燕','110101198501030003','女','中共党员','计算机学院','院长','13800000003','college001@school.edu.cn','正常'),
  ('fa_001','FA001','李建国','110101198201040004','男','中共党员','计算机学院','辅导员','13800000004','fa001@school.edu.cn','正常'),
  ('fa_002','FA002','刘晓慧','110101198301050005','女','中共党员','经济管理学院','辅导员','13800000005','fa002@school.edu.cn','正常'),
  ('fa_003','FA003','陈大明','110101198401060006','男','共青团员','外国语学院','辅导员','13800000006','fa003@school.edu.cn','正常'),
  ('teacher_001','TCH001','孙明辉','110101197901070007','男','中共党员','计算机学院','副教授','13800000007','teach001@school.edu.cn','正常');


-- ============================================================
--  TABLE: family
-- ============================================================
CREATE TABLE `family` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `student_id`   VARCHAR(50),
  `name`         VARCHAR(100) NOT NULL,
  `relationship` VARCHAR(50)  NOT NULL,
  `age`          INT,
  `job`          VARCHAR(100),
  `phone`        VARCHAR(20),
  `workplace`    VARCHAR(200),
  FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  TABLE: moral_credit  (V4: 新增 activity_type)
-- ============================================================
CREATE TABLE `moral_credit` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `student_id`    VARCHAR(50),
  `credit_change` DECIMAL(5,2) NOT NULL COMMENT '变动分值（正加负减）',
  `reason`        VARCHAR(255) NOT NULL,
  `operated_by`   VARCHAR(50)  COMMENT '操作人ID',
  `status`        ENUM('pending','approved','rejected') DEFAULT 'pending',
  `activity_type` VARCHAR(50)  DEFAULT 'manual' COMMENT '来源类型',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `moral_credit` (`student_id`,`credit_change`,`reason`,`operated_by`,`status`,`activity_type`) VALUES
  ('student_001',  2.0,'参加志愿服务活动—寒假支教','fa_001','approved','volunteer'),
  ('student_001', -1.0,'课堂迟到三次，违反纪律','fa_001','approved','discipline'),
  ('student_001',  1.5,'参与校园文化节志愿服务','fa_001','approved','volunteer'),
  ('student_001',  3.0,'校级英语演讲比赛三等奖','fa_001','approved','competition'),
  ('student_001',  2.0,'暑期三下乡活动申请','fa_001','pending','social_practice'),
  ('student_002',  3.0,'获得国家奖学金','admin_sys','approved','honor_apply'),
  ('student_002',  2.0,'担任学习委员表现优秀','fa_001','approved','activity'),
  ('student_002',  5.0,'省级数学建模竞赛二等奖','su_001','approved','competition'),
  ('student_002', -0.5,'图书馆未归还借阅资料','fa_001','approved','discipline'),
  ('student_003',  1.5,'担任学生干部表现优秀','fa_002','approved','activity'),
  ('student_003',  2.0,'社区志愿服务累计20小时','fa_002','approved','social_practice'),
  ('student_003',  1.0,'积极参与班级建设','fa_002','approved','activity'),
  ('student_003',  1.5,'读书月分享会组织者','fa_002','pending','activity'),
  ('student_004', -1.0,'无故旷课三次','fa_002','approved','discipline'),
  ('student_004',  1.5,'休学前志愿服务加分保留','fa_002','approved','volunteer'),
  ('student_005',  2.0,'获得英语演讲大赛校级二等奖','fa_003','approved','competition'),
  ('student_005',  1.5,'省级英语演讲大赛三等奖','fa_003','approved','competition'),
  ('student_005',  2.5,'赴南京企业社会实践表现优秀','fa_003','approved','social_practice'),
  ('student_005',  1.0,'参与校际文化交流活动','fa_003','approved','activity');


-- ============================================================
--  TABLE: apply
-- ============================================================
CREATE TABLE `apply` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `apply_type`   VARCHAR(100) NOT NULL,
  `applicant_id` VARCHAR(50)  NOT NULL,
  `content`      TEXT         NOT NULL,
  `form_data`    JSON,
  `attachments`  TEXT,
  `status`       ENUM('pending','approved','rejected','more_info') DEFAULT 'pending',
  `current_step` INT          NOT NULL DEFAULT 1,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_apply_applicant` (`applicant_id`, `status`),
  INDEX `idx_apply_step`      (`status`, `current_step`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `apply` (`apply_type`,`applicant_id`,`content`,`form_data`,`status`,`current_step`) VALUES
  ('请假申请','student_001','因病请假申请','{"reason":"发烧38.5度，医院要求休息","startDate":"2026-04-08","endDate":"2026-04-09","days":2}','pending',1),
  ('奖助学金申请','student_002','国家励志奖学金申请','{"scholarship_name":"国家励志奖学金","reason":"品学兼优，家庭困难","gpa":4.2}','pending',2),
  ('评优评先','student_003','三好学生称号评定申请','{"honor_type":"三好学生","achievements":"连续两学期综合测评第一"}','approved',3),
  ('认证考试报名申请','student_001','英语四级考试报名','{"exam_name":"英语四级","exam_date":"2026-06-15"}','pending',1),
  ('休学申请','student_004','因本人患病，申请休学一年','{"reason":"重症患者，需长期治疗","duration":"一年","expected_return":"2026-09"}','approved',3),
  ('复学申请','student_005','休学期满申请复学','{"reason":"病情已康复，体检合格，申请复学"}','pending',1);


-- ============================================================
--  TABLE: approval_log
-- ============================================================
CREATE TABLE `approval_log` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `apply_id`    INT         NOT NULL,
  `approver_id` VARCHAR(50) NOT NULL,
  `action`      ENUM('approve','reject','request_more','resubmit') NOT NULL,
  `comment`     TEXT,
  `created_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`apply_id`) REFERENCES `apply`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `approval_log` (`apply_id`,`approver_id`,`action`,`comment`) VALUES
  (2,'fa_001','approve','初审通过，同学表现优异，家庭情况属实'),
  (3,'fa_002','approve','同意，该同学符合评优条件'),
  (3,'college_001','approve','院级复审通过'),
  (3,'admin_sys','approve','校级终审通过，恭喜该同学'),
  (5,'fa_001','approve','情况属实，同意初审'),
  (5,'college_001','approve','复审同意'),
  (5,'admin_sys','approve','批准休学一年，注意保留学籍');


-- ============================================================
--  TABLE: notice
-- ============================================================
CREATE TABLE `notice` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `title`         VARCHAR(200) NOT NULL,
  `content`       TEXT         NOT NULL,
  `type`          VARCHAR(50)  DEFAULT 'normal',
  `publisher_id`  VARCHAR(50)  NOT NULL,
  `publish_level` VARCHAR(50)  DEFAULT '学校',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_notice_level` (`publish_level`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notice` (`title`,`content`,`type`,`publisher_id`,`publish_level`) VALUES
  ('关于2025年度国家奖学金申报工作的通知','<p>根据教育部和省教育厅相关文件要求，现就我校2025年度国家奖学金申报工作通知如下：</p><p>一、申报条件：全日制在校本科生，综合测评成绩位年级前5%，无违纪记录。</p>','important','admin_sys','学校'),
  ('2025-2026学年第一学期期末考试安排公告','<p>本学期期末考试定于2026年1月6日至1月17日举行。考试期间请携带有效证件入场，成绩查询将于2月1日开放。</p>','normal','admin_sys','学校'),
  ('关于元旦假期放假及安全的通知','<p>根据国家法定节假日安排，2026年元旦放假1天（1月1日），与周末连休，共放假3天（12月31日至1月2日）。请同学们注意假期安全。</p>','normal','admin_sys','学校'),
  ('计算机学院关于专业导论课程调整的公告','<p>经学院研究决定，自下学期起对《专业导论》课程内容进行调整优化，主要增加AI技术应用实践模块。</p>','normal','fa_001','学院'),
  ('关于开展2025年度"优秀学生干部"评选活动的通知','<p>为激励广大学生积极参与学生工作，现开展2025年度优秀学生干部评选。有意参评的同学请于10月20日前通过系统提交申请。</p>','important','admin_sys','学校');


-- ============================================================
--  TABLE: notice_read_log
-- ============================================================
CREATE TABLE `notice_read_log` (
  `id`        INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`   VARCHAR(50) NOT NULL,
  `notice_id` INT         NOT NULL,
  `read_at`   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_notice` (`user_id`, `notice_id`),
  FOREIGN KEY (`notice_id`) REFERENCES `notice`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  TABLE: message  (V2: 含软删除)
-- ============================================================
CREATE TABLE `message` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id`        VARCHAR(50)  NOT NULL,
  `receiver_id`      VARCHAR(50)  NOT NULL,
  `content`          TEXT         NOT NULL,
  `is_read`          BOOLEAN      NOT NULL DEFAULT FALSE,
  `sender_deleted`   BOOLEAN      NOT NULL DEFAULT FALSE,
  `receiver_deleted` BOOLEAN      NOT NULL DEFAULT FALSE,
  `related_apply_id` INT,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`related_apply_id`) REFERENCES `apply`(`id`) ON DELETE SET NULL,
  INDEX `idx_msg_receiver` (`receiver_id`, `is_read`),
  INDEX `idx_msg_deleted`  (`sender_deleted`, `receiver_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `message` (`sender_id`,`receiver_id`,`content`) VALUES
  ('admin_sys','student_001','<div style="padding:14px 16px;border-left:4px solid #3b82f6;background:#f8fafc;border-radius:8px;"><h4 style="margin:0 0 8px;color:#1e293b;font-size:1rem;">欢迎使用一站式学生综合服务系统！</h4><p style="margin:0;color:#475569;line-height:1.6;">亲爱的同学，您已成功注册本系统。在这里您可以查询学籍信息、提交各类申请、接收通知消息。如有疑问请联系辅导员或学工处。祝学习生活愉快！</p></div>'),
  ('fa_001','student_001','<div style="padding:14px 16px;border-left:4px solid #3b82f6;background:#f8fafc;border-radius:8px;"><h4 style="margin:0 0 8px;color:#1e293b;font-size:1rem;">关于期末考试的提醒</h4><p style="margin:0;color:#475569;line-height:1.6;">张伟同学，期末考试即将到来，请注意合理安排复习时间。</p></div>'),
  ('admin_sys','student_002','<div style="padding:14px 16px;border-left:4px solid #3b82f6;background:#f8fafc;border-radius:8px;"><h4 style="margin:0 0 8px;color:#1e293b;font-size:1rem;">系统自动通知：事务审批进度更新</h4><p style="margin:0;color:#475569;line-height:1.6;">您提交的<strong>奖助学金申请</strong>已通过初审，流转至院级复审环节。</p></div>'),
  ('admin_sys','student_003','<div style="padding:14px 16px;border-left:4px solid #10b981;background:#f8fafc;border-radius:8px;"><h4 style="margin:0 0 8px;color:#1e293b;font-size:1rem;">恭喜！评优评先结果通知</h4><p style="margin:0;color:#475569;line-height:1.6;">王鹏同学，您申请的<strong>三好学生</strong>称号已通过校级终审，恭喜您！</p></div>'),
  ('admin_sys','student_001','<div style="padding:14px 16px;border-left:4px solid #10b981;background:#f8fafc;border-radius:8px;"><h4 style="margin:0 0 8px;color:#1e293b;font-size:1rem;">🌟 德育分加分通知</h4><p style="margin:0;color:#475569;line-height:1.6;">您的德育分已增加 <strong>3.0 分</strong>。原因：校级英语演讲比赛三等奖。来源类型：🏆竞赛获奖</p></div>');


-- ============================================================
--  TABLE: approval_notice
-- ============================================================
CREATE TABLE `approval_notice` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `apply_id`    INT         NOT NULL,
  `receiver_id` VARCHAR(50) NOT NULL,
  `notice_type` ENUM('pending','approved','rejected','more_info','timeout') NOT NULL,
  `status`      ENUM('unread','read') DEFAULT 'unread',
  `created_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`apply_id`) REFERENCES `apply`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  TABLE: student_change
-- ============================================================
CREATE TABLE `student_change` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `student_id`  VARCHAR(50) NOT NULL,
  `apply_id`    INT         NOT NULL,
  `change_type` VARCHAR(50) NOT NULL,
  `old_status`  VARCHAR(50),
  `new_status`  VARCHAR(50),
  `created_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`apply_id`)   REFERENCES `apply`(`id`)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  TABLE: system_log
-- ============================================================
CREATE TABLE `system_log` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`       VARCHAR(50),
  `action_type`   VARCHAR(100),
  `action_detail` TEXT,
  `ip_address`    VARCHAR(50),
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  TABLE: honor_categories
-- ============================================================
CREATE TABLE `honor_categories` (
  `id`           BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL,
  `level`        VARCHAR(50)  NOT NULL,
  `template_url` VARCHAR(255),
  `description`  TEXT,
  `icon`         VARCHAR(50)  DEFAULT '🏅',
  `require_credit_deduction` TINYINT(1) DEFAULT 0,
  `credit_cost`  DECIMAL(5,2) DEFAULT 0.00 COMMENT '申请时扣除德育分数量',
  `credit_reward` DECIMAL(5,2) DEFAULT 0.00 COMMENT '审批通过后赠送德育积分',
  `status`       TINYINT      DEFAULT 1,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `honor_categories` (`id`,`name`,`level`,`template_url`,`description`,`icon`) VALUES
  ( 1,'国家奖学金',              '国家级','/assets/honors/national_scholarship.png','综合测评成绩位年级前5%且无违纪记录','🥇'),
  ( 2,'国家励志奖学金',          '国家级','/assets/honors/national_encourage.png','品学兼优且家庭经济困难的学生','🎖️'),
  ( 3,'全国职业院校技能大赛一等奖','国家级','/assets/honors/skills_competition.png','全国职业院校技能竞赛获一等奖','🏆'),
  ( 4,'省级三好学生',            '省部级','/assets/honors/provincial_good_student.png','省教育厅认定的三好学生','🌟'),
  ( 5,'省级优秀学生干部',        '省部级','/assets/honors/provincial_cadre.png','省级优秀学生干部荣誉','⭐'),
  ( 6,'省部级科技竞赛一等奖',    '省部级','/assets/honors/provincial_tech.png','省部级科技竞赛获一等奖','🔬'),
  ( 7,'优秀学生干部',            '校级',  '/assets/honors/excellent_cadre.png','校级优秀学生干部表彰','👑'),
  ( 8,'三好学生',                '校级',  '/assets/honors/good_student.png','校级三好学生荣誉','📚'),
  ( 9,'校级一等奖学金',          '校级',  '/assets/honors/school_scholarship_1.png','本学年学业成绩全院前3%','💰'),
  (10,'校级科技创新一等奖',      '校级',  '/assets/honors/school_innovation.png','校级科技创新大赛一等奖','💡');


-- ============================================================
--  TABLE: honor_applications
-- ============================================================
CREATE TABLE `honor_applications` (
  `id`            BIGINT AUTO_INCREMENT PRIMARY KEY,
  `student_id`    VARCHAR(50) NOT NULL,
  `category_id`   BIGINT      NOT NULL,
  `proof_urls`    JSON        NOT NULL,
  `description`   TEXT,
  `credit_deducted` TINYINT(1) DEFAULT 0,
  `status`        VARCHAR(20) DEFAULT 'pending',
  `reviewer_id`   VARCHAR(50),
  `reject_reason` VARCHAR(255),
  `created_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`)  REFERENCES `student`(`id`)           ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `honor_categories`(`id`)  ON DELETE CASCADE,
  INDEX `idx_honor_student_status` (`student_id`, `status`),
  INDEX `idx_honor_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `honor_applications` (`student_id`,`category_id`,`proof_urls`,`description`,`status`,`reviewer_id`,`reject_reason`) VALUES
  ('student_002',1,'["http://localhost:3000/uploads/proof1.pdf"]','本学年综合成绩全院第一，GPA4.5，积极参与学术竞赛','approved','admin_sys',NULL),
  ('student_003',8,'["http://localhost:3000/uploads/proof2.pdf"]','连续两学期综合测评第一，积极参与学生活动','approved','college_001',NULL),
  ('student_001',9,'["http://localhost:3000/uploads/proof3.pdf"]','本学年学业成绩优秀，GPA3.9','pending',NULL,NULL),
  ('student_001',7,'[]','连续两学期综合排名前5%，三好学生评定申请','pending',NULL,NULL),
  ('student_005',4,'[]','省级演讲比赛获奖，积极参与校园文化活动','approved','admin_sys',NULL),
  ('student_003',9,'[]','本学年学业成绩优秀，申请校级一等奖学金','rejected','su_001','材料不足，请补充本学年成绩证明');


-- ============================================================
--  TABLE: student_honors
-- ============================================================
CREATE TABLE `student_honors` (
  `id`             BIGINT AUTO_INCREMENT PRIMARY KEY,
  `student_id`     VARCHAR(50) NOT NULL,
  `category_id`    BIGINT      NOT NULL,
  `application_id` BIGINT,
  `issue_date`     DATE        NOT NULL,
  `issuer`         VARCHAR(100) NOT NULL,
  `created_at`     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`)     REFERENCES `student`(`id`)              ON DELETE CASCADE,
  FOREIGN KEY (`category_id`)    REFERENCES `honor_categories`(`id`)     ON DELETE CASCADE,
  FOREIGN KEY (`application_id`) REFERENCES `honor_applications`(`id`)   ON DELETE SET NULL,
  INDEX `idx_honor_student_issue` (`student_id`, `issue_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `student_honors` (`student_id`,`category_id`,`application_id`,`issue_date`,`issuer`) VALUES
  ('student_002',1,1,'2025-12-15','教育部全国学生资助管理中心'),
  ('student_003',8,2,'2025-11-20','某某大学学工处'),
  ('student_005',4,5,'2026-01-10','省教育厅');


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  VIEW: student_credit_balance (V4.1: 初始分改为 0)
-- ============================================================
CREATE OR REPLACE VIEW `student_credit_balance` AS
SELECT
  s.id AS student_id,
  s.name AS student_name,
  COALESCE(
    SUM(CASE WHEN mc.status = 'approved' THEN mc.credit_change ELSE 0 END),
    0
  ) AS balance,
  COALESCE(
    SUM(CASE WHEN mc.status = 'approved' AND mc.credit_change > 0 THEN mc.credit_change ELSE 0 END),
    0
  ) AS total_add,
  COALESCE(
    ABS(SUM(CASE WHEN mc.status = 'approved' AND mc.credit_change < 0 THEN mc.credit_change ELSE 0 END)),
    0
  ) AS total_deduct
FROM student s
LEFT JOIN moral_credit mc ON mc.student_id = s.id
WHERE s.id LIKE 'student%'
GROUP BY s.id, s.name;

-- ============================================================
--  备份完成  V4.1 (2026-04-09)
--  恢复命令: mysql -u root -p123456 < sudt_db_backup.sql
-- ============================================================
