const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    });
    
    console.log('MySQL连接成功');
    
    const [rows] = await connection.execute('SHOW DATABASES LIKE ?', ['exhibition_saas']);
    console.log('数据库查询结果:', rows);
    
    if (rows.length === 0) {
      console.log('数据库exhibition_saas不存在，需要创建');
    } else {
      console.log('数据库exhibition_saas已存在');
      
      const [tables] = await connection.execute('USE exhibition_saas; SHOW TABLES;');
      console.log('数据表:', tables);
    }
    
    await connection.end();
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  }
}

testConnection();
