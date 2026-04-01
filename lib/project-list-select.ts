/** Supabase select string for dashboard / list views (avoids loading full screenplay bodies). */
export const PROJECT_LIST_COLUMNS =
  "id, user_id, title, description, genre, status, created_at, updated_at" as const
