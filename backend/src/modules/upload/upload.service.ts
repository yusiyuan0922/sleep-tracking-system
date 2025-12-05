import { Injectable, BadRequestException } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private minioClient: MinioClient;
  private bucket: string;

  constructor() {
    // 只有在配置了 MinIO 时才初始化客户端
    if (
      process.env.MINIO_ACCESS_KEY &&
      process.env.MINIO_SECRET_KEY &&
      process.env.MINIO_BUCKET
    ) {
      this.bucket = process.env.MINIO_BUCKET;
      this.minioClient = new MinioClient({
        endPoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000'),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
      });

      // 确保 bucket 存在
      this.ensureBucketExists();
    }
  }

  /**
   * 确保 bucket 存在,如果不存在则创建并设置公开读策略
   */
  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket, 'us-east-1');

        // 设置公开读策略
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(
          this.bucket,
          JSON.stringify(policy),
        );
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error.message);
    }
  }

  /**
   * 上传文件到 MinIO
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

    // 检查 MinIO 是否已配置
    if (!this.minioClient) {
      throw new BadRequestException('MinIO未配置,请联系管理员配置MinIO服务');
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
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const objectName = `${folder}/${year}/${month}/${fileName}`;

      // 上传到 MinIO
      await this.minioClient.putObject(
        this.bucket,
        objectName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      // 手动生成 URL
      const publicEndpoint =
        process.env.MINIO_PUBLIC_ENDPOINT || 'http://localhost:9000';
      const url = `${publicEndpoint}/${this.bucket}/${objectName}`;

      return {
        url,
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
   * 删除 MinIO 文件
   */
  async deleteFile(objectName: string): Promise<void> {
    if (!this.minioClient) {
      throw new BadRequestException('MinIO未配置');
    }

    try {
      // objectName 可能包含完整URL,需要提取路径
      let pathToDelete = objectName;

      // 如果是完整URL,提取路径部分
      if (objectName.includes(this.bucket)) {
        const urlParts = objectName.split(`${this.bucket}/`);
        if (urlParts.length > 1) {
          pathToDelete = urlParts[1];
        }
      }

      await this.minioClient.removeObject(this.bucket, pathToDelete);
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
