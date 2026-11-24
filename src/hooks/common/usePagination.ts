// Paginacao em memoria: recorta um array ja carregado (`data.slice`). Nao busca no servidor — para lista
// longa vinda do banco use `useServerPagination` (./useServerPagination.ts, etapa 202).
import { useState, useMemo } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface UsePaginationReturn<T> {
  // Estado
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  
  // Dados paginados
  paginatedData: T[];
  
  // Ações
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Info
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  pageSizeOptions: number[];
}

export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 20, 50, 100],
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Ajustar página se necessário
  const adjustedPage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedData = useMemo(() => {
    const startIndex = (adjustedPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, adjustedPage, pageSize]);

  const startIndex = (adjustedPage - 1) * pageSize + 1;
  const endIndex = Math.min(adjustedPage * pageSize, totalItems);

  const setPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset para primeira página
  };

  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(currentPage - 1);
  const firstPage = () => setPage(1);
  const lastPage = () => setPage(totalPages);

  return {
    currentPage: adjustedPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasNextPage: adjustedPage < totalPages,
    hasPrevPage: adjustedPage > 1,
    startIndex: totalItems > 0 ? startIndex : 0,
    endIndex,
    pageSizeOptions,
  };
}

export default usePagination;
