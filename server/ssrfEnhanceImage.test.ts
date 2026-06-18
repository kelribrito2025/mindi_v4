import { describe, it, expect } from 'vitest';
import { validateImageUrl } from './imageEnhancer';

describe('SSRF Protection - validateImageUrl', () => {
  // URLs que devem ser PERMITIDAS
  describe('URLs permitidas (whitelist)', () => {
    it('deve aceitar URL do S3 amazonaws', () => {
      expect(() => validateImageUrl('https://mybucket.s3.us-east-1.amazonaws.com/image.jpg')).not.toThrow();
    });

    it('deve aceitar URL do S3 legacy', () => {
      expect(() => validateImageUrl('https://mybucket.s3.amazonaws.com/image.jpg')).not.toThrow();
    });

    it('deve aceitar URL do CloudFront', () => {
      expect(() => validateImageUrl('https://d1234.cloudfront.net/image.webp')).not.toThrow();
    });

    it('deve aceitar URL do Manus space', () => {
      expect(() => validateImageUrl('https://app.manus.space/uploads/image.png')).not.toThrow();
    });

    it('deve aceitar URL do Manus im', () => {
      expect(() => validateImageUrl('https://api.manus.im/storage/image.jpg')).not.toThrow();
    });
  });

  // URLs que devem ser BLOQUEADAS
  describe('URLs bloqueadas (SSRF)', () => {
    it('deve rejeitar localhost', () => {
      expect(() => validateImageUrl('https://localhost/api/secret')).toThrow('URLs internas não são permitidas');
    });

    it('deve rejeitar 127.0.0.1', () => {
      expect(() => validateImageUrl('https://127.0.0.1/api/secret')).toThrow('URLs internas não são permitidas');
    });

    it('deve rejeitar 0.0.0.0', () => {
      expect(() => validateImageUrl('https://0.0.0.0/api/secret')).toThrow('URLs internas não são permitidas');
    });

    it('deve rejeitar IPv6 loopback', () => {
      expect(() => validateImageUrl('https://[::1]/api/secret')).toThrow();
    });

    it('deve rejeitar IP privado 10.x', () => {
      expect(() => validateImageUrl('https://10.0.0.1/internal')).toThrow('URLs internas não são permitidas');
    });

    it('deve rejeitar IP privado 192.168.x', () => {
      expect(() => validateImageUrl('https://192.168.1.1/admin')).toThrow('URLs internas não são permitidas');
    });

    it('deve rejeitar IP privado 172.x', () => {
      expect(() => validateImageUrl('https://172.16.0.1/internal')).toThrow('URLs internas não são permitidas');
    });

    it('deve rejeitar domínio .local', () => {
      expect(() => validateImageUrl('https://myserver.local/file')).toThrow('URLs internas não são permitidas');
    });

    it('deve rejeitar domínio .internal', () => {
      expect(() => validateImageUrl('https://db.internal/dump')).toThrow('URLs internas não são permitidas');
    });

    it('deve rejeitar protocolo HTTP (não HTTPS)', () => {
      expect(() => validateImageUrl('http://mybucket.s3.us-east-1.amazonaws.com/image.jpg')).toThrow('Apenas URLs HTTPS são permitidas');
    });

    it('deve rejeitar domínio não autorizado', () => {
      expect(() => validateImageUrl('https://evil-server.com/steal-data')).toThrow('Domínio não permitido');
    });

    it('deve rejeitar domínio genérico', () => {
      expect(() => validateImageUrl('https://example.com/image.jpg')).toThrow('Domínio não permitido');
    });

    it('deve rejeitar URL inválida', () => {
      expect(() => validateImageUrl('not-a-url')).toThrow('URL da imagem inválida');
    });

    it('deve rejeitar protocolo file://', () => {
      expect(() => validateImageUrl('file:///etc/passwd')).toThrow('Apenas URLs HTTPS são permitidas');
    });

    it('deve rejeitar protocolo ftp://', () => {
      expect(() => validateImageUrl('ftp://server.com/file')).toThrow('Apenas URLs HTTPS são permitidas');
    });
  });
});
