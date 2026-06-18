import { describe, it, expect } from 'vitest';
import { mindiStoragePut, mindiStorageGet, isMindiStorageConfigured } from './mindiStorage';

describe('Mindi Storage (S3 próprio)', () => {
  it('should have S3 credentials configured', () => {
    expect(isMindiStorageConfigured()).toBe(true);
  });

  it('should upload and retrieve an image file', async () => {
    // Criar uma imagem de teste simples (1x1 pixel PNG)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixels
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82
    ]);

    const testKey = `test/upload-test-${Date.now()}.png`;

    // Upload
    const uploadResult = await mindiStoragePut(testKey, pngHeader, 'image/png');
    
    expect(uploadResult.key).toBe(testKey);
    expect(uploadResult.url).toContain('s3.');
    expect(uploadResult.url).toContain('.amazonaws.com');
    expect(uploadResult.url).toContain(testKey);

    // Verificar se a URL é acessível
    const response = await fetch(uploadResult.url);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    // Get URL
    const getResult = await mindiStorageGet(testKey);
    expect(getResult.url).toBe(uploadResult.url);
  }, 30000);

  it('should generate correct public URL format', async () => {
    const testKey = 'products/123/test.jpg';
    const result = await mindiStorageGet(testKey);
    
    // Verificar formato da URL
    expect(result.url).toMatch(/^https:\/\/.*\.s3\..*\.amazonaws\.com\/products\/123\/test\.jpg$/);
  });
});
