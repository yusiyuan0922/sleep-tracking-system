// 配置文件

/**
 * 获取 API 基础 URL
 * 根据运行环境自动选择合适的 URL
 */
function getBaseURL(): string {
  // 生产环境使用线上域名
  if (process.env.NODE_ENV === 'production') {
    return 'https://your-domain.com'; // TODO: 替换为实际的生产环境域名
  }

  // 开发环境
  // 1. 微信开发者工具模拟器：使用 localhost
  // 2. 真机调试：使用局域网 IP
  // 建议在真机调试时手动修改为电脑的局域网 IP 地址

  // 默认使用 localhost（适用于开发者工具）
  // 真机调试时需要修改为你的电脑 IP
  // return 'http://localhost:3000'; // 开发者工具模拟器使用
  return 'http://192.168.1.6:3000'; // 真机调试使用（你的电脑 IP）
}

export const config = {
  // API基础URL
  baseURL: getBaseURL(),

  // 超时时间
  timeout: 10000,

  // Token存储key
  tokenKey: 'access_token',

  // 用户信息存储key
  userInfoKey: 'user_info',
};

export default config;
