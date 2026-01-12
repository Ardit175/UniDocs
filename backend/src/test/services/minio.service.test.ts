import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock minio module before importing the service
const mockBucketExists = jest.fn();
const mockMakeBucket = jest.fn();
const mockSetBucketPolicy = jest.fn();
const mockPutObject = jest.fn();
const mockGetObject = jest.fn();
const mockPresignedGetObject = jest.fn();
const mockRemoveObject = jest.fn();
const mockStatObject = jest.fn();

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: mockBucketExists,
    makeBucket: mockMakeBucket,
    setBucketPolicy: mockSetBucketPolicy,
    putObject: mockPutObject,
    getObject: mockGetObject,
    presignedGetObject: mockPresignedGetObject,
    removeObject: mockRemoveObject,
    statObject: mockStatObject,
  })),
}));

// Import after mocking
import {
  initializeBucket,
  uploadFile,
  downloadFile,
  getPresignedUrl,
  deleteFile,
  fileExists,
} from '../../services/minio.service';

describe('MinIO Service', () => {
  const BUCKET_NAME = 'unidocs-documents';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeBucket', () => {
    it('should create bucket if it does not exist', async () => {
      mockBucketExists.mockResolvedValue(false);
      mockMakeBucket.mockResolvedValue(undefined);
      mockSetBucketPolicy.mockResolvedValue(undefined);

      await initializeBucket();

      expect(mockBucketExists).toHaveBeenCalledWith(BUCKET_NAME);
      expect(mockMakeBucket).toHaveBeenCalledWith(BUCKET_NAME, 'us-east-1');
      expect(mockSetBucketPolicy).toHaveBeenCalled();
    });

    it('should not create bucket if it already exists', async () => {
      mockBucketExists.mockResolvedValue(true);

      await initializeBucket();

      expect(mockBucketExists).toHaveBeenCalledWith(BUCKET_NAME);
      expect(mockMakeBucket).not.toHaveBeenCalled();
    });

    it('should throw error if bucket creation fails', async () => {
      mockBucketExists.mockResolvedValue(false);
      mockMakeBucket.mockRejectedValue(new Error('Failed to create bucket'));

      await expect(initializeBucket()).rejects.toThrow('Failed to create bucket');
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      mockPutObject.mockResolvedValue(undefined);
      const buffer = Buffer.from('test content');
      const filePath = 'documents/test.pdf';

      const result = await uploadFile(filePath, buffer, 'application/pdf');

      expect(mockPutObject).toHaveBeenCalledWith(
        BUCKET_NAME,
        filePath,
        buffer,
        buffer.length,
        { 'Content-Type': 'application/pdf' }
      );
      expect(result).toBe(filePath);
    });

    it('should throw error if upload fails', async () => {
      mockPutObject.mockRejectedValue(new Error('Upload failed'));

      await expect(uploadFile('test.pdf', Buffer.from('test'))).rejects.toThrow('Upload failed');
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const content = Buffer.from('file content');
      const mockStream: { on: jest.Mock } = {
        on: jest.fn(function(this: { on: jest.Mock }, event: string, handler: (arg?: any) => void) {
          if (event === 'data') handler(content);
          if (event === 'end') setImmediate(() => handler());
          return this;
        }),
      };
      mockGetObject.mockResolvedValue(mockStream);

      const result = await downloadFile('test.pdf');

      expect(result.toString()).toBe('file content');
    });

    it('should throw error if download fails', async () => {
      mockGetObject.mockRejectedValue(new Error('Download failed'));

      await expect(downloadFile('test.pdf')).rejects.toThrow('Download failed');
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL with default expiry', async () => {
      mockPresignedGetObject.mockResolvedValue('https://signed-url.com');

      const result = await getPresignedUrl('test.pdf');

      expect(mockPresignedGetObject).toHaveBeenCalledWith(BUCKET_NAME, 'test.pdf', 3600);
      expect(result).toBe('https://signed-url.com');
    });

    it('should generate presigned URL with custom expiry', async () => {
      mockPresignedGetObject.mockResolvedValue('https://signed-url.com');

      const result = await getPresignedUrl('test.pdf', 7200);

      expect(mockPresignedGetObject).toHaveBeenCalledWith(BUCKET_NAME, 'test.pdf', 7200);
      expect(result).toBe('https://signed-url.com');
    });

    it('should throw error if URL generation fails', async () => {
      mockPresignedGetObject.mockRejectedValue(new Error('Generation failed'));

      await expect(getPresignedUrl('test.pdf')).rejects.toThrow('Generation failed');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockRemoveObject.mockResolvedValue(undefined);

      await deleteFile('test.pdf');

      expect(mockRemoveObject).toHaveBeenCalledWith(BUCKET_NAME, 'test.pdf');
    });

    it('should throw error if deletion fails', async () => {
      mockRemoveObject.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteFile('test.pdf')).rejects.toThrow('Delete failed');
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      mockStatObject.mockResolvedValue({ size: 1024 });

      const result = await fileExists('test.pdf');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      mockStatObject.mockRejectedValue(new Error('Not found'));

      const result = await fileExists('test.pdf');

      expect(result).toBe(false);
    });
  });
});
