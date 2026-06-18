/**
 * iFood Catalog Module - Fase 3
 * 
 * Gerencia operações de catálogo:
 * - Leitura de catálogos, categorias e produtos do iFood
 * - Atualização de produtos (nome, descrição, preço, disponibilidade)
 * - Gerenciamento de categorias (status, ordem)
 * - Mapeamento entre produtos locais e iFood
 */

import { ifoodApiCall } from "./ifoodInfra";
import { getAccessTokenForEstablishment } from "./ifood";
import { logger } from "./_core/logger";
import { getCachedCatalog, setCachedCatalog, invalidateCatalogCache } from "./ifoodCatalogCache";

const IFOOD_CATALOG_BASE_URL = "https://merchant-api.ifood.com.br/catalog/v2.0";

// ==========================================
// TIPOS
// ==========================================

export interface IfoodCatalog {
  catalogId: string;
  context: string; // "DELIVERY" | "DIGITAL_MENU" | etc
  status: string;
  modifiedAt?: string;
  groupId?: string;
}

export interface IfoodCatalogCategory {
  id: string;
  name: string;
  externalCode?: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  order?: number;
  template?: string;
  friendlyName?: string;
  items?: any[]; // Items returned when include_items=true
}

export interface IfoodCatalogProduct {
  id: string;
  name: string;
  description?: string;
  externalCode?: string;
  image?: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  price: {
    value: number;
    originalValue?: number;
  };
  categoryId?: string;
  serving?: string;
  dietaryRestrictions?: string[];
  ean?: string;
  shifts?: any[];
  optionGroups?: IfoodOptionGroup[];
}

export interface IfoodOptionGroup {
  id: string;
  name: string;
  externalCode?: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  min: number;
  max: number;
  options?: IfoodOption[];
}

export interface IfoodOption {
  id: string;
  name: string;
  description?: string;
  externalCode?: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  price: {
    value: number;
    originalValue?: number;
  };
}

export interface IfoodCatalogGroup {
  id: string;
  name: string;
  externalCode?: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  order?: number;
  items?: IfoodCatalogProduct[];
}

export interface IfoodProductUpdate {
  name?: string;
  description?: string;
  externalCode?: string;
  image?: string;
  serving?: string;
  dietaryRestrictions?: string[];
  ean?: string;
  price?: {
    value: number;
    originalValue?: number;
  };
  shifts?: any[];
}

// ==========================================
// FUNÇÕES DE LEITURA DO CATÁLOGO
// ==========================================

/**
 * Lista todos os catálogos disponíveis para o merchant
 * Cada catálogo representa um contexto (DELIVERY, DIGITAL_MENU, etc)
 */
export async function getCatalogs(
  establishmentId: number,
  merchantId: string
): Promise<IfoodCatalog[]> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao listar catálogos: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao listar catálogos: ${response.status}`);
  }

  return response.json();
}

/**
 * Lista todas as categorias de um catálogo específico
 * Usa include_items=true para retornar os itens vinculados a cada categoria
 * com detalhes completos (nome, preço, descrição, imagem, complementos)
 */
export async function getCategories(
  establishmentId: number,
  merchantId: string,
  catalogId: string
): Promise<IfoodCatalogCategory[]> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories?include_items=true`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao listar categorias: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao listar categorias: ${response.status}`);
  }

  return response.json();
}

/**
 * Lista todos os produtos (sellable items) de um catálogo
 * 
 * Usa o endpoint sellableItems que retorna apenas os produtos vinculados às categorias.
 * O endpoint sellableItems retorna campos com prefixo "item" (itemId, itemName, etc.)
 * que precisam ser mapeados para o formato IfoodCatalogProduct.
 * 
 * NOTA: O endpoint /products NÃO é usado como fallback porque retorna TODOS os produtos
 * já criados no merchant (incluindo testes, complementos, e itens deletados),
 * o que causa duplicação e exibição de dados incorretos.
 */
export async function getProducts(
  establishmentId: number,
  merchantId: string,
  catalogId: string
): Promise<IfoodCatalogProduct[]> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  // Usa sellableItems (endpoint correto da API v2.0 - produtos vinculados a categorias)
  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/sellableItems`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao listar sellableItems: ${response.status} - ${errorText}`);
    return [];
  }

  const rawText = await response.text();
  
  let rawItems: any[];
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (parsed && typeof parsed === 'object') {
      rawItems = parsed.items || parsed.data || parsed.sellableItems || parsed.products || parsed.elements || [];
      if (!Array.isArray(rawItems)) rawItems = [];
    } else {
      rawItems = [];
    }
  } catch (e) {
    logger.error(`[iFood Catalog] Erro ao parsear sellableItems: ${e}`);
    rawItems = [];
  }
  
  logger.info(`[iFood Catalog] sellableItems retornou ${rawItems.length} itens para catálogo ${catalogId}`);
  
  if (rawItems.length > 0) {
    logger.info(`[iFood Catalog] Exemplo de item (keys): ${Object.keys(rawItems[0]).join(', ')}`);
  }
  
  // Mapear campos do sellableItems para o formato IfoodCatalogProduct
  return rawItems.map((item: any) => ({
    id: item.itemId || item.id || '',
    name: item.itemName || item.name || '',
    description: item.itemDescription || item.description || undefined,
    externalCode: item.itemExternalCode || item.externalCode || undefined,
    image: (item.logosUrls && item.logosUrls.length > 0) ? item.logosUrls[0] : (item.image || item.imagePath || undefined),
    status: (item.status || 'AVAILABLE') as 'AVAILABLE' | 'UNAVAILABLE',
    price: item.itemPrice || item.price || { value: 0 },
    categoryId: item.categoryId || undefined,
    serving: item.serving || undefined,
    ean: item.itemEan || item.ean || undefined,
    shifts: item.itemSchedules || item.shifts || undefined,
    optionGroups: item.itemOptionGroups || item.optionGroups || undefined,
  }));
}

/**
 * Busca detalhes de um produto específico
 */
export async function getProductDetails(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  productId: string
): Promise<IfoodCatalogProduct> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/products/${productId}`,
    { method: "GET", token },
    { maxRetries: 2 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao buscar produto: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao buscar detalhes do produto: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// FUNÇÕES DE ATUALIZAÇÃO DE PRODUTOS
// ==========================================

/**
 * Atualiza dados de um produto no iFood
 * Permite alterar nome, descrição, preço, imagem, etc.
 */
export async function updateProduct(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  productId: string,
  data: IfoodProductUpdate
): Promise<any> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/products/${productId}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao atualizar produto: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao atualizar produto: ${response.status}`);
  }

  // Invalidar cache após escrita bem-sucedida
  invalidateCatalogCache(establishmentId);

  return response.json();
}

/**
 * Atualiza o status de disponibilidade de um produto
 * @param status "AVAILABLE" | "UNAVAILABLE"
 */
export async function updateProductStatus(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  productId: string,
  status: "AVAILABLE" | "UNAVAILABLE"
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/products/${productId}/status`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao atualizar status do produto: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao atualizar status do produto: ${response.status}`);
  }

  // Invalidar cache após escrita bem-sucedida
  invalidateCatalogCache(establishmentId);
}

/**
 * Atualiza o preço de um produto no iFood
 */
export async function updateProductPrice(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  productId: string,
  price: number,
  originalPrice?: number
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const priceData: any = { value: price };
  if (originalPrice !== undefined) {
    priceData.originalValue = originalPrice;
  }

  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/products/${productId}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ price: priceData }),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao atualizar preço: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao atualizar preço do produto: ${response.status}`);
  }

  // Invalidar cache após escrita bem-sucedida
  invalidateCatalogCache(establishmentId);
}

// ==========================================
// FUNÇÕES DE GERENCIAMENTO DE CATEGORIAS
// ==========================================

/**
 * Atualiza o status de uma categoria no iFood
 * @param status "AVAILABLE" | "UNAVAILABLE"
 */
export async function updateCategoryStatus(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  categoryId: string,
  status: "AVAILABLE" | "UNAVAILABLE"
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${categoryId}/status`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao atualizar status da categoria: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao atualizar status da categoria: ${response.status}`);
  }

  // Invalidar cache após escrita bem-sucedida
  invalidateCatalogCache(establishmentId);
}

/**
 * Atualiza dados de uma categoria no iFood (nome, ordem)
 */
export async function updateCategory(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  categoryId: string,
  data: { name?: string; order?: number; friendlyName?: string }
): Promise<any> {
  const token = await getAccessTokenForEstablishment(establishmentId);

  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${categoryId}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao atualizar categoria: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao atualizar categoria: ${response.status}`);
  }

  // Invalidar cache após escrita bem-sucedida
  invalidateCatalogCache(establishmentId);

  return response.json();
}

// ==========================================
// FUNÇÕES DE SINCRONIZAÇÃO
// ==========================================

/**
 * Busca o catálogo completo do iFood com categorias e produtos
 * Retorna uma estrutura hierárquica para exibição na UI
 * 
 * Utiliza cache em memória com TTL de 10 minutos.
 * O cache é invalidado automaticamente após operações de escrita.
 * Use forceRefresh=true para ignorar o cache.
 */
export async function getFullCatalog(
  establishmentId: number,
  merchantId: string,
  forceRefresh: boolean = false
): Promise<{
  catalogs: Array<IfoodCatalog & { categories: Array<IfoodCatalogCategory & { products: IfoodCatalogProduct[] }> }>;
  fromCache: boolean;
}> {
  // Verificar cache (a menos que forceRefresh seja true)
  if (!forceRefresh) {
    const cached = getCachedCatalog(establishmentId);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  } else {
    logger.info(`[iFood Catalog] forceRefresh=true, ignorando cache para estabelecimento ${establishmentId}`);
  }

  const catalogs = await getCatalogs(establishmentId, merchantId);

  const fullCatalogs = await Promise.all(
    catalogs.map(async (catalog) => {
      try {
        // Buscar categorias COM itens incluídos (include_items=true)
        const categories = await getCategories(establishmentId, merchantId, catalog.catalogId);

        let totalProducts = 0;

        // Extrair produtos diretamente dos items de cada categoria
        // O endpoint categories?include_items=true retorna items[] em cada categoria
        const categoriesWithProducts = categories.map((cat) => {
          const rawItems = cat.items || [];
          
          // Mapear items da categoria para IfoodCatalogProduct
          const catProducts: IfoodCatalogProduct[] = rawItems.map((item: any) => ({
            id: item.id || '',
            name: item.name || '',
            description: item.description || undefined,
            externalCode: item.externalCode || undefined,
            image: item.imagePath || (item.logosUrls && item.logosUrls.length > 0 ? item.logosUrls[0] : undefined),
            status: (item.status || 'AVAILABLE') as 'AVAILABLE' | 'UNAVAILABLE',
            price: item.price || { value: 0 },
            categoryId: cat.id,
            serving: item.serving || undefined,
            shifts: item.shifts || undefined,
            optionGroups: item.optionGroups || undefined,
          }));
          
          totalProducts += catProducts.length;
          
          return {
            ...cat,
            items: undefined, // Remove raw items from the response
            products: catProducts,
          };
        });

        logger.info(`[iFood Catalog] Catálogo ${catalog.catalogId}: ${categories.length} categorias, ${totalProducts} produtos total`);

        // Se include_items=true não retornou nenhum produto, tentar sellableItems como fallback
        if (totalProducts === 0) {
          logger.info(`[iFood Catalog] categories?include_items=true não retornou itens, tentando sellableItems com groupId`);
          const groupId = catalog.groupId || catalog.catalogId;
          const products = await getProducts(establishmentId, merchantId, groupId);
          
          if (products.length > 0) {
            logger.info(`[iFood Catalog] sellableItems retornou ${products.length} produtos via groupId ${groupId}`);
            // Agrupar produtos por categoryId
            for (const cwp of categoriesWithProducts) {
              const catProducts = products.filter(p => p.categoryId === cwp.id);
              cwp.products = catProducts;
            }
            // Produtos sem categoria
            const assignedIds = new Set(categoriesWithProducts.flatMap(c => c.products.map(p => p.id)));
            const unassigned = products.filter(p => !assignedIds.has(p.id));
            if (unassigned.length > 0) {
              logger.info(`[iFood Catalog] ${unassigned.length} produtos sem categoria via sellableItems`);
            }
          }
        }
        
        const finalProductCount = categoriesWithProducts.reduce((sum, c) => sum + c.products.length, 0);
        logger.info(`[iFood Catalog] Catálogo final: ${categoriesWithProducts.length} categorias, ${finalProductCount} produtos total`);

        return {
          ...catalog,
          categories: categoriesWithProducts,
        };
      } catch (error) {
        logger.error(`[iFood Catalog] Erro ao carregar catálogo ${catalog.catalogId}: ${error}`);
        return {
          ...catalog,
          categories: [],
        };
      }
    })
  );

  const result = { catalogs: fullCatalogs };
  
  // Salvar no cache
  setCachedCatalog(establishmentId, result);
  
  return { ...result, fromCache: false };
}

/**
 * Sincroniza um produto local para o iFood
 * Atualiza nome, descrição, preço e disponibilidade
 */
export async function syncLocalProductToIfood(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  ifoodProductId: string,
  localProduct: {
    name: string;
    description?: string;
    price: number;
    status: "active" | "paused" | "archived";
    images?: string[];
  }
): Promise<{ updated: boolean; statusSynced: boolean }> {
  let updated = false;
  let statusSynced = false;

  // Atualizar dados do produto
  try {
    await updateProduct(establishmentId, merchantId, catalogId, ifoodProductId, {
      name: localProduct.name,
      description: localProduct.description || undefined,
      price: { value: localProduct.price },
      image: localProduct.images?.[0] || undefined,
    });
    updated = true;
  } catch (error) {
    logger.error(`[iFood Catalog] Erro ao sincronizar dados do produto: ${error}`);
  }

  // Sincronizar status
  try {
    const ifoodStatus = localProduct.status === "active" ? "AVAILABLE" : "UNAVAILABLE";
    await updateProductStatus(establishmentId, merchantId, catalogId, ifoodProductId, ifoodStatus);
    statusSynced = true;
  } catch (error) {
    logger.error(`[iFood Catalog] Erro ao sincronizar status do produto: ${error}`);
  }

  return { updated, statusSynced };
}

/**
 * Pausa/ativa todos os produtos de uma categoria no iFood (bulk operation)
 */
export async function bulkUpdateCategoryProductsStatus(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  categoryId: string,
  status: "AVAILABLE" | "UNAVAILABLE"
): Promise<{ total: number; success: number; failed: number }> {
  const products = await getProducts(establishmentId, merchantId, catalogId);
  const categoryProducts = products.filter((p) => p.categoryId === categoryId);

  let success = 0;
  let failed = 0;

  for (const product of categoryProducts) {
    try {
      await updateProductStatus(establishmentId, merchantId, catalogId, product.id, status);
      success++;
    } catch (error) {
      logger.error(`[iFood Catalog] Erro ao atualizar produto ${product.id}: ${error}`);
      failed++;
    }
  }

  return { total: categoryProducts.length, success, failed };
}

// ==========================================
// FUNÇÕES ADICIONAIS PARA HOMOLOGAÇÃO
// ==========================================

/**
 * Cria uma nova categoria no catálogo do iFood
 * Requisito de homologação: POST /merchants/{merchantId}/catalogs/{catalogId}/categories
 */
export async function createCategory(
  establishmentId: number,
  merchantId: string,
  catalogId: string,
  data: {
    name: string;
    externalCode?: string;
    status?: "AVAILABLE" | "UNAVAILABLE";
    template?: string;
    order?: number;
  }
): Promise<any> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories`,
    {
      method: "POST",
      token,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );
  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao criar categoria: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao criar categoria: ${response.status} - ${errorText}`);
  }

  // Invalidar cache após escrita bem-sucedida
  invalidateCatalogCache(establishmentId);

  return response.json();
}

/**
 * Altera o preço de uma opção/complemento no iFood
 * Requisito de homologação: PATCH /merchants/{merchantId}/options/price
 */
export async function updateOptionPrice(
  establishmentId: number,
  merchantId: string,
  optionId: string,
  price: number
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/options/${optionId}/price`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ value: price }),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );
  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao atualizar preço da opção: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao atualizar preço da opção: ${response.status} - ${errorText}`);
  }

  // Invalidar cache após escrita bem-sucedida
  invalidateCatalogCache(establishmentId);
}

/**
 * Altera o status de uma opção/complemento no iFood
 * Requisito de homologação: PATCH /merchants/{merchantId}/options/status
 */
export async function updateOptionStatus(
  establishmentId: number,
  merchantId: string,
  optionId: string,
  status: "AVAILABLE" | "UNAVAILABLE"
): Promise<void> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/options/${optionId}/status`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ available: status === "AVAILABLE" }),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );
  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao atualizar status da opção: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao atualizar status da opção: ${response.status} - ${errorText}`);
  }

  // Invalidar cache após escrita bem-sucedida
  invalidateCatalogCache(establishmentId);
}

/**
 * Faz upload de uma imagem para o iFood
 * Requisito de homologação: POST /merchants/{merchantId}/image/upload
 */
export async function uploadImage(
  establishmentId: number,
  merchantId: string,
  imageUrl: string
): Promise<{ imageUrl: string }> {
  const token = await getAccessTokenForEstablishment(establishmentId);
  const response = await ifoodApiCall(
    `${IFOOD_CATALOG_BASE_URL}/merchants/${merchantId}/image/upload`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ url: imageUrl }),
      headers: { "Content-Type": "application/json" }
    },
    { maxRetries: 1 }
  );
  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[iFood Catalog] Erro ao fazer upload de imagem: ${response.status} - ${errorText}`);
    throw new Error(`Falha ao fazer upload de imagem: ${response.status} - ${errorText}`);
  }
  return response.json();
}
