import {
  checkLessonUnlockStatus,
  // loadLessonPrerequisites,
} from '../prerequisites';
import {supabase} from '@/services/supabase';

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  profiles: {},
}));

describe('prerequisites service', () => {
  const mockUserId = 'user-123';
  const mockLessonId = 'lesson-456';
  const mockCourseId = 'course-789';
  const mockPrereqId = 'lesson-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLessonUnlockStatus', () => {
    it('should return unlocked if no prerequisites exist', async () => {
      // Mock loadLessonPrerequisites to return empty array
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({data: [], error: null}),
        }),
      });

      const status = await checkLessonUnlockStatus(
        mockUserId,
        mockLessonId,
        mockCourseId,
      );

      expect(status.isUnlocked).toBe(true);
    });

    it('should return unlocked if prerequisites are met', async () => {
      // Mock prerequisites
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'prereq-1',
                lesson_id: mockLessonId,
                prerequisite_lesson_id: mockPrereqId,
                required_completion_count: 1,
                prerequisiteLesson: {title: 'Intro'},
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock user progress
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [
                {
                  lesson_id: mockPrereqId,
                  completion_count: 1,
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      const status = await checkLessonUnlockStatus(
        mockUserId,
        mockLessonId,
        mockCourseId,
      );

      expect(status.isUnlocked).toBe(true);
    });

    it('should return locked if prerequisites are NOT met', async () => {
      // Mock prerequisites
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'prereq-1',
                lesson_id: mockLessonId,
                prerequisite_lesson_id: mockPrereqId,
                required_completion_count: 1,
                prerequisiteLesson: {title: 'Intro'},
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock user progress (incomplete)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [
                {
                  lesson_id: mockPrereqId,
                  completion_count: 0,
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      const status = await checkLessonUnlockStatus(
        mockUserId,
        mockLessonId,
        mockCourseId,
      );

      expect(status.isUnlocked).toBe(false);
      expect(status.reason).toBe('Prerequisites not met');
      expect(status.missingPrerequisites).toHaveLength(1);
      expect(status.missingPrerequisites![0].lessonId).toBe(mockPrereqId);
    });
  });
});
