import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'unidocs-documents';

/**
 * Initialize MinIO bucket
 */
export const initializeBucket = async (): Promise<void> => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ MinIO bucket "${BUCKET_NAME}" created successfully`);
      
      // Set bucket policy for public read access to documents
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log('✅ MinIO bucket policy set successfully');
    } else {
      console.log(`✅ MinIO bucket "${BUCKET_NAME}" already exists`);
    }
  } catch (error) {
    console.error('❌ Error initializing MinIO bucket:', error);
    throw error;
  }
};

/**
 * Upload a file to MinIO
 */
export const uploadFile = async (
  filePath: string,
  buffer: Buffer,
  contentType: string = 'application/pdf'
): Promise<string> => {
  try {
    await minioClient.putObject(BUCKET_NAME, filePath, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    
    return filePath;
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw error;
  }
};

/**
 * Download a file from MinIO
 */
export const downloadFile = async (filePath: string): Promise<Buffer> => {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, filePath);
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading file from MinIO:', error);
    throw error;
  }
};

/**
 * Get presigned URL for file download
 */
export const getPresignedUrl = async (
  filePath: string,
  expirySeconds: number = 3600
): Promise<string> => {
  try {
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      filePath,
      expirySeconds
    );
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

/**
 * Delete a file from MinIO
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await minioClient.removeObject(BUCKET_NAME, filePath);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw error;
  }
};

/**
 * Check if file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await minioClient.statObject(BUCKET_NAME, filePath);
    return true;
  } catch (error) {
    return false;
  }
};

export default minioClient;
