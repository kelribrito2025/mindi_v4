import { describe, it, expect } from 'vitest';
import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

describe('S3 Credentials Validation', () => {
  const s3Client = new S3Client({
    region: process.env.MINDI_S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINDI_S3_ACCESS_KEY || '',
      secretAccessKey: process.env.MINDI_S3_SECRET_KEY || '',
    },
  });

  const bucketName = process.env.MINDI_S3_BUCKET || '';

  it('should have S3 credentials configured', () => {
    expect(process.env.MINDI_S3_BUCKET).toBeDefined();
    expect(process.env.MINDI_S3_REGION).toBeDefined();
    expect(process.env.MINDI_S3_ACCESS_KEY).toBeDefined();
    expect(process.env.MINDI_S3_SECRET_KEY).toBeDefined();
    expect(process.env.MINDI_S3_BUCKET).not.toBe('');
    expect(process.env.MINDI_S3_ACCESS_KEY).not.toBe('');
    expect(process.env.MINDI_S3_SECRET_KEY).not.toBe('');
  });

  it('should be able to upload and retrieve a test file from S3', async () => {
    const testKey = `test-${Date.now()}.txt`;
    const testContent = 'Hello from Mindi S3 test!';

    // Upload test file
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    const putResult = await s3Client.send(putCommand);
    expect(putResult.$metadata.httpStatusCode).toBe(200);

    // Verify the file exists by getting it
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    });

    const getResult = await s3Client.send(getCommand);
    expect(getResult.$metadata.httpStatusCode).toBe(200);
    
    const bodyContent = await getResult.Body?.transformToString();
    expect(bodyContent).toBe(testContent);

    // Clean up - delete test file
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    });

    const deleteResult = await s3Client.send(deleteCommand);
    expect(deleteResult.$metadata.httpStatusCode).toBe(204);
  }, 30000); // 30 second timeout for S3 operations
});
