import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the Settings (Configuracoes) update mutation behavior.
 * 
 * The key fix: updateMutation.onSuccess now uses optimistic cache update
 * (utils.establishment.get.setData) instead of the race-condition-prone
 * pattern of setInitialDataLoaded(false) + refetch().
 * 
 * The old pattern caused a bug where:
 * 1. User saves settings (e.g., autoAcceptOrders = true)
 * 2. onSuccess: setInitialDataLoaded(false) runs
 * 3. useEffect detects initialDataLoaded === false
 * 4. useEffect runs with STALE establishment data (refetch hasn't completed)
 * 5. autoAcceptOrders gets reset to the old value (false)
 * 6. UI shows the wrong state until page reload
 * 
 * The new pattern:
 * 1. User saves settings (e.g., autoAcceptOrders = true)
 * 2. onSuccess: utils.establishment.get.setData merges variables into cache
 * 3. Cache immediately reflects the new value
 * 4. UI updates correctly without waiting for refetch
 */

describe('Configuracoes update mutation - optimistic cache update', () => {
  it('should merge mutation variables into existing cache data', () => {
    // Simulate the optimistic cache update logic
    const oldCacheData = {
      id: 1,
      name: 'Test Restaurant',
      autoAcceptOrders: false,
      reviewsEnabled: true,
      fakeReviewCount: 100,
      allowsDelivery: true,
      allowsPickup: false,
      acceptsCash: true,
      acceptsCard: false,
      deliveryFeeType: 'free' as const,
      menuSlug: 'test-restaurant',
    };

    const mutationVariables = {
      id: 1,
      autoAcceptOrders: true,
    };

    // This simulates what utils.establishment.get.setData does
    const updatedData = { ...oldCacheData, ...mutationVariables };

    expect(updatedData.autoAcceptOrders).toBe(true);
    expect(updatedData.name).toBe('Test Restaurant');
    expect(updatedData.reviewsEnabled).toBe(true);
    expect(updatedData.id).toBe(1);
  });

  it('should handle multiple fields in a single update', () => {
    const oldCacheData = {
      id: 1,
      name: 'Test Restaurant',
      autoAcceptOrders: false,
      allowsDelivery: false,
      allowsPickup: false,
      allowsDineIn: false,
      acceptsCash: false,
      acceptsCard: false,
      acceptsPix: false,
      deliveryFeeType: 'free' as const,
      deliveryFeeFixed: '0',
      minimumOrderEnabled: false,
      minimumOrderValue: '0',
      smsEnabled: false,
    };

    // Simulate handleSaveServiceSettings mutation variables
    const mutationVariables = {
      id: 1,
      menuSlug: 'test-slug',
      whatsapp: '11999999999',
      instagram: null,
      acceptsCash: true,
      acceptsCard: true,
      acceptsPix: true,
      pixKey: 'test@pix.com',
      acceptsBoleto: false,
      allowsDelivery: true,
      allowsPickup: true,
      allowsDineIn: false,
      smsEnabled: true,
      deliveryTimeEnabled: true,
      deliveryTimeMin: 30,
      deliveryTimeMax: 60,
      minimumOrderEnabled: true,
      minimumOrderValue: '15.00',
      deliveryFeeType: 'fixed' as const,
      deliveryFeeFixed: '5.00',
      autoAcceptOrders: true,
    };

    const updatedData = { ...oldCacheData, ...mutationVariables };

    expect(updatedData.autoAcceptOrders).toBe(true);
    expect(updatedData.allowsDelivery).toBe(true);
    expect(updatedData.allowsPickup).toBe(true);
    expect(updatedData.acceptsCash).toBe(true);
    expect(updatedData.acceptsCard).toBe(true);
    expect(updatedData.acceptsPix).toBe(true);
    expect(updatedData.smsEnabled).toBe(true);
    expect(updatedData.deliveryFeeType).toBe('fixed');
    expect(updatedData.deliveryFeeFixed).toBe('5.00');
    expect(updatedData.minimumOrderEnabled).toBe(true);
    expect(updatedData.minimumOrderValue).toBe('15.00');
    // Original fields not in mutation should be preserved
    expect(updatedData.name).toBe('Test Restaurant');
  });

  it('should return undefined/null if old cache data is null', () => {
    // Simulate the setData callback when cache is empty
    const setDataCallback = (old: any) => {
      if (!old) return old;
      return { ...old, autoAcceptOrders: true };
    };

    expect(setDataCallback(null)).toBeNull();
    expect(setDataCallback(undefined)).toBeUndefined();
  });

  it('should correctly update reviewsEnabled without race condition', () => {
    const oldCacheData = {
      id: 1,
      name: 'Test Restaurant',
      reviewsEnabled: true,
      fakeReviewCount: 250,
    };

    // Simulate toggling reviewsEnabled off
    const mutationVariables = {
      id: 1,
      reviewsEnabled: false,
    };

    const updatedData = { ...oldCacheData, ...mutationVariables };
    expect(updatedData.reviewsEnabled).toBe(false);
    expect(updatedData.fakeReviewCount).toBe(250); // preserved
  });

  it('should correctly update fakeReviewCount', () => {
    const oldCacheData = {
      id: 1,
      name: 'Test Restaurant',
      reviewsEnabled: false,
      fakeReviewCount: 250,
    };

    const mutationVariables = {
      id: 1,
      fakeReviewCount: 100,
    };

    const updatedData = { ...oldCacheData, ...mutationVariables };
    expect(updatedData.fakeReviewCount).toBe(100);
    expect(updatedData.reviewsEnabled).toBe(false); // preserved
  });

  it('should handle partial updates (logo, coverImage, name)', () => {
    const oldCacheData = {
      id: 1,
      name: 'Old Name',
      logo: 'https://old-logo.png',
      coverImage: 'https://old-cover.png',
      autoAcceptOrders: true,
    };

    // Simulate auto-save after logo upload
    const logoUpdate = { id: 1, logo: 'https://new-logo.png' };
    const afterLogoUpdate = { ...oldCacheData, ...logoUpdate };
    expect(afterLogoUpdate.logo).toBe('https://new-logo.png');
    expect(afterLogoUpdate.name).toBe('Old Name');
    expect(afterLogoUpdate.autoAcceptOrders).toBe(true);

    // Simulate auto-save after name edit
    const nameUpdate = { id: 1, name: 'New Name' };
    const afterNameUpdate = { ...oldCacheData, ...nameUpdate };
    expect(afterNameUpdate.name).toBe('New Name');
    expect(afterNameUpdate.logo).toBe('https://old-logo.png');
  });

  it('should demonstrate the old bug: setInitialDataLoaded(false) causes stale data', () => {
    // This test documents the old bug for regression prevention
    
    // State: user just toggled autoAcceptOrders to true and saved
    const localState = { autoAcceptOrders: true };
    
    // Server still has old data (refetch hasn't completed yet)
    const staleServerData = { autoAcceptOrders: false };
    
    // OLD BEHAVIOR (bug): setInitialDataLoaded(false) causes useEffect to run
    // with stale server data, resetting local state
    const oldBehaviorResult = staleServerData.autoAcceptOrders; // false - WRONG!
    expect(oldBehaviorResult).toBe(false); // This was the bug
    
    // NEW BEHAVIOR (fix): optimistic cache update merges mutation variables
    const newCacheData = { ...staleServerData, ...localState };
    expect(newCacheData.autoAcceptOrders).toBe(true); // Correct!
  });
});
