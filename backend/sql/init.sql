-- 初始化数据库（MySQL 8+）
-- 建议字符集：utf8mb4

CREATE DATABASE IF NOT EXISTS `daohang`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `daohang`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` VARCHAR(50) NOT NULL COMMENT '登录账号，唯一',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希，不存明文',
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '用户类型',
  `nickname` VARCHAR(100) DEFAULT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像地址',
  `email` VARCHAR(120) DEFAULT NULL COMMENT '邮箱，可空',
  `phone` VARCHAR(30) DEFAULT NULL COMMENT '手机号，可空',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1正常 0禁用',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户';

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `token` VARCHAR(255) NOT NULL COMMENT '登录token或会话token',
  `refresh_token` VARCHAR(255) DEFAULT NULL COMMENT '刷新token，可空',
  `login_ip` VARCHAR(64) DEFAULT NULL COMMENT '登录IP',
  `user_agent` VARCHAR(255) DEFAULT NULL COMMENT '登录设备UA',
  `login_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `expire_at` DATETIME DEFAULT NULL COMMENT '过期时间',
  `logout_at` DATETIME DEFAULT NULL COMMENT '退出时间',
  `is_valid` TINYINT NOT NULL DEFAULT 1 COMMENT '是否有效：1有效 0失效',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_sessions_token` (`token`),
  UNIQUE KEY `uk_user_sessions_refresh_token` (`refresh_token`),
  KEY `idx_user_sessions_user_id` (`user_id`),
  KEY `idx_user_sessions_is_valid` (`is_valid`),
  KEY `idx_user_sessions_expire_at` (`expire_at`),
  CONSTRAINT `fk_user_sessions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户登录会话';

CREATE TABLE IF NOT EXISTS `nav_groups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID',
  `is_public` TINYINT NOT NULL DEFAULT 0 COMMENT '是否公共导航：1公共 0私有',
  `name` VARCHAR(100) NOT NULL COMMENT '分组名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '分组描述',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
  `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认分组',
  `is_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1启用 0停用',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_nav_groups_user_id` (`user_id`),
  KEY `idx_nav_groups_sort_order` (`sort_order`),
  KEY `idx_nav_groups_is_enabled` (`is_enabled`),
  KEY `idx_nav_groups_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_nav_groups_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导航分组';

CREATE TABLE IF NOT EXISTS `nav_links` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID',
  `group_id` BIGINT UNSIGNED NOT NULL COMMENT '所属分组ID',
  `is_public` TINYINT NOT NULL DEFAULT 0 COMMENT '是否公共导航：1公共 0私有',
  `title` VARCHAR(120) NOT NULL COMMENT '网址名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '网址描述',
  `url_local` VARCHAR(500) DEFAULT NULL COMMENT '本地模式地址',
  `url_online` VARCHAR(500) DEFAULT NULL COMMENT '外网模式地址',
  `icon_url` VARCHAR(500) DEFAULT NULL COMMENT '图标地址 / favicon 地址',
  `open_mode` ENUM('_blank', '_self') NOT NULL DEFAULT '_blank' COMMENT '打开方式',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
  `is_enabled` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1启用 0停用',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_nav_links_user_id` (`user_id`),
  KEY `idx_nav_links_group_id` (`group_id`),
  KEY `idx_nav_links_sort_order` (`sort_order`),
  KEY `idx_nav_links_is_enabled` (`is_enabled`),
  KEY `idx_nav_links_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_nav_links_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nav_links_group_id` FOREIGN KEY (`group_id`) REFERENCES `nav_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导航链接';

CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `theme_mode` ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'system' COMMENT '主题模式',
  `jump_mode` ENUM('local', 'online') NOT NULL DEFAULT 'online' COMMENT '跳转模式',
  `search_engine` VARCHAR(50) NOT NULL DEFAULT 'bing' COMMENT '默认搜索引擎',
  `show_public_nav` TINYINT NOT NULL DEFAULT 1 COMMENT '是否显示公共导航：1显示 0隐藏',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_settings_user_id` (`user_id`),
  CONSTRAINT `fk_user_settings_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户个性化设置';

CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作用户ID，可空',
  `action` VARCHAR(100) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) DEFAULT NULL COMMENT '操作对象类型',
  `target_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作对象ID',
  `detail` JSON DEFAULT NULL COMMENT '扩展详情JSON',
  `ip` VARCHAR(64) DEFAULT NULL COMMENT '来源IP',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_operation_logs_user_id` (`user_id`),
  KEY `idx_operation_logs_action` (`action`),
  KEY `idx_operation_logs_created_at` (`created_at`),
  CONSTRAINT `fk_operation_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志';
