import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { assertEstablishmentOwnership } from "./helpers";
import { assertCanAddComplement } from "./planGuard";
import { logger } from "../_core/logger";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { zMoney, zMoneyOptional } from "../../shared/validation";

// Helper: dado um productId, busca o produto e verifica ownership
async function assertProductOwnership(userId: number, productId: number) {
  const product = await db.getProductById(productId);
  if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
  await assertEstablishmentOwnership(userId, product.establishmentId);
  return product;
}

// Helper: dado um groupId, busca o grupo → produto → establishment e verifica ownership
async function assertGroupOwnership(userId: number, groupId: number) {
  const group = await db.getComplementGroupById(groupId);
  if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo não encontrado' });
  await assertProductOwnership(userId, group.productId);
  return group;
}

// Helper: dado um itemId, busca o item → grupo → produto → establishment e verifica ownership
async function assertItemOwnership(userId: number, itemId: number) {
  const item = await db.getComplementItemById(itemId);
  if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Item não encontrado' });
  await assertGroupOwnership(userId, item.groupId);
  return item;
}

export const complementRouter = router({
    listGroups: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertProductOwnership(ctx.user.id, input.productId);
        // Verificar se o produto é um combo
        const product = await db.getProductById(input.productId);
        
        // Se for combo, buscar TANTO comboGroups QUANTO complementGroups (importados dos itens)
        if (product?.isCombo) {
          // 1. Buscar comboGroups (grupos definidos na criação do combo)
          const comboGroupsData = await db.getComboGroupsByProductId(input.productId);
          const convertedComboGroups = comboGroupsData.map(group => ({
            id: group.id,
            productId: group.productId,
            name: group.name,
            minQuantity: group.minQuantity ?? (group.isRequired ? 1 : 0),
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
            sortOrder: group.sortOrder,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            items: group.items.map(item => ({
              id: item.id,
              groupId: group.id,
              name: item.productName || 'Produto',
              price: item.productPrice || '0',
              imageUrl: item.productImages?.[0] || null,
              isActive: item.isActive,
              priceMode: (Number(item.productPrice) > 0 ? 'normal' : 'free') as 'normal' | 'free',
              sortOrder: item.sortOrder,
              availabilityType: 'always' as const,
              availableDays: null,
              availableHours: null,
              badgeText: null,
              createdAt: group.createdAt,
              updatedAt: group.updatedAt,
            })),
          }));

          // 2. Buscar complementGroups (importados dos itens que tinham complementos)
          const complementGroupsData = await db.getComplementGroupsByProduct(input.productId);
          const complementGroupsWithItems = await Promise.all(
            complementGroupsData.map(async (group) => {
              const items = await db.getComplementItemsByGroup(group.id, input.productId);
              return { ...group, items };
            })
          );

          // 3. Combinar ambos os tipos de grupos
          return [...convertedComboGroups, ...complementGroupsWithItems];
        }
        
        // Se NÃO for combo, buscar complementos normais
        const groups = await db.getComplementGroupsByProduct(input.productId);
        const groupsWithItems = await Promise.all(
          groups.map(async (group) => {
            const items = await db.getComplementItemsByGroup(group.id, input.productId);
            return {
              ...group,
              items,
            };
          })
        );
        return groupsWithItems;
      }),
    
    listItems: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertGroupOwnership(ctx.user.id, input.groupId);
        return db.getComplementItemsByGroup(input.groupId);
      }),
    
    createGroup: protectedProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string().min(1),
        minQuantity: z.number().default(0),
        maxQuantity: z.number().default(1),
        isRequired: z.boolean().default(false),
        groupType: z.enum(["complement", "included"]).default("complement"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertProductOwnership(ctx.user.id, input.productId);
        const isIncludedGroup = input.groupType === "included";
        // Auto-sync: grupos inclusos são informativos, não exigem seleção do cliente.
        const syncedInput = {
          ...input,
          minQuantity: isIncludedGroup ? 0 : input.minQuantity,
          maxQuantity: isIncludedGroup ? 0 : input.maxQuantity,
          isRequired: isIncludedGroup ? false : input.minQuantity >= 1,
          version: 'draft' as const, // Always create as draft
        };
        const id = await db.createComplementGroup(syncedInput);
        return { id };
      }),
    
    updateGroup: protectedProcedure
      .input(z.object({
        id: z.number(),
        productId: z.number().optional(),
        name: z.string().min(1).optional(),
        minQuantity: z.number().optional(),
        maxQuantity: z.number().optional(),
        isRequired: z.boolean().optional(),
        groupType: z.enum(["complement", "included"]).optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, productId, ...data } = input;
        
        // If productId is provided, check if it's a combo product first
        if (productId) {
          await assertProductOwnership(ctx.user.id, productId);
          const product = await db.getProductById(productId);
          
          if (product?.isCombo) {
            // For combo products, try comboGroups FIRST (since IDs can collide with complementGroups)
            const comboGroup = await db.getComboGroupById(id);
            if (comboGroup && comboGroup.productId === productId) {
              // comboGroups now has minQuantity field - save it directly
              const comboData: any = {};
              if (data.name !== undefined) comboData.name = data.name;
              if (data.maxQuantity !== undefined) comboData.maxQuantity = data.maxQuantity;
              if (data.sortOrder !== undefined) comboData.sortOrder = data.sortOrder;
              if (data.minQuantity !== undefined) {
                comboData.minQuantity = data.minQuantity;
                comboData.isRequired = data.minQuantity >= 1;
              }
              if (data.isRequired !== undefined) comboData.isRequired = data.isRequired;
              await db.updateComboGroup(id, comboData);
              return { success: true };
            }
            // Combo can also have regular complement groups imported from items
            const complementGroup = await db.getComplementGroupById(id);
            if (complementGroup && complementGroup.productId === productId) {
              if (data.groupType === "included") {
                data.minQuantity = 0;
                data.maxQuantity = 0;
                data.isRequired = false;
              } else if (data.minQuantity !== undefined) {
                data.isRequired = data.minQuantity >= 1;
              }
              await db.updateComplementGroup(id, data);
              return { success: true };
            }
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo n\u00e3o encontrado neste combo' });
          }
        }
        
        // Default path: regular complement group (non-combo or no productId provided)
        const complementGroup = await db.getComplementGroupById(id);
        if (complementGroup) {
          await assertProductOwnership(ctx.user.id, complementGroup.productId);
          if (data.groupType === "included") {
            data.minQuantity = 0;
            data.maxQuantity = 0;
            data.isRequired = false;
          } else if (data.minQuantity !== undefined) {
            data.isRequired = data.minQuantity >= 1;
          }
          await db.updateComplementGroup(id, data);
          return { success: true };
        }
        
        // Fallback: try comboGroups if no productId was provided
        const comboGroup = await db.getComboGroupById(id);
        if (comboGroup) {
          await assertProductOwnership(ctx.user.id, comboGroup.productId);
          const comboData: any = {};
          if (data.name !== undefined) comboData.name = data.name;
          if (data.maxQuantity !== undefined) comboData.maxQuantity = data.maxQuantity;
          if (data.sortOrder !== undefined) comboData.sortOrder = data.sortOrder;
          if (data.minQuantity !== undefined) {
            comboData.minQuantity = data.minQuantity;
            comboData.isRequired = data.minQuantity >= 1;
          }
          if (data.isRequired !== undefined) comboData.isRequired = data.isRequired;
          await db.updateComboGroup(id, comboData);
          return { success: true };
        }
        
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo n\u00e3o encontrado' });
      }),
    
    reorderGroups: protectedProcedure
      .input(z.object({
        productId: z.number(),
        items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.items.length === 0) return { success: true };
        
        // Verify product ownership first
        const product = await assertProductOwnership(ctx.user.id, input.productId);
        
        if (product.isCombo) {
          // For combos, groups can be from EITHER comboGroups or complementGroups tables
          // IDs can collide between tables, so we need to check each one individually
          for (const { id, sortOrder } of input.items) {
            // First try comboGroups table
            const comboGroup = await db.getComboGroupById(id);
            if (comboGroup && comboGroup.productId === input.productId) {
              await db.updateComboGroup(id, { sortOrder });
            } else {
              // Try complementGroups table
              const complementGroup = await db.getComplementGroupById(id);
              if (complementGroup && complementGroup.productId === input.productId) {
                await db.updateComplementGroup(id, { sortOrder });
              }
              // If not found in either table for this product, skip silently
            }
          }
        } else {
          // For non-combo products, all groups are in complementGroups table
          for (const { id, sortOrder } of input.items) {
            await db.updateComplementGroup(id, { sortOrder });
          }
        }
        
        return { success: true };
      }),

    deleteGroup: protectedProcedure
      .input(z.object({ id: z.number(), productId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        // If productId provided, use it to determine the correct table
        if (input.productId) {
          await assertProductOwnership(ctx.user.id, input.productId);
          const product = await db.getProductById(input.productId);
          if (product?.isCombo) {
            const comboGroup = await db.getComboGroupById(input.id);
            if (comboGroup && comboGroup.productId === input.productId) {
              await db.deleteComboGroup(input.id);
              return { success: true };
            }
            const complementGroup = await db.getComplementGroupById(input.id);
            if (complementGroup && complementGroup.productId === input.productId) {
              await db.deleteComplementGroup(input.id);
              return { success: true };
            }
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo n\u00e3o encontrado neste combo' });
          }
        }
        // Default: try complementGroups first
        const complementGroup = await db.getComplementGroupById(input.id);
        if (complementGroup) {
          await assertProductOwnership(ctx.user.id, complementGroup.productId);
          await db.deleteComplementGroup(input.id);
          return { success: true };
        }
        // Fallback: try comboGroups
        const comboGroup = await db.getComboGroupById(input.id);
        if (comboGroup) {
          await assertProductOwnership(ctx.user.id, comboGroup.productId);
          await db.deleteComboGroup(input.id);
          return { success: true };
        }
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupo n\u00e3o encontrado' });
      }),
    
    createItem: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        productId: z.number().optional(),
        name: z.string().min(1),
        price: zMoney.default("0"),
        imageUrl: z.string().nullable().optional(),
        sortOrder: z.number().default(0),
        hasStock: z.boolean().optional(),
        stockQuantity: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { productId, ...itemInput } = input;
        
        // If productId provided, check if it's a combo
        if (productId) {
          const product = await assertProductOwnership(ctx.user.id, productId);
          if (product.isCombo) {
            // For combo groups, verify the group belongs to this combo
            const comboGroup = await db.getComboGroupById(input.groupId);
            if (comboGroup && comboGroup.productId === productId) {
              // Combo items are actually products added to comboGroupItems
              // This shouldn't normally be called for combos from the inline dropdown
              // but handle gracefully - create as complement item
              const id = await db.createComplementItem({ ...itemInput, version: 'draft' as const });
              return { id };
            }
          }
        }
        
        // Default: regular complement group
        const group = await assertGroupOwnership(ctx.user.id, input.groupId);
        const product = await db.getProductById(group.productId);
        if (product) {
          await assertCanAddComplement(input.groupId, product.establishmentId);
        }
        const id = await db.createComplementItem({ ...itemInput, version: 'draft' as const });
        return { id };
      }),
    
    updateItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        productId: z.number().optional(),
        name: z.string().min(1).optional(),
        price: zMoneyOptional,
        imageUrl: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        priceMode: z.enum(["normal", "free"]).optional(),
        sortOrder: z.number().optional(),
        description: z.string().nullable().optional(),
        badgeText: z.string().nullable().optional(),
        availabilityType: z.enum(["always", "scheduled"]).optional(),
        availableDays: z.array(z.number()).nullable().optional(),
        availableHours: z.array(z.object({
          day: z.number(),
          startTime: z.string(),
          endTime: z.string(),
        })).nullable().optional(),
        freeOnDelivery: z.boolean().optional(),
        freeOnPickup: z.boolean().optional(),
        freeOnDineIn: z.boolean().optional(),
        hasStock: z.boolean().optional(),
        stockQuantity: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, productId, ...data } = input;
        
        // If productId provided, check if it's a combo item
        if (productId) {
          const product = await assertProductOwnership(ctx.user.id, productId);
          if (product.isCombo) {
            // Try comboGroupItems first
            const comboItem = await db.getComboGroupItemById(id);
            if (comboItem) {
              // For combo items, only sortOrder can be updated
              if (data.sortOrder !== undefined) {
                await db.updateComboGroupItem(id, { sortOrder: data.sortOrder });
              }
              return { success: true };
            }
          }
        }
        
        // Default: regular complement item
        await assertItemOwnership(ctx.user.id, id);
        await db.updateComplementItem(id, data);
        return { success: true };
      }),
    
    // Listar todos os complementos do estabelecimento (para gestão global)
    listAllByEstablishment: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getAllComplementItemsByEstablishment(input.establishmentId);
      }),
    
    // Atualizar status (ativo/pausado) de um complemento
    toggleActive: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean(),
        productId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // If productId provided, check if it's a combo item
        if (input.productId) {
          const product = await assertProductOwnership(ctx.user.id, input.productId);
          if (product.isCombo) {
            const comboItem = await db.getComboGroupItemById(input.id);
            if (comboItem) {
              await db.updateComboGroupItem(input.id, { isActive: input.isActive });
              return { success: true };
            }
          }
        }
        // Default: regular complement item
        await assertItemOwnership(ctx.user.id, input.id);
        await db.updateComplementItem(input.id, { isActive: input.isActive });
        return { success: true };
      }),
    
    // Atualizar modo de preço (normal/grátis) de um complemento
    togglePriceMode: protectedProcedure
      .input(z.object({
        id: z.number(),
        priceMode: z.enum(["normal", "free"]),
        productId: z.number().optional(),
        freeOnDelivery: z.boolean().optional(),
        freeOnPickup: z.boolean().optional(),
        freeOnDineIn: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, productId, ...data } = input;
        // If productId provided, check if it's a combo item
        if (productId) {
          const product = await assertProductOwnership(ctx.user.id, productId);
          if (product.isCombo) {
            const comboItem = await db.getComboGroupItemById(id);
            if (comboItem) {
              // Combo items don't have priceMode - they reference products
              return { success: true };
            }
          }
        }
        // Default: regular complement item
        await assertItemOwnership(ctx.user.id, id);
        await db.updateComplementItem(id, data);
        return { success: true };
      }),
    
    // Atualizar complemento (com groupId = apenas no grupo específico, sem groupId = propaga para todos)
    updateGlobal: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        complementName: z.string(),
        groupIds: z.array(z.number()).optional(),
        newName: z.string().optional(),
        isActive: z.boolean().optional(),
        priceMode: z.enum(["normal", "free"]).optional(),
        price: zMoneyOptional,
        availabilityType: z.enum(["always", "scheduled"]).optional(),
        availableDays: z.array(z.number()).nullable().optional(),
        availableHours: z.array(z.object({
          day: z.number(),
          startTime: z.string(),
          endTime: z.string(),
        })).nullable().optional(),
        badgeText: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        freeOnDelivery: z.boolean().optional(),
        freeOnPickup: z.boolean().optional(),
        freeOnDineIn: z.boolean().optional(),
        hasStock: z.boolean().optional(),
        stockQuantity: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { establishmentId, complementName, groupIds, newName, ...data } = input;
        const updateData = { ...data, ...(newName ? { name: newName } : {}) };
        // Evitar erro "No values to set" quando não há campos para atualizar
        if (Object.keys(updateData).length === 0) return { success: true };
        await db.updateComplementItemsByName(establishmentId, complementName, updateData, groupIds);
        return { success: true };
      }),
    
    deleteItem: protectedProcedure
      .input(z.object({ id: z.number(), productId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        // If productId provided, check if it's a combo item
        if (input.productId) {
          const product = await assertProductOwnership(ctx.user.id, input.productId);
          if (product.isCombo) {
            const comboItem = await db.getComboGroupItemById(input.id);
            if (comboItem) {
              await db.deleteComboGroupItem(input.id);
              return { success: true };
            }
          }
        }
        // Default: regular complement item
        await assertItemOwnership(ctx.user.id, input.id);
        await db.deleteComplementItem(input.id);
        return { success: true };
      }),
    
    // ---- Global Group Management ----
    
    // List all unique groups across all products of an establishment
    listAllGroups: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getAllComplementGroupsByEstablishment(input.establishmentId);
      }),
    
    // Pause/activate a group globally by name
    toggleGroupActive: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.toggleComplementGroupByName(input.establishmentId, input.groupName, input.isActive);
        return { success: true };
      }),
    
    // Delete a group globally by name
    deleteGroupByName: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.deleteComplementGroupByName(input.establishmentId, input.groupName);
        return { success: true };
      }),
    
    // Update group rules (min, max, required, name) globally by name
    updateGroupRules: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
        newName: z.string().optional(),
        minQuantity: z.number().optional(),
        maxQuantity: z.number().optional(),
        isRequired: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const { establishmentId, groupName, newName, ...data } = input;
        // Auto-sync: isRequired is derived from minQuantity
        if (data.minQuantity !== undefined) {
          data.isRequired = data.minQuantity >= 1;
        }
        const updateData = { ...data, ...(newName ? { name: newName } : {}) };
        if (Object.keys(updateData).length === 0) return { success: true };
        await db.updateComplementGroupRulesByName(establishmentId, groupName, updateData);
        return { success: true };
      }),
    
    // Delete a complement item by name across all groups
    deleteItemByName: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        itemName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        await db.deleteComplementItemByName(input.establishmentId, input.itemName);
        return { success: true };
      }),
    
    // Sync complement groups for a product (smart update: only create/delete what changed)
    // This preserves isActive, description, priceMode, availability, etc. on existing items
    syncGroups: protectedProcedure
      .input(z.object({
        productId: z.number(),
        groups: z.array(z.object({
          existingGroupId: z.number().optional(), // If set, this is an existing group
          name: z.string().min(1),
          minQuantity: z.number().default(0),
          maxQuantity: z.number().default(1),
          isRequired: z.boolean().default(false),
          groupType: z.enum(["complement", "included"]).default("complement"),
          items: z.array(z.object({
            existingItemId: z.number().optional(), // If set, this is an existing item
            name: z.string().min(1),
            price: zMoney.default("0"),
            imageUrl: z.string().nullable().optional(),
            sortOrder: z.number().default(0),
          })),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertProductOwnership(ctx.user.id, input.productId);
        
        // Check if this is a combo product
        const product = await db.getProductById(input.productId);
        const isCombo = product?.isCombo ?? false;
        
        // 1. Get current complementGroups from DB
        const currentGroups = await db.getComplementGroupsByProduct(input.productId);
        const currentGroupIds = new Set(currentGroups.map(g => g.id));
        
        // For combos, also get comboGroups to know which existingGroupIds belong to comboGroups table
        let comboGroupIds = new Set<number>();
        if (isCombo) {
          const comboGroupsData = await db.getComboGroupsByProductId(input.productId);
          comboGroupIds = new Set(comboGroupsData.map(g => g.id));
        }
        
        // 2. Determine which existing groups are in the input
        const inputExistingGroupIds = new Set(
          input.groups
            .filter(g => g.existingGroupId)
            .map(g => g.existingGroupId!)
        );
        
        // 3. Delete complementGroups that were removed (exist in DB but not in input)
        // Only delete from complementGroups table, NOT comboGroups (those are managed separately)
        for (const currentGroup of currentGroups) {
          if (!inputExistingGroupIds.has(currentGroup.id)) {
            await db.deleteComplementGroup(currentGroup.id);
          }
        }
        
        // For combos: delete comboGroups that were removed
        if (isCombo) {
          for (const comboGroupId of Array.from(comboGroupIds)) {
            if (!inputExistingGroupIds.has(comboGroupId)) {
              await db.deleteComboGroup(comboGroupId);
            }
          }
        }
        
        // 4. Process each group in input
        for (const group of input.groups) {
          const isIncludedGroup = group.groupType === "included";
          const syncedMinQuantity = isIncludedGroup ? 0 : group.minQuantity;
          const syncedMaxQuantity = isIncludedGroup ? 0 : group.maxQuantity;
          const syncedIsRequired = isIncludedGroup ? false : syncedMinQuantity >= 1;
          
          // Check if this existingGroupId belongs to comboGroups table
          if (group.existingGroupId && comboGroupIds.has(group.existingGroupId)) {
            // This is a comboGroup - update it in the comboGroups table
            await db.updateComboGroup(group.existingGroupId, {
              name: group.name,
              minQuantity: syncedMinQuantity,
              maxQuantity: syncedMaxQuantity,
              isRequired: syncedIsRequired,
            });
            // ComboGroup items are managed via the combo.create flow and InlineComplementsDropdown,
            // not through this sync. Skip item processing for comboGroups.
            continue;
          }
          
          if (group.existingGroupId && currentGroupIds.has(group.existingGroupId)) {
            // Existing complementGroup - update its config (name, min, max, required)
            await db.updateComplementGroup(group.existingGroupId, {
              name: group.name,
              minQuantity: syncedMinQuantity,
              maxQuantity: syncedMaxQuantity,
              isRequired: syncedIsRequired,
              groupType: group.groupType,
            });
            
            // Get current items in this group
            const currentItems = await db.getComplementItemsByGroup(group.existingGroupId);
            const currentItemIds = new Set(currentItems.map(i => i.id));
            
            // Determine which existing items are in the input
            const inputExistingItemIds = new Set(
              group.items
                .filter(i => i.existingItemId)
                .map(i => i.existingItemId!)
            );
            
            // Delete items that were removed
            for (const currentItem of currentItems) {
              if (!inputExistingItemIds.has(currentItem.id)) {
                await db.deleteComplementItem(currentItem.id);
              }
            }
            
            // Update existing items (only sortOrder and basic fields, preserve isActive etc.)
            for (const item of group.items) {
              if (item.existingItemId && currentItemIds.has(item.existingItemId)) {
                // Only update sortOrder, name, price, imageUrl - preserve everything else
                await db.updateComplementItem(item.existingItemId, {
                  name: item.name,
                  price: isIncludedGroup ? "0" : item.price,
                  imageUrl: item.imageUrl || null,
                  sortOrder: item.sortOrder,
                });
              } else {
                // New item - create it
                await db.createComplementItem({
                  groupId: group.existingGroupId,
                  name: item.name,
                  price: isIncludedGroup ? "0" : item.price,
                  imageUrl: item.imageUrl || null,
                  sortOrder: item.sortOrder,
                  version: 'draft', // Always create as draft
                });
              }
            }
          } else if (!group.existingGroupId) {
            // New group (no existingGroupId) - create it and all its items
            const newGroupId = await db.createComplementGroup({
              productId: input.productId,
              name: group.name,
              minQuantity: syncedMinQuantity,
              maxQuantity: syncedMaxQuantity,
              isRequired: syncedIsRequired,
              groupType: group.groupType,
              version: 'draft', // Always create as draft
            });
            
            for (let i = 0; i < group.items.length; i++) {
              const item = group.items[i];
              await db.createComplementItem({
                groupId: newGroupId,
                name: item.name,
                price: isIncludedGroup ? "0" : item.price,
                imageUrl: item.imageUrl || null,
                sortOrder: item.sortOrder,
                version: 'draft', // Always create as draft
              });
            }
          }
          // If group.existingGroupId is set but not found in currentGroupIds or comboGroupIds,
          // it means the group was already deleted - skip it silently
        }
        
        return { success: true };
      }),

    // Get global template prices for comparison ("Personalizado" badge)
    getGlobalTemplatePrices: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        return db.getGlobalTemplatePrices(input.establishmentId);
      }),
    
    // Add a complement item to all groups with a specific name
    addItemToGroupByName: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
        name: z.string().min(1),
        price: zMoney.default("0"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const count = await db.addComplementItemToGroupByName(
          input.establishmentId,
          input.groupName,
          { name: input.name, price: input.price }
        );
        return { success: true, groupsAffected: count };
      }),

    // Add an exclusive item to a specific product within a group
    addExclusiveItem: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        groupName: z.string(),
        productId: z.number(),
        name: z.string().min(1),
        price: zMoney.default("0"),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertEstablishmentOwnership(ctx.user.id, input.establishmentId);
        const result = await db.addExclusiveComplementItem(
          input.establishmentId,
          input.groupName,
          input.productId,
          { name: input.name, price: input.price }
        );
        return { success: true, ...result };
      }),

    // Remove an exclusive item
    removeExclusiveItem: protectedProcedure
      .input(z.object({ itemId: z.number(), productId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        // If productId provided, check if it's a combo item
        if (input.productId) {
          const product = await assertProductOwnership(ctx.user.id, input.productId);
          if (product.isCombo) {
            const comboItem = await db.getComboGroupItemById(input.itemId);
            if (comboItem) {
              await db.deleteComboGroupItem(input.itemId);
              return { success: true };
            }
          }
        }
        // Default: regular complement item
        await assertItemOwnership(ctx.user.id, input.itemId);
        await db.removeExclusiveComplementItem(input.itemId);
        return { success: true };
      }),
  });
