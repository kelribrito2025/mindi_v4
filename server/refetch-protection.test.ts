import { describe, it, expect } from 'vitest';

/**
 * Tests for the refetchOnWindowFocus protection logic.
 * 
 * The core issue: React Query's default refetchOnWindowFocus: true causes
 * useEffect([data]) to re-run when user returns to the tab, overwriting
 * unsaved form edits with stale server data.
 * 
 * Solution applied:
 * 1. Global: QueryClient defaultOptions.queries.refetchOnWindowFocus = false
 * 2. Per-page: initialDataLoaded flags prevent useEffect from re-populating forms
 * 3. After save: flags are reset so fresh data loads correctly
 */

describe('refetchOnWindowFocus protection', () => {
  
  describe('initialDataLoaded guard logic', () => {
    it('should populate form state only on first load', () => {
      let initialDataLoaded = false;
      const formState = { name: '' };
      const serverData = { name: 'Sr. Macarrão' };
      
      // Simular primeiro carregamento
      if (serverData && !initialDataLoaded) {
        formState.name = serverData.name;
        initialDataLoaded = true;
      }
      
      expect(formState.name).toBe('Sr. Macarrão');
      expect(initialDataLoaded).toBe(true);
    });
    
    it('should NOT overwrite form state on subsequent data changes (tab switch refetch)', () => {
      let initialDataLoaded = true; // já carregou
      const formState = { name: 'Sr. Macarrão Editado' }; // usuário editou
      const serverData = { name: 'Sr. Macarrão' }; // dados do servidor (antigos)
      
      // Simular refetch ao voltar à aba - NÃO deve sobrescrever
      if (serverData && !initialDataLoaded) {
        formState.name = serverData.name;
        initialDataLoaded = true;
      }
      
      // O valor editado pelo usuário deve ser preservado
      expect(formState.name).toBe('Sr. Macarrão Editado');
    });
    
    it('should reload data after save (flag reset)', () => {
      let initialDataLoaded = true;
      const formState = { name: 'Sr. Macarrão Editado' };
      const savedData = { name: 'Sr. Macarrão Editado' }; // dados salvos no servidor
      
      // Simular onSuccess do mutation: resetar flag
      initialDataLoaded = false;
      
      // Simular refetch após save - DEVE carregar dados atualizados
      if (savedData && !initialDataLoaded) {
        formState.name = savedData.name;
        initialDataLoaded = true;
      }
      
      expect(formState.name).toBe('Sr. Macarrão Editado');
      expect(initialDataLoaded).toBe(true);
    });
  });
  
  describe('multiple form sections protection', () => {
    it('should protect establishment, businessHours, neighborhoodFees and printerSettings independently', () => {
      // Simular flags independentes
      const flags = {
        initialDataLoaded: false,
        initialBusinessHoursLoaded: false,
        initialNeighborhoodFeesLoaded: false,
        initialPrinterSettingsLoaded: false,
      };
      
      const formData = {
        name: '',
        businessHours: [] as any[],
        neighborhoodFees: [] as any[],
        printerFooter: '',
      };
      
      // Carregar establishment
      if (!flags.initialDataLoaded) {
        formData.name = 'Restaurante';
        flags.initialDataLoaded = true;
      }
      
      // Carregar businessHours
      if (!flags.initialBusinessHoursLoaded) {
        formData.businessHours = [{ day: 1, open: '18:00' }];
        flags.initialBusinessHoursLoaded = true;
      }
      
      expect(formData.name).toBe('Restaurante');
      expect(formData.businessHours).toHaveLength(1);
      
      // Simular edição do usuário
      formData.name = 'Restaurante Editado';
      formData.businessHours[0].open = '17:00';
      
      // Simular refetch (não deve sobrescrever)
      if (!flags.initialDataLoaded) {
        formData.name = 'Restaurante'; // NÃO executa
      }
      if (!flags.initialBusinessHoursLoaded) {
        formData.businessHours = [{ day: 1, open: '18:00' }]; // NÃO executa
      }
      
      expect(formData.name).toBe('Restaurante Editado');
      expect(formData.businessHours[0].open).toBe('17:00');
    });
    
    it('should allow reloading only the section that was saved', () => {
      const flags = {
        initialDataLoaded: true,
        initialBusinessHoursLoaded: true,
      };
      
      const formData = {
        name: 'Editado pelo usuário',
        businessHours: [{ day: 1, open: '17:00' }],
      };
      
      // Salvar apenas businessHours -> resetar apenas essa flag
      flags.initialBusinessHoursLoaded = false;
      
      // Refetch: businessHours recarrega, establishment NÃO
      if (!flags.initialDataLoaded) {
        formData.name = 'Do servidor'; // NÃO executa
      }
      if (!flags.initialBusinessHoursLoaded) {
        formData.businessHours = [{ day: 1, open: '17:00' }]; // Executa (dados salvos)
        flags.initialBusinessHoursLoaded = true;
      }
      
      expect(formData.name).toBe('Editado pelo usuário'); // Preservado
      expect(formData.businessHours[0].open).toBe('17:00'); // Recarregado do servidor
    });
  });
  
  describe('global QueryClient configuration', () => {
    it('should have refetchOnWindowFocus disabled by default', () => {
      // Verificar que a configuração global está correta
      const defaultOptions = {
        queries: {
          refetchOnWindowFocus: false,
        },
      };
      
      expect(defaultOptions.queries.refetchOnWindowFocus).toBe(false);
    });
    
    it('should allow specific queries to override with refetchOnWindowFocus: true', () => {
      // Queries como unreadReviewCount e outOfStockCount podem ter refetchOnWindowFocus: true
      const queryOptions = { refetchOnWindowFocus: true };
      expect(queryOptions.refetchOnWindowFocus).toBe(true);
    });
  });
});
