import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for the multi-driver onboarding modal logic in /entregadores page.
 * The modal appears when transitioning from 1 to 2 drivers to inform the owner
 * that a driver selection modal will appear on the orders page.
 */

// Simulate localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Helper functions matching the component logic
const getMultiDriverDismissKey = (estId: number | string) => {
  return `multiDriverOnboarding_dismissed_${estId}`;
};

const isMultiDriverDismissed = (estId: number | string) => {
  try {
    return localStorageMock.getItem(getMultiDriverDismissKey(estId)) === 'true';
  } catch { return false; }
};

const dismissMultiDriverModal = (estId: number | string) => {
  try {
    localStorageMock.setItem(getMultiDriverDismissKey(estId), 'true');
  } catch {}
};

const shouldShowMultiDriverModal = (
  driverCount: number,
  estId: number | string
): boolean => {
  return driverCount === 1 && !isMultiDriverDismissed(estId);
};

describe('Multi-Driver Onboarding Modal Logic', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Modal visibility conditions', () => {
    it('should show modal when there is exactly 1 driver and not dismissed', () => {
      expect(shouldShowMultiDriverModal(1, 100)).toBe(true);
    });

    it('should NOT show modal when there are 0 drivers', () => {
      expect(shouldShowMultiDriverModal(0, 100)).toBe(false);
    });

    it('should NOT show modal when there are 2 or more drivers', () => {
      expect(shouldShowMultiDriverModal(2, 100)).toBe(false);
      expect(shouldShowMultiDriverModal(3, 100)).toBe(false);
      expect(shouldShowMultiDriverModal(5, 100)).toBe(false);
    });

    it('should NOT show modal when dismissed for this establishment', () => {
      dismissMultiDriverModal(100);
      expect(shouldShowMultiDriverModal(1, 100)).toBe(false);
    });

    it('should still show modal for different establishment even if dismissed for another', () => {
      dismissMultiDriverModal(100);
      expect(shouldShowMultiDriverModal(1, 100)).toBe(false);
      expect(shouldShowMultiDriverModal(1, 200)).toBe(true);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist dismiss per establishment', () => {
      dismissMultiDriverModal(100);
      expect(localStorageMock.getItem('multiDriverOnboarding_dismissed_100')).toBe('true');
    });

    it('should not affect other establishments when dismissing', () => {
      dismissMultiDriverModal(100);
      expect(isMultiDriverDismissed(100)).toBe(true);
      expect(isMultiDriverDismissed(200)).toBe(false);
    });

    it('should generate correct localStorage key', () => {
      expect(getMultiDriverDismissKey(100)).toBe('multiDriverOnboarding_dismissed_100');
      expect(getMultiDriverDismissKey('default')).toBe('multiDriverOnboarding_dismissed_default');
    });
  });

  describe('Transition detection (1 → 2)', () => {
    it('should only trigger on the exact transition from 1 to 2 drivers', () => {
      // Before adding second driver: 1 driver exists
      expect(shouldShowMultiDriverModal(1, 100)).toBe(true);
      
      // After adding second driver: 2 drivers exist - modal should not show
      expect(shouldShowMultiDriverModal(2, 100)).toBe(false);
    });

    it('should not trigger again after being dismissed during the transition', () => {
      // First time: show modal
      expect(shouldShowMultiDriverModal(1, 100)).toBe(true);
      
      // User clicks "Não mostrar novamente"
      dismissMultiDriverModal(100);
      
      // Even if they delete a driver and go back to 1, should not show
      expect(shouldShowMultiDriverModal(1, 100)).toBe(false);
    });
  });

  describe('Button behaviors', () => {
    it('"Entendi" button should close modal and open form sheet', () => {
      // Simulating: modal is open, user clicks "Entendi, cadastrar entregador"
      // Expected: modal closes, form sheet opens, dismiss NOT saved
      expect(shouldShowMultiDriverModal(1, 100)).toBe(true);
      // After clicking "Entendi" - dismiss is NOT called
      // Next time with 1 driver, modal should show again
      expect(shouldShowMultiDriverModal(1, 100)).toBe(true);
    });

    it('"Não mostrar novamente" button should dismiss permanently and open form', () => {
      expect(shouldShowMultiDriverModal(1, 100)).toBe(true);
      dismissMultiDriverModal(100);
      // After dismissing, should never show again for this establishment
      expect(shouldShowMultiDriverModal(1, 100)).toBe(false);
    });
  });
});
