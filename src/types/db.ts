export type LearningGoal = 'school' | 'travel' | 'play' | 'future';

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  child_name: string | null;
  child_age: number | null;
  parent_phone: string | null;
  preferred_language: 'ka' | 'en';
  learning_goal: LearningGoal | null;
  hearts: number;
  hearts_refilled_at: string;
  gems: number;
  xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_freezes: number;
  created_at: string;
  updated_at: string;
};

export type World = {
  id: string;
  slug: string;
  title_en: string;
  title_ka: string;
  description_en: string | null;
  description_ka: string | null;
  emoji: string | null;
  color: string;
  display_order: number;
  is_premium: boolean;
  is_published: boolean;
};

export type Unit = {
  id: string;
  world_id: string;
  slug: string;
  title_en: string;
  title_ka: string;
  description_en: string | null;
  description_ka: string | null;
  emoji: string | null;
  display_order: number;
  is_premium: boolean;
  is_published: boolean;
};

export type Lesson = {
  id: string;
  unit_id: string;
  slug: string;
  title_en: string;
  title_ka: string;
  emoji: string | null;
  display_order: number;
  xp_reward: number;
  is_published: boolean;
};

export type ExerciseType =
  | 'learn'
  | 'match'
  | 'listen'
  | 'speak'
  | 'build'
  | 'translate'
  | 'story'
  | 'roleplay';

export type Exercise = {
  id: string;
  lesson_id: string;
  display_order: number;
  exercise_type: ExerciseType;
  data: ExerciseData;
};

export type ExerciseData =
  | LearnData
  | MatchData
  | ListenData
  | SpeakData
  | BuildData
  | TranslateData
  | StoryData
  | RoleplayData;

export type LearnData = {
  emoji: string;
  en: string;
  ka: string;
  sound: string;
  audio_url?: string;
};

export type MatchChoice = { en: string; ka: string; emoji?: string };

export type MatchData = {
  prompt_en: string;
  prompt_ka: string;
  correct: string;
  choices: MatchChoice[];
};

export type ListenData = {
  audio_url?: string;
  prompt_en: string;
  prompt_ka: string;
  correct: string;
  choices: MatchChoice[];
};

export type SpeakData = {
  target: string;
  ka: string;
  prompt_en: string;
  prompt_ka: string;
  audio_url?: string;
};

export type BuildData = {
  target: string[];
  bank: string[];
  prompt_en: string;
  prompt_ka: string;
  ka: string;
};

export type TranslateData = {
  source_en: string;
  target_ka: string;
  accept: string[];
};

export type StoryScene = { image: string; en: string; ka: string };
export type StoryData = {
  scenes: StoryScene[];
  questions: { en: string; ka: string; correct: string; choices: string[] }[];
};

export type RoleplayData = {
  scenario_en: string;
  scenario_ka: string;
  system_prompt: string;
  target_phrases: string[];
};

export type SubscriptionTier = 'free' | 'premium' | 'family';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'in_progress' | 'completed' | 'mastered';
  best_score: number;
  attempts: number;
  total_time_seconds: number;
  first_completed_at: string | null;
  last_attempted_at: string;
};

export type Achievement = {
  id: string;
  slug: string;
  title_en: string;
  title_ka: string;
  description_en: string | null;
  description_ka: string | null;
  emoji: string | null;
  xp_reward: number;
  gem_reward: number;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
};
