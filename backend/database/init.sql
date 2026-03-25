CREATE DATABASE IF NOT EXISTS exhibition_saas DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE exhibition_saas;

CREATE TABLE IF NOT EXISTS users (
    userId VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    organizerId VARCHAR(36),
    exhibitionId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_organizer (organizerId),
    INDEX idx_exhibition (exhibitionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organizers (
    organizerId VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    package VARCHAR(20) DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'active',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exhibitions (
    exhibitionId VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    organizerId VARCHAR(36) NOT NULL,
    description TEXT,
    startDate DATE,
    endDate DATE,
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'upcoming',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizerId) REFERENCES organizers(organizerId) ON DELETE CASCADE,
    INDEX idx_organizer (organizerId),
    INDEX idx_dates (startDate, endDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchants (
    merchantId VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    organizerId VARCHAR(36) NOT NULL,
    exhibitionId VARCHAR(36) NOT NULL,
    contact VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    boothNumber VARCHAR(50),
    category VARCHAR(50),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizerId) REFERENCES organizers(organizerId) ON DELETE CASCADE,
    FOREIGN KEY (exhibitionId) REFERENCES exhibitions(exhibitionId) ON DELETE CASCADE,
    INDEX idx_organizer (organizerId),
    INDEX idx_exhibition (exhibitionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS connections (
    connectionId VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    merchantId VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (merchantId) REFERENCES merchants(merchantId) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_merchant (merchantId),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materials (
    materialId VARCHAR(36) PRIMARY KEY,
    merchantId VARCHAR(36) NOT NULL,
    type VARCHAR(50),
    title VARCHAR(200),
    fileUrl VARCHAR(500),
    downloadCount INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchantId) REFERENCES merchants(merchantId) ON DELETE CASCADE,
    INDEX idx_merchant (merchantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS virtual_rooms (
    roomId VARCHAR(36) PRIMARY KEY,
    merchantId VARCHAR(36) NOT NULL,
    name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchantId) REFERENCES merchants(merchantId) ON DELETE CASCADE,
    INDEX idx_merchant (merchantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_records (
    recordId VARCHAR(36) PRIMARY KEY,
    roomId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    userType VARCHAR(20),
    content TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room (roomId),
    INDEX idx_user (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
    activityId VARCHAR(36) PRIMARY KEY,
    exhibitionId VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    description TEXT,
    startDate TIMESTAMP,
    endDate TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exhibitionId) REFERENCES exhibitions(exhibitionId) ON DELETE CASCADE,
    INDEX idx_exhibition (exhibitionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prizes (
    prizeId VARCHAR(36) PRIMARY KEY,
    activityId VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    quantity INT,
    value DECIMAL(10, 2),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activityId) REFERENCES activities(activityId) ON DELETE CASCADE,
    INDEX idx_activity (activityId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotas (
    quotaId VARCHAR(36) PRIMARY KEY,
    organizerId VARCHAR(36) NOT NULL,
    package VARCHAR(20) NOT NULL,
    maxExhibitions INT,
    maxUsers INT,
    maxMerchants INT,
    maxVirtualRooms INT,
    startDate DATE,
    endDate DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizerId) REFERENCES organizers(organizerId) ON DELETE CASCADE,
    INDEX idx_organizer (organizerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_recommendations (
    recommendationId VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    merchantId VARCHAR(36) NOT NULL,
    score DECIMAL(5, 2),
    reason TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (userId),
    INDEX idx_merchant (merchantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_preferences (
    preferenceId VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    category VARCHAR(50),
    value VARCHAR(200),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    notificationId VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36),
    type VARCHAR(50),
    content TEXT,
    read BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (userId),
    INDEX idx_read (read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (userId, username, password, role, status) VALUES
('admin-001', 'admin', '$2b$10$rKz7QZ6X7Z8Q9X0Y1Z2Z3eY4Z5Z6Z7Z8Z9Z0Z1Z2Z3Z4Z5Z6Z7Z8Z9Z0Z1Z2Z3', 'admin', 'active');
