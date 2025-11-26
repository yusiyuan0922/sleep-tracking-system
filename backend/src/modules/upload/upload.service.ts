import { Injectable, BadRequestException } from '@nestjs/common';
import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private ossClient: OSS;

  constructor() {
    // 只有在配置了OSS时才初始化客户端
    if (
      process.env.OSS_ACCESS_KEY_ID &&
      process.env.OSS_ACCESS_KEY_SECRET &&
      process.env.OSS_BUCKET
    ) {
      this.ossClient = new OSS({
        region: process.env.OSS_REGION || 'oss-cn-hangzhou',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucket: process.env.OSS_BUCKET,
      });
    }
  }

  /**
   * 上传文件到OSS
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }> {
    if (!file) {
      throw new BadRequestException('文件不能为空');
    }

    // 检查OSS是否已配置
    if (!this.ossClient) {
      throw new BadRequestException('OSS未配置,请联系管理员配置OSS服务');
    }

    // 验证文件大小 (最大10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('文件大小不能超过10MB');
    }

    // 验证文件类型
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }

    try {
      // 生成唯一文件名
      const ext = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${ext}`;
      const ossPath = `${folder}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

      // 上传到OSS
      const result = await this.ossClient.put(ossPath, file.buffer);

      return {
        url: result.url,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: this.getFileType(file.mimetype),
      };
    } catch (error) {
      throw new BadRequestException(`文件上传失败: ${error.message}`);
    }
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'general',
  ): Promise<
    {
      url: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    }[]
  > {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * 删除OSS文件
   */
  async deleteFile(ossPath: string): Promise<void> {
    try {
      await this.ossClient.delete(ossPath);
    } catch (error) {
      throw new BadRequestException(`文件删除失败: ${error.message}`);
    }
  }

  /**
   * 获取文件类型
   */
  private getFileType(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype === 'application/pdf') {
      return 'pdf';
    } else if (
      mimetype === 'application/msword' ||
      mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return 'doc';
    }
    return 'other';
  }
}
