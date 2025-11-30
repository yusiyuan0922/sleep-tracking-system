const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seedAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'sleep_tracking',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 检查是否已存在超级管理员
    const checkResult = await client.query(
      "SELECT * FROM admins WHERE username = 'admin'"
    );

    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists!');
      return;
    }

    // 创建超级管理员密码哈希
    const password = 'admin123'; // 默认密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入超级管理员
    const result = await client.query(
      `INSERT INTO admins (username, password, real_name, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, username, real_name, role`,
      ['admin', hashedPassword, '超级管理员', 'super_admin', 'active']
    );

    console.log('✅ Super admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: super_admin');
    console.log('Admin ID:', result.rows[0].id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

seedAdmin();
