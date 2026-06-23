import React, { createContext, useContext, useState, useCallback } from 'react';

interface FavoritesContextType {
  favoritedIds: string[];
  isFavorited: (jobId: string) => boolean;
  toggleFavorite: (jobId: string) => void;
  addFavorite: (jobId: string) => void;
  removeFavorite: (jobId: string) => void;
  favoritedCount: number;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoritedIds: [],
  isFavorited: () => false,
  toggleFavorite: () => {},
  addFavorite: () => {},
  removeFavorite: () => {},
  favoritedCount: 0,
});

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);

  const isFavorited = useCallback(
    (jobId: string) => favoritedIds.includes(jobId),
    [favoritedIds]
  );

  const addFavorite = useCallback((jobId: string) => {
    setFavoritedIds(prev => prev.includes(jobId) ? prev : [...prev, jobId]);
  }, []);

  const removeFavorite = useCallback((jobId: string) => {
    setFavoritedIds(prev => prev.filter(id => id !== jobId));
  }, []);

  const toggleFavorite = useCallback((jobId: string) => {
    setFavoritedIds(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favoritedIds,
        isFavorited,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        favoritedCount: favoritedIds.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
