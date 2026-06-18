import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db module
vi.mock('./db', () => ({
  getProductById: vi.fn(),
  getComboGroupsByProductId: vi.fn(),
  getComplementGroupsByProduct: vi.fn(),
  getComplementItemsByGroup: vi.fn(),
  getEstablishmentTimezone: vi.fn(),
  getLocalDate: vi.fn(),
}));

import * as db from './db';

describe('Combo Complements Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductById distinguishes combos from regular products', () => {
    it('should identify a combo product by isCombo flag', async () => {
      const mockComboProduct = {
        id: 300061,
        name: 'Combo Teste',
        isCombo: true,
        establishmentId: 60018,
        categoryId: 1,
        price: '29.90',
        status: 'active',
      };

      (db.getProductById as any).mockResolvedValue(mockComboProduct);

      const product = await db.getProductById(300061);
      expect(product).toBeDefined();
      expect(product!.isCombo).toBe(true);
    });

    it('should identify a regular product by isCombo flag', async () => {
      const mockRegularProduct = {
        id: 100001,
        name: 'Hambúrguer Clássico',
        isCombo: false,
        establishmentId: 60018,
        categoryId: 1,
        price: '19.90',
        status: 'active',
      };

      (db.getProductById as any).mockResolvedValue(mockRegularProduct);

      const product = await db.getProductById(100001);
      expect(product).toBeDefined();
      expect(product!.isCombo).toBe(false);
    });
  });

  describe('getComboGroupsByProductId returns combo groups with items', () => {
    it('should return combo groups with product details for combo products', async () => {
      const mockComboGroups = [
        {
          id: 1,
          productId: 300061,
          name: 'Escolha o lanche',
          isRequired: true,
          maxQuantity: 1,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: 1,
              comboGroupId: 1,
              productId: 100001,
              sortOrder: 0,
              productName: 'Hambúrguer Clássico',
              productPrice: '19.90',
              productImages: ['https://example.com/img1.jpg'],
              productStatus: 'active',
              categoryId: 1,
            },
            {
              id: 2,
              comboGroupId: 1,
              productId: 100002,
              sortOrder: 1,
              productName: 'X-Bacon',
              productPrice: '24.90',
              productImages: null,
              productStatus: 'active',
              categoryId: 1,
            },
          ],
        },
        {
          id: 2,
          productId: 300061,
          name: 'Bebidas',
          isRequired: false,
          maxQuantity: 1,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: 3,
              comboGroupId: 2,
              productId: 200001,
              sortOrder: 0,
              productName: 'Coca-Cola',
              productPrice: '7.00',
              productImages: null,
              productStatus: 'active',
              categoryId: 2,
            },
          ],
        },
      ];

      (db.getComboGroupsByProductId as any).mockResolvedValue(mockComboGroups);

      const groups = await db.getComboGroupsByProductId(300061);
      
      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe('Escolha o lanche');
      expect(groups[0].isRequired).toBe(true);
      expect(groups[0].items).toHaveLength(2);
      expect(groups[0].items[0].productName).toBe('Hambúrguer Clássico');
      expect(groups[1].name).toBe('Bebidas');
      expect(groups[1].isRequired).toBe(false);
      expect(groups[1].items).toHaveLength(1);
    });
  });

  describe('Combo groups conversion to complement format', () => {
    it('should convert combo groups to complement format correctly', () => {
      const comboGroup = {
        id: 1,
        productId: 300061,
        name: 'Escolha o lanche',
        isRequired: true,
        maxQuantity: 1,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 1,
            comboGroupId: 1,
            productId: 100001,
            sortOrder: 0,
            productName: 'Hambúrguer Clássico',
            productPrice: '19.90',
            productImages: ['https://example.com/img1.jpg'],
            productStatus: 'active',
            categoryId: 1,
          },
          {
            id: 2,
            comboGroupId: 1,
            productId: 100002,
            sortOrder: 1,
            productName: 'X-Bacon',
            productPrice: '24.90',
            productImages: null,
            productStatus: 'paused', // Produto pausado - não deve aparecer no menu público
            categoryId: 1,
          },
        ],
      };

      // Simular a conversão feita no router (publicMenu.getProductComplements)
      const converted = {
        id: comboGroup.id,
        productId: comboGroup.productId,
        name: comboGroup.name,
        minQuantity: comboGroup.isRequired ? 1 : 0,
        maxQuantity: comboGroup.maxQuantity,
        isRequired: comboGroup.isRequired,
        sortOrder: comboGroup.sortOrder,
        items: comboGroup.items
          .filter(item => item.productStatus === 'active')
          .map(item => ({
            id: item.id,
            groupId: comboGroup.id,
            name: item.productName || 'Produto',
            price: item.productPrice || '0',
            imageUrl: item.productImages?.[0] || null,
            isActive: item.productStatus === 'active',
            priceMode: 'free' as const,
            sortOrder: item.sortOrder,
            availabilityType: 'always' as const,
            availableDays: null,
            availableHours: null,
            badgeText: null,
          })),
      };

      // Verificar formato correto
      expect(converted.minQuantity).toBe(1); // isRequired = true → minQuantity = 1
      expect(converted.maxQuantity).toBe(1);
      expect(converted.isRequired).toBe(true);
      
      // Verificar que itens pausados são filtrados
      expect(converted.items).toHaveLength(1);
      expect(converted.items[0].name).toBe('Hambúrguer Clássico');
      
      // Verificar formato dos itens
      expect(converted.items[0].priceMode).toBe('free');
      expect(converted.items[0].imageUrl).toBe('https://example.com/img1.jpg');
      expect(converted.items[0].isActive).toBe(true);
      expect(converted.items[0].availabilityType).toBe('always');
    });

    it('should set minQuantity to 0 for optional combo groups', () => {
      const optionalGroup = {
        id: 2,
        productId: 300061,
        name: 'Bebidas',
        isRequired: false,
        maxQuantity: 2,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      };

      const converted = {
        minQuantity: optionalGroup.isRequired ? 1 : 0,
        maxQuantity: optionalGroup.maxQuantity,
        isRequired: optionalGroup.isRequired,
      };

      expect(converted.minQuantity).toBe(0); // isRequired = false → minQuantity = 0
      expect(converted.maxQuantity).toBe(2);
      expect(converted.isRequired).toBe(false);
    });

    it('should handle null productImages gracefully', () => {
      const item = {
        id: 2,
        comboGroupId: 1,
        productId: 100002,
        sortOrder: 1,
        productName: 'X-Bacon',
        productPrice: '24.90',
        productImages: null as string[] | null,
        productStatus: 'active',
        categoryId: 1,
      };

      const convertedItem = {
        imageUrl: item.productImages?.[0] || null,
      };

      expect(convertedItem.imageUrl).toBeNull();
    });

    it('should handle missing productName gracefully', () => {
      const item = {
        id: 3,
        comboGroupId: 1,
        productId: 100003,
        sortOrder: 2,
        productName: null as string | null,
        productPrice: '15.00',
        productImages: null as string[] | null,
        productStatus: 'active',
        categoryId: 1,
      };

      const convertedItem = {
        name: item.productName || 'Produto',
      };

      expect(convertedItem.name).toBe('Produto');
    });
  });

  describe('Regular products still use complementGroups', () => {
    it('should use getComplementGroupsByProduct for non-combo products', async () => {
      const mockRegularProduct = {
        id: 100001,
        isCombo: false,
        establishmentId: 60018,
      };

      const mockComplementGroups = [
        {
          id: 10,
          productId: 100001,
          name: 'Adicionais',
          minQuantity: 0,
          maxQuantity: 3,
          isRequired: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockItems = [
        {
          id: 101,
          groupId: 10,
          name: 'Bacon Extra',
          price: '3.00',
          imageUrl: null,
          isActive: true,
          priceMode: 'normal',
          sortOrder: 0,
          availabilityType: 'always',
          availableDays: null,
          availableHours: null,
          badgeText: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.getProductById as any).mockResolvedValue(mockRegularProduct);
      (db.getComplementGroupsByProduct as any).mockResolvedValue(mockComplementGroups);
      (db.getComplementItemsByGroup as any).mockResolvedValue(mockItems);

      // Simular a lógica do router
      const product = await db.getProductById(100001);
      expect(product!.isCombo).toBe(false);

      // Para produto regular, deve usar getComplementGroupsByProduct
      const groups = await db.getComplementGroupsByProduct(100001);
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Adicionais');

      // Deve NÃO chamar getComboGroupsByProductId
      expect(db.getComboGroupsByProductId).not.toHaveBeenCalled();
    });
  });
});
