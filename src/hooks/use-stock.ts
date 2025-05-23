import { useContext } from 'react';
import { StockContext, StockContextType } from '@/contexts/StockContext';

export const useStock = (): StockContextType => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

export default useStock;
