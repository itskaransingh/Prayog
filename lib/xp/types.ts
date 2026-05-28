export interface UserXP {
    id: string;
    user_id: string;
    total_xp: number;
    created_at: string;
    updated_at: string;
}

export interface UserTaskXPEvent {
    id: string;
    user_id: string;
    question_id: string;
    topic_number: number;
    attempt_number: number;
    xp_earned: number;
    created_at: string;
}

export interface UserContentXPEvent {
    id: string;
    user_id: string;
    question_id: string;
    chapter_id: string;
    topic_number: number;
    xp_earned: number;
    earned_at: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_key: string;
    xp_awarded: number;
    awarded_at: string;
}

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    name: string;
    initials: string;
    total_xp: number;
    isYou?: boolean;
}

export const XP_BY_ATTEMPT = [50, 25, 15, 10] as const;
export const CHAPTER_COMPLETION_BONUS_XP = 100;
export const COURSE_COMPLETION_BONUS_XP = 100;

export function getXPForAttempt(attemptNumber: number): number {
    if (attemptNumber <= 0) return XP_BY_ATTEMPT[XP_BY_ATTEMPT.length - 1];
    return XP_BY_ATTEMPT[Math.min(attemptNumber - 1, XP_BY_ATTEMPT.length - 1)];
}