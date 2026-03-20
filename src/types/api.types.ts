// ---------------------------------------------------------------------------
// List request params
// ---------------------------------------------------------------------------

export type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

// ---------------------------------------------------------------------------
// List response
// ---------------------------------------------------------------------------

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export type ApiError = {
  status: number;
  title: string;
  detail?: string;
  /** Dot-notation error code from the API (e.g., "Invite.AlreadyMember") */
  code?: string;
  /** Field-level validation errors: { "email": ["Email is required"] } */
  errors?: Record<string, string[]>;
};
