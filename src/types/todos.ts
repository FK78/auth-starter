export interface TodoResponse {
  id: string;
  title: string;
  description: string;
}

export type TodoFilters = {
  sort: "created_at" | "title";
  order: "asc" | "desc";
  title: string | undefined;
  description: string | undefined;
};

export const SORT_COLUMNS = {
  created_at: "created_at",
  title: "title"
} as const

export const SORT_ORDERS = {
  asc: "ASC",
  desc: "DESC"
} as const;

export interface TodoResponse {
  id: string;
  title: string;
  description: string;
}