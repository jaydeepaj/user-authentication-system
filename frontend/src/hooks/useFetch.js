import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Generic data-fetching hook.
 * @param {string|null} url - API endpoint to fetch. Null = skip.
 * @param {object} options - Additional axios options.
 * @returns {{ data, isLoading, error, refetch }}
 */
const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(url, options);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

export default useFetch;
