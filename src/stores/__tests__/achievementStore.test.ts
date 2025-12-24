import {useAchievementStore} from '../achievementStore';
import {supabase} from '@/services/supabase';

// Mock the supabase service
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  zustandStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('achievementStore', () => {
  const mockUserId = 'test-user-id';
  const mockSupabaseFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    // Reset store state
    useAchievementStore.getState().reset();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should load unlocked achievements from database', async () => {
      // Mock database response with unlocked achievements
      const mockUnlockedAchievements = [
        {
          id: '1',
          user_id: mockUserId,
          achievement_id: 'FIRST_STEPS',
          language_id: 'irish_std',
          unlocked_at: '2025-01-01T00:00:00Z',
          metadata: null,
        },
        {
          id: '2',
          user_id: mockUserId,
          achievement_id: 'SCHOLAR',
          language_id: 'irish_std',
          unlocked_at: '2025-01-02T00:00:00Z',
          metadata: null,
        },
        {
          id: '3',
          user_id: mockUserId,
          achievement_id: 'BILINGUAL',
          language_id: null, // Polyglot achievement
          unlocked_at: '2025-01-03T00:00:00Z',
          metadata: null,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockUnlockedAchievements,
            error: null,
          }),
        }),
      });

      await useAchievementStore.getState().initialize(mockUserId);

      const {achievementsByLanguage, polyglotAchievements} =
        useAchievementStore.getState();

      // Check language-specific achievements
      const irishAchievements = achievementsByLanguage.get('irish_std');
      expect(irishAchievements).toBeDefined();
      expect(irishAchievements?.filter(a => a.isUnlocked)).toHaveLength(2);
      expect(
        irishAchievements?.find(a => a.id === 'first_steps')?.isUnlocked,
      ).toBe(true);
      expect(irishAchievements?.find(a => a.id === 'scholar')?.isUnlocked).toBe(
        true,
      );

      // Check polyglot achievements
      const bilingualAchievement = polyglotAchievements.find(
        a => a.id === 'bilingual',
      );
      expect(bilingualAchievement?.isUnlocked).toBe(true);
    });

    it('should handle empty database response', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      await useAchievementStore.getState().initialize(mockUserId);

      const {achievementsByLanguage, polyglotAchievements} =
        useAchievementStore.getState();

      // Should have empty language map
      expect(achievementsByLanguage.size).toBe(0);

      // Should have all polyglot achievements as locked
      expect(polyglotAchievements.every(a => !a.isUnlocked)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: {message: 'Database error'},
          }),
        }),
      });

      await useAchievementStore.getState().initialize(mockUserId);

      const {achievementsByLanguage, polyglotAchievements} =
        useAchievementStore.getState();

      // Should initialize with empty state
      expect(achievementsByLanguage.size).toBe(0);
      expect(polyglotAchievements.every(a => !a.isUnlocked)).toBe(true);
    });

    it('should group achievements by language correctly', async () => {
      const mockUnlockedAchievements = [
        {
          id: '1',
          user_id: mockUserId,
          achievement_id: 'FIRST_STEPS',
          language_id: 'irish_std',
          unlocked_at: '2025-01-01T00:00:00Z',
          metadata: null,
        },
        {
          id: '2',
          user_id: mockUserId,
          achievement_id: 'FIRST_STEPS',
          language_id: 'navajo',
          unlocked_at: '2025-01-02T00:00:00Z',
          metadata: null,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockUnlockedAchievements,
            error: null,
          }),
        }),
      });

      await useAchievementStore.getState().initialize(mockUserId);

      const {achievementsByLanguage} = useAchievementStore.getState();

      // Should have two languages
      expect(achievementsByLanguage.size).toBe(2);
      expect(achievementsByLanguage.has('irish_std')).toBe(true);
      expect(achievementsByLanguage.has('navajo')).toBe(true);

      // Both should have first_steps unlocked
      expect(
        achievementsByLanguage
          .get('irish_std')
          ?.find(a => a.id === 'first_steps')?.isUnlocked,
      ).toBe(true);
      expect(
        achievementsByLanguage.get('navajo')?.find(a => a.id === 'first_steps')
          ?.isUnlocked,
      ).toBe(true);
    });
  });

  describe('getAchievementsForLanguage', () => {
    it('should return existing achievements if already loaded', () => {
      const store = useAchievementStore.getState();

      // First call initializes
      const first = store.getAchievementsForLanguage('irish_std');
      // Second call returns cached
      const second = store.getAchievementsForLanguage('irish_std');

      expect(first).toBe(second); // Same reference
      expect(first).toHaveLength(6); // All language achievements
      expect(first.every(a => !a.isUnlocked)).toBe(true); // All locked initially
    });

    it('should create template achievements for new languages', () => {
      const store = useAchievementStore.getState();
      const achievements = store.getAchievementsForLanguage('navajo');

      expect(achievements).toHaveLength(6);
      expect(achievements.map(a => a.id)).toEqual(
        expect.arrayContaining([
          'first_steps',
          'scholar',
          'consistent',
          'dedicated',
          'master',
          'expert',
        ]),
      );
      expect(achievements.every(a => a.languageId === 'navajo')).toBe(true);
    });

    it('should preserve unlocked state after initialization', async () => {
      const mockUnlockedAchievements = [
        {
          id: '1',
          user_id: mockUserId,
          achievement_id: 'FIRST_STEPS',
          language_id: 'irish_std',
          unlocked_at: '2025-01-01T00:00:00Z',
          metadata: null,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockUnlockedAchievements,
            error: null,
          }),
        }),
      });

      await useAchievementStore.getState().initialize(mockUserId);

      const achievements = useAchievementStore
        .getState()
        .getAchievementsForLanguage('irish_std');

      expect(achievements.find(a => a.id === 'first_steps')?.isUnlocked).toBe(
        true,
      );
      expect(achievements.find(a => a.id === 'scholar')?.isUnlocked).toBe(
        false,
      );
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock a language-specific achievement', () => {
      let store = useAchievementStore.getState();

      // Initialize achievements for a language
      store.getAchievementsForLanguage('irish_std');

      // Unlock an achievement
      store.unlockAchievement('first_steps', 'irish_std');

      // Get fresh state after unlock
      store = useAchievementStore.getState();
      const achievements = store.achievementsByLanguage.get('irish_std');
      const unlockedAchievement = achievements?.find(
        a => a.id === 'first_steps',
      );

      expect(unlockedAchievement?.isUnlocked).toBe(true);
      expect(unlockedAchievement?.unlockedAt).toBeDefined();
    });

    it('should unlock a polyglot achievement', () => {
      let store = useAchievementStore.getState();

      store.unlockAchievement('bilingual');

      // Get fresh state after unlock
      store = useAchievementStore.getState();
      const {polyglotAchievements} = store;
      const bilingualAchievement = polyglotAchievements.find(
        a => a.id === 'bilingual',
      );

      expect(bilingualAchievement?.isUnlocked).toBe(true);
      expect(bilingualAchievement?.unlockedAt).toBeDefined();
    });

    it('should initialize achievements if language not loaded', () => {
      let store = useAchievementStore.getState();

      // Unlock without calling getAchievementsForLanguage first
      store.unlockAchievement('first_steps', 'navajo');

      // Get fresh state after unlock
      store = useAchievementStore.getState();
      const achievements = store.achievementsByLanguage.get('navajo');
      expect(achievements).toBeDefined();
      expect(achievements?.find(a => a.id === 'first_steps')?.isUnlocked).toBe(
        true,
      );
    });

    it('should not affect other languages when unlocking', () => {
      let store = useAchievementStore.getState();

      store.getAchievementsForLanguage('irish_std');
      store.getAchievementsForLanguage('navajo');

      store.unlockAchievement('first_steps', 'irish_std');

      // Get fresh state after unlock
      store = useAchievementStore.getState();
      const irishAchievements = store.achievementsByLanguage.get('irish_std');
      const navajoAchievements = store.achievementsByLanguage.get('navajo');

      expect(
        irishAchievements?.find(a => a.id === 'first_steps')?.isUnlocked,
      ).toBe(true);
      expect(
        navajoAchievements?.find(a => a.id === 'first_steps')?.isUnlocked,
      ).toBe(false);
    });

    it('should not affect other achievements in same language', () => {
      let store = useAchievementStore.getState();

      store.getAchievementsForLanguage('irish_std');
      store.unlockAchievement('first_steps', 'irish_std');

      // Get fresh state after unlock
      store = useAchievementStore.getState();
      const achievements = store.achievementsByLanguage.get('irish_std');

      expect(achievements?.find(a => a.id === 'first_steps')?.isUnlocked).toBe(
        true,
      );
      expect(achievements?.find(a => a.id === 'scholar')?.isUnlocked).toBe(
        false,
      );
    });
  });

  describe('setCurrentLanguage', () => {
    it('should update the current language', () => {
      let store = useAchievementStore.getState();

      store.setCurrentLanguage('navajo');

      // Get fresh state after setting
      store = useAchievementStore.getState();
      expect(store.currentLanguageId).toBe('navajo');
    });

    it('should allow setting to null', () => {
      const store = useAchievementStore.getState();

      store.setCurrentLanguage('irish_std');
      store.setCurrentLanguage(null);

      expect(store.currentLanguageId).toBeNull();
    });
  });

  describe('reset', () => {
    it('should clear all achievement data', async () => {
      const mockUnlockedAchievements = [
        {
          id: '1',
          user_id: mockUserId,
          achievement_id: 'FIRST_STEPS',
          language_id: 'irish_std',
          unlocked_at: '2025-01-01T00:00:00Z',
          metadata: null,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockUnlockedAchievements,
            error: null,
          }),
        }),
      });

      let store = useAchievementStore.getState();

      await store.initialize(mockUserId);
      store.setCurrentLanguage('irish_std');

      // Get fresh state after operations
      store = useAchievementStore.getState();

      // Verify data exists
      expect(store.achievementsByLanguage.size).toBeGreaterThan(0);
      expect(store.currentLanguageId).toBe('irish_std');

      // Reset
      store.reset();

      // Get fresh state after reset
      store = useAchievementStore.getState();

      // Verify cleared
      expect(store.achievementsByLanguage.size).toBe(0);
      expect(store.currentLanguageId).toBeNull();
      expect(store.polyglotAchievements.every(a => !a.isUnlocked)).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should maintain correct state through multiple operations', async () => {
      const mockUnlockedAchievements = [
        {
          id: '1',
          user_id: mockUserId,
          achievement_id: 'FIRST_STEPS',
          language_id: 'irish_std',
          unlocked_at: '2025-01-01T00:00:00Z',
          metadata: null,
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockUnlockedAchievements,
            error: null,
          }),
        }),
      });

      let store = useAchievementStore.getState();

      // Initialize from database
      await store.initialize(mockUserId);

      // Add achievements for a new language
      store.unlockAchievement('first_steps', 'navajo');
      store.unlockAchievement('scholar', 'navajo');

      // Unlock polyglot achievement
      store.unlockAchievement('bilingual');

      // Get fresh state after all operations
      store = useAchievementStore.getState();

      // Verify all states
      const irishAchievements = store.achievementsByLanguage.get('irish_std');
      const navajoAchievements = store.achievementsByLanguage.get('navajo');
      const {polyglotAchievements} = store;

      expect(irishAchievements?.filter(a => a.isUnlocked).length).toBe(1);
      expect(navajoAchievements?.filter(a => a.isUnlocked).length).toBe(2);
      expect(polyglotAchievements.filter(a => a.isUnlocked).length).toBe(1);
    });
  });
});
