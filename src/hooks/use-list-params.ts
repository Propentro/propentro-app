import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

type UseListParamsOptions = {
  defaultPageSize?: number;
};

export function useListParams(options: UseListParamsOptions = {}) {
  const { defaultPageSize = 25 } = options;

  const [params, setParams] = useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsString.withDefault('all'),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(defaultPageSize),
    sortBy: parseAsString.withDefault(''),
    sortDir: parseAsString.withDefault(''),
  });

  function setSearch(value: string) {
    void setParams({ search: value, page: 1 });
  }

  function setStatus(value: string) {
    void setParams({ status: value, page: 1 });
  }

  function setPageSize(value: number) {
    void setParams({ pageSize: value, page: 1 });
  }

  function setPage(value: number) {
    void setParams({ page: value });
  }

  function setSort(sortBy: string, sortDir: string) {
    void setParams({ sortBy, sortDir, page: 1 });
  }

  function clearFilters() {
    void setParams({ search: '', status: 'all', page: 1 });
  }

  const hasFilters = params.search !== '' || params.status !== 'all';

  return {
    ...params,
    hasFilters,
    setSearch,
    setStatus,
    setPage,
    setPageSize,
    setSort,
    clearFilters,
  };
}
