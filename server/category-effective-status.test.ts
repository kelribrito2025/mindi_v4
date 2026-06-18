import { describe, it, expect } from 'vitest';

/**
 * Tests for the category effective active state logic.
 * When all items in a category are paused, the category should visually appear as paused
 * even if category.isActive is true.
 */

// Replicate the logic from Catalogo.tsx
function getCategoryEffectiveState(
  category: { isActive: boolean; name: string },
  categoryProducts: { status: string }[]
) {
  const allItemsPaused = categoryProducts.length > 0 && categoryProducts.every(p => p.status !== 'active');
  const effectiveIsActive = category.isActive && !allItemsPaused;

  return {
    effectiveIsActive,
    allItemsPaused,
    badgeText: !effectiveIsActive
      ? (allItemsPaused && category.isActive ? 'Todos pausados' : 'Pausada')
      : null,
    showPauseIcon: effectiveIsActive,
    showPlayIcon: !effectiveIsActive,
    titleStrikethrough: !effectiveIsActive,
  };
}

// Replicate the product effective status logic from Catalogo.tsx
function getProductEffectiveStatus(
  product: { status: string },
  categoryIsActive: boolean
) {
  const effectiveStatus = !categoryIsActive ? 'paused' : product.status;
  return {
    effectiveStatus,
    showAsActive: effectiveStatus === 'active',
    hasReducedOpacity: effectiveStatus !== 'active',
  };
}

describe('Category Effective Status', () => {
  describe('getCategoryEffectiveState', () => {
    it('should show as active when category is active and has active items', () => {
      const category = { isActive: true, name: 'Lanches' };
      const products = [
        { status: 'active' },
        { status: 'active' },
        { status: 'paused' },
      ];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(true);
      expect(state.allItemsPaused).toBe(false);
      expect(state.badgeText).toBeNull();
      expect(state.showPauseIcon).toBe(true);
      expect(state.showPlayIcon).toBe(false);
      expect(state.titleStrikethrough).toBe(false);
    });

    it('should show as paused when category is explicitly paused', () => {
      const category = { isActive: false, name: 'Lanches' };
      const products = [
        { status: 'active' },
        { status: 'active' },
      ];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(false);
      expect(state.badgeText).toBe('Pausada');
      expect(state.showPauseIcon).toBe(false);
      expect(state.showPlayIcon).toBe(true);
      expect(state.titleStrikethrough).toBe(true);
    });

    it('should show as "Todos pausados" when category is active but all items are paused', () => {
      const category = { isActive: true, name: 'Lanches' };
      const products = [
        { status: 'paused' },
        { status: 'paused' },
        { status: 'paused' },
      ];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(false);
      expect(state.allItemsPaused).toBe(true);
      expect(state.badgeText).toBe('Todos pausados');
      expect(state.showPauseIcon).toBe(false);
      expect(state.showPlayIcon).toBe(true);
      expect(state.titleStrikethrough).toBe(true);
    });

    it('should show as active when at least one item is active', () => {
      const category = { isActive: true, name: 'Lanches' };
      const products = [
        { status: 'paused' },
        { status: 'paused' },
        { status: 'active' },
      ];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(true);
      expect(state.allItemsPaused).toBe(false);
      expect(state.badgeText).toBeNull();
    });

    it('should show as active when category is active and has no products', () => {
      const category = { isActive: true, name: 'Lanches' };
      const products: { status: string }[] = [];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(true);
      expect(state.allItemsPaused).toBe(false);
      expect(state.badgeText).toBeNull();
    });

    it('should show as "Pausada" when category is explicitly paused and all items are paused', () => {
      const category = { isActive: false, name: 'Lanches' };
      const products = [
        { status: 'paused' },
        { status: 'paused' },
      ];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(false);
      // When category itself is paused, show "Pausada" not "Todos pausados"
      expect(state.badgeText).toBe('Pausada');
    });

    it('should handle single product paused', () => {
      const category = { isActive: true, name: 'Lanches' };
      const products = [{ status: 'paused' }];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(false);
      expect(state.allItemsPaused).toBe(true);
      expect(state.badgeText).toBe('Todos pausados');
    });

    it('should handle single product active', () => {
      const category = { isActive: true, name: 'Lanches' };
      const products = [{ status: 'active' }];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(true);
      expect(state.allItemsPaused).toBe(false);
      expect(state.badgeText).toBeNull();
    });

    it('should handle products with other statuses (e.g., draft) as non-active', () => {
      const category = { isActive: true, name: 'Lanches' };
      const products = [
        { status: 'draft' },
        { status: 'paused' },
      ];
      const state = getCategoryEffectiveState(category, products);
      expect(state.effectiveIsActive).toBe(false);
      expect(state.allItemsPaused).toBe(true);
      expect(state.badgeText).toBe('Todos pausados');
    });
  });

  describe('getProductEffectiveStatus', () => {
    it('should show active product as active when category is active', () => {
      const state = getProductEffectiveStatus({ status: 'active' }, true);
      expect(state.effectiveStatus).toBe('active');
      expect(state.showAsActive).toBe(true);
      expect(state.hasReducedOpacity).toBe(false);
    });

    it('should show paused product as paused when category is active', () => {
      const state = getProductEffectiveStatus({ status: 'paused' }, true);
      expect(state.effectiveStatus).toBe('paused');
      expect(state.showAsActive).toBe(false);
      expect(state.hasReducedOpacity).toBe(true);
    });

    it('should show active product as paused when category is paused', () => {
      const state = getProductEffectiveStatus({ status: 'active' }, false);
      expect(state.effectiveStatus).toBe('paused');
      expect(state.showAsActive).toBe(false);
      expect(state.hasReducedOpacity).toBe(true);
    });

    it('should show paused product as paused when category is paused', () => {
      const state = getProductEffectiveStatus({ status: 'paused' }, false);
      expect(state.effectiveStatus).toBe('paused');
      expect(state.showAsActive).toBe(false);
      expect(state.hasReducedOpacity).toBe(true);
    });

    it('should force all items to paused visual when category is not active', () => {
      const products = [
        { status: 'active' },
        { status: 'active' },
        { status: 'paused' },
      ];
      const results = products.map(p => getProductEffectiveStatus(p, false));
      // All should appear paused regardless of individual status
      results.forEach(r => {
        expect(r.effectiveStatus).toBe('paused');
        expect(r.showAsActive).toBe(false);
        expect(r.hasReducedOpacity).toBe(true);
      });
    });
  });
});
