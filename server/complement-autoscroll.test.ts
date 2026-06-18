/**
 * Tests for complement group auto-scroll and visual feedback logic.
 * 
 * These tests verify the pure logic that determines:
 * 1. Whether a complement group is "complete" (totalSelected >= maxQuantity)
 * 2. Whether auto-scroll should trigger (group just became complete)
 * 3. The correct target for auto-scroll (next group or observations field)
 * 4. Visual feedback state (border color, header color, badge text)
 */
import { describe, it, expect } from 'vitest';

// ---- Pure logic extracted from PublicMenu.tsx ----

interface ComplementGroup {
  id: number;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  isRequired: boolean;
  items: Array<{ id: number; name: string; price: string; priceMode?: string }>;
}

/**
 * Determines if a group is complete (all slots filled)
 */
function isGroupComplete(
  selectedInGroup: Map<number, number>,
  maxQuantity: number
): boolean {
  const totalSelected = Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0);
  return totalSelected >= maxQuantity;
}

/**
 * Calculates total selected items in a group
 */
function getTotalSelectedInGroup(selectedInGroup: Map<number, number>): number {
  return Array.from(selectedInGroup.values()).reduce((a, b) => a + b, 0);
}

/**
 * Determines the scroll target after a group is completed
 * Returns: { type: 'group', groupId: number } | { type: 'observations' } | null
 */
function getScrollTarget(
  groups: ComplementGroup[],
  completedGroupId: number
): { type: 'group'; groupId: number } | { type: 'observations' } | null {
  const currentIndex = groups.findIndex(g => g.id === completedGroupId);
  if (currentIndex === -1) return null;
  
  if (currentIndex < groups.length - 1) {
    const nextGroup = groups[currentIndex + 1];
    return { type: 'group', groupId: nextGroup.id };
  } else {
    // Last group → scroll to observations
    return { type: 'observations' };
  }
}

/**
 * Determines if auto-scroll should trigger after an increment/toggle action.
 * It should trigger only when the group JUST became complete (was not complete before, is complete now).
 */
function shouldAutoScroll(
  previousTotal: number,
  newTotal: number,
  maxQuantity: number
): boolean {
  return previousTotal < maxQuantity && newTotal >= maxQuantity;
}

/**
 * Gets the visual feedback state for a group
 */
function getGroupVisualState(
  selectedInGroup: Map<number, number>,
  group: ComplementGroup
): {
  isComplete: boolean;
  borderClass: string;
  headerBgClass: string;
  titleColorClass: string;
  badgeText: string | null;
  subtitleText: string;
} {
  const total = getTotalSelectedInGroup(selectedInGroup);
  const isComplete = total >= group.maxQuantity;

  return {
    isComplete,
    borderClass: isComplete ? 'border-2 border-red-400' : 'border border-gray-200',
    headerBgClass: isComplete ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200',
    titleColorClass: isComplete ? 'text-red-600' : 'text-gray-900',
    badgeText: isComplete ? 'Completo' : (group.isRequired ? 'Obrigatório' : null),
    subtitleText: isComplete
      ? `${total}/${group.maxQuantity} selecionado${group.maxQuantity > 1 ? 's' : ''}`
      : group.maxQuantity > 1
        ? `Máx: ${group.maxQuantity}`
        : 'Escolha até 1',
  };
}

// ---- Test Data ----

const sampleGroups: ComplementGroup[] = [
  {
    id: 1,
    name: 'Escolha o pão',
    minQuantity: 1,
    maxQuantity: 1,
    isRequired: true,
    items: [
      { id: 101, name: 'Pão brioche', price: '0' },
      { id: 102, name: 'Pão australiano', price: '2.00' },
      { id: 103, name: 'Pão integral', price: '1.50' },
    ],
  },
  {
    id: 2,
    name: 'Adicionais',
    minQuantity: 0,
    maxQuantity: 3,
    isRequired: false,
    items: [
      { id: 201, name: 'Bacon extra', price: '4.00' },
      { id: 202, name: 'Queijo cheddar', price: '3.00' },
      { id: 203, name: 'Ovo', price: '2.50' },
      { id: 204, name: 'Cebola caramelizada', price: '3.50' },
    ],
  },
  {
    id: 3,
    name: 'Molho',
    minQuantity: 1,
    maxQuantity: 2,
    isRequired: true,
    items: [
      { id: 301, name: 'Ketchup', price: '0' },
      { id: 302, name: 'Mostarda', price: '0' },
      { id: 303, name: 'Maionese', price: '0' },
      { id: 304, name: 'Barbecue', price: '1.00' },
    ],
  },
];

// ---- Tests ----

describe('Complement Group - isGroupComplete', () => {
  it('should return false when no items are selected', () => {
    const selected = new Map<number, number>();
    expect(isGroupComplete(selected, 3)).toBe(false);
  });

  it('should return false when total is below max', () => {
    const selected = new Map<number, number>([[201, 1], [202, 1]]);
    expect(isGroupComplete(selected, 3)).toBe(false);
  });

  it('should return true when total equals max', () => {
    const selected = new Map<number, number>([[201, 1], [202, 1], [203, 1]]);
    expect(isGroupComplete(selected, 3)).toBe(true);
  });

  it('should return true for radio group (max=1) with one selection', () => {
    const selected = new Map<number, number>([[101, 1]]);
    expect(isGroupComplete(selected, 1)).toBe(true);
  });

  it('should handle items with quantity > 1', () => {
    const selected = new Map<number, number>([[201, 2], [202, 1]]);
    expect(isGroupComplete(selected, 3)).toBe(true);
  });

  it('should handle single item with quantity equal to max', () => {
    const selected = new Map<number, number>([[201, 3]]);
    expect(isGroupComplete(selected, 3)).toBe(true);
  });
});

describe('Complement Group - getTotalSelectedInGroup', () => {
  it('should return 0 for empty map', () => {
    expect(getTotalSelectedInGroup(new Map())).toBe(0);
  });

  it('should sum all quantities', () => {
    const selected = new Map<number, number>([[201, 2], [202, 1], [203, 3]]);
    expect(getTotalSelectedInGroup(selected)).toBe(6);
  });

  it('should handle single item', () => {
    const selected = new Map<number, number>([[101, 1]]);
    expect(getTotalSelectedInGroup(selected)).toBe(1);
  });
});

describe('Complement Group - getScrollTarget', () => {
  it('should return next group when completing first group', () => {
    const result = getScrollTarget(sampleGroups, 1);
    expect(result).toEqual({ type: 'group', groupId: 2 });
  });

  it('should return next group when completing middle group', () => {
    const result = getScrollTarget(sampleGroups, 2);
    expect(result).toEqual({ type: 'group', groupId: 3 });
  });

  it('should return observations when completing last group', () => {
    const result = getScrollTarget(sampleGroups, 3);
    expect(result).toEqual({ type: 'observations' });
  });

  it('should return null for unknown group id', () => {
    const result = getScrollTarget(sampleGroups, 999);
    expect(result).toBeNull();
  });

  it('should handle single group (scroll to observations)', () => {
    const singleGroup = [sampleGroups[0]];
    const result = getScrollTarget(singleGroup, 1);
    expect(result).toEqual({ type: 'observations' });
  });

  it('should handle two groups correctly', () => {
    const twoGroups = [sampleGroups[0], sampleGroups[1]];
    expect(getScrollTarget(twoGroups, 1)).toEqual({ type: 'group', groupId: 2 });
    expect(getScrollTarget(twoGroups, 2)).toEqual({ type: 'observations' });
  });
});

describe('Complement Group - shouldAutoScroll', () => {
  it('should trigger when going from 0 to max (radio)', () => {
    expect(shouldAutoScroll(0, 1, 1)).toBe(true);
  });

  it('should trigger when going from below max to exactly max', () => {
    expect(shouldAutoScroll(2, 3, 3)).toBe(true);
  });

  it('should NOT trigger when already at max (no change)', () => {
    expect(shouldAutoScroll(3, 3, 3)).toBe(false);
  });

  it('should NOT trigger when still below max', () => {
    expect(shouldAutoScroll(0, 1, 3)).toBe(false);
    expect(shouldAutoScroll(1, 2, 3)).toBe(false);
  });

  it('should NOT trigger when decrementing', () => {
    expect(shouldAutoScroll(3, 2, 3)).toBe(false);
  });

  it('should trigger for max=2 going from 1 to 2', () => {
    expect(shouldAutoScroll(1, 2, 2)).toBe(true);
  });

  it('should NOT trigger for max=2 going from 0 to 1', () => {
    expect(shouldAutoScroll(0, 1, 2)).toBe(false);
  });
});

describe('Complement Group - getGroupVisualState', () => {
  it('should show default state when nothing selected', () => {
    const state = getGroupVisualState(new Map(), sampleGroups[1]); // Adicionais (not required)
    expect(state.isComplete).toBe(false);
    expect(state.borderClass).toBe('border border-gray-200');
    expect(state.headerBgClass).toBe('bg-gray-50 border-gray-200');
    expect(state.titleColorClass).toBe('text-gray-900');
    expect(state.badgeText).toBeNull();
  });

  it('should show "Obrigatório" badge for required incomplete group', () => {
    const state = getGroupVisualState(new Map(), sampleGroups[0]); // Escolha o pão (required)
    expect(state.isComplete).toBe(false);
    expect(state.badgeText).toBe('Obrigatório');
  });

  it('should show "Completo" state when group is full', () => {
    const selected = new Map<number, number>([[201, 1], [202, 1], [203, 1]]);
    const state = getGroupVisualState(selected, sampleGroups[1]); // Adicionais, max=3
    expect(state.isComplete).toBe(true);
    expect(state.borderClass).toBe('border-2 border-red-400');
    expect(state.headerBgClass).toBe('bg-red-50 border-red-200');
    expect(state.titleColorClass).toBe('text-red-600');
    expect(state.badgeText).toBe('Completo');
    expect(state.subtitleText).toBe('3/3 selecionados');
  });

  it('should show "Completo" for radio group with selection', () => {
    const selected = new Map<number, number>([[101, 1]]);
    const state = getGroupVisualState(selected, sampleGroups[0]); // Escolha o pão, max=1
    expect(state.isComplete).toBe(true);
    expect(state.badgeText).toBe('Completo');
    expect(state.subtitleText).toBe('1/1 selecionado');
  });

  it('should show correct subtitle for partially filled group', () => {
    const selected = new Map<number, number>([[201, 1]]);
    const state = getGroupVisualState(selected, sampleGroups[1]); // Adicionais, max=3
    expect(state.isComplete).toBe(false);
    expect(state.subtitleText).toBe('Máx: 3');
  });

  it('should use singular "selecionado" for max=1', () => {
    const selected = new Map<number, number>([[101, 1]]);
    const state = getGroupVisualState(selected, sampleGroups[0]); // max=1
    expect(state.subtitleText).toBe('1/1 selecionado');
  });

  it('should use plural "selecionados" for max>1', () => {
    const selected = new Map<number, number>([[301, 1], [302, 1]]);
    const state = getGroupVisualState(selected, sampleGroups[2]); // Molho, max=2
    expect(state.subtitleText).toBe('2/2 selecionados');
  });

  it('should show "Escolha até 1" for non-required radio group', () => {
    const nonRequiredRadio: ComplementGroup = {
      id: 99,
      name: 'Bebida',
      minQuantity: 0,
      maxQuantity: 1,
      isRequired: false,
      items: [{ id: 991, name: 'Coca', price: '5.00' }],
    };
    const state = getGroupVisualState(new Map(), nonRequiredRadio);
    expect(state.subtitleText).toBe('Escolha até 1');
    expect(state.badgeText).toBeNull();
  });
});

describe('Complement Group - Integration scenarios', () => {
  it('scenario: user fills radio group → should scroll to next group', () => {
    // User selects "Pão brioche" in group 1 (radio, max=1)
    const previousTotal = 0;
    const newTotal = 1;
    const maxQuantity = 1;

    expect(shouldAutoScroll(previousTotal, newTotal, maxQuantity)).toBe(true);
    expect(getScrollTarget(sampleGroups, 1)).toEqual({ type: 'group', groupId: 2 });
  });

  it('scenario: user fills 3rd additional → should scroll to molho group', () => {
    // User adds 3rd item in Adicionais (max=3)
    const previousTotal = 2;
    const newTotal = 3;
    const maxQuantity = 3;

    expect(shouldAutoScroll(previousTotal, newTotal, maxQuantity)).toBe(true);
    expect(getScrollTarget(sampleGroups, 2)).toEqual({ type: 'group', groupId: 3 });
  });

  it('scenario: user fills last group → should scroll to observations', () => {
    // User selects 2nd molho in last group (max=2)
    const previousTotal = 1;
    const newTotal = 2;
    const maxQuantity = 2;

    expect(shouldAutoScroll(previousTotal, newTotal, maxQuantity)).toBe(true);
    expect(getScrollTarget(sampleGroups, 3)).toEqual({ type: 'observations' });
  });

  it('scenario: user adds 2nd of 3 additionals → should NOT scroll', () => {
    const previousTotal = 1;
    const newTotal = 2;
    const maxQuantity = 3;

    expect(shouldAutoScroll(previousTotal, newTotal, maxQuantity)).toBe(false);
  });

  it('scenario: user removes item from complete group → visual state reverts', () => {
    // Group was complete (3/3), user removes one
    const afterRemoval = new Map<number, number>([[201, 1], [202, 1]]);
    const state = getGroupVisualState(afterRemoval, sampleGroups[1]);
    expect(state.isComplete).toBe(false);
    expect(state.badgeText).toBeNull(); // Not required, so no badge
    expect(state.borderClass).toBe('border border-gray-200');
  });

  it('scenario: user changes radio selection → should still scroll (radio always triggers)', () => {
    // Radio group: switching from one option to another
    // In radio mode, the selection is replaced, so previousTotal is effectively 0 (new map created)
    // and newTotal is 1
    expect(shouldAutoScroll(0, 1, 1)).toBe(true);
  });
});
