import { useMemo } from 'react';
import { Database, Clock } from 'lucide-react';

const CacheStatus = ({ budgetCache, user, currentYear, currentMonth }) => {
  const cacheInfo = useMemo(() => {
    if (!user) return null;
    
    const key = `${user.id}-${currentYear}-${currentMonth}`;
    const cacheEntry = budgetCache.get(key);
    
    if (!cacheEntry) {
      return { status: 'none', message: 'No cache' };
    }
    
    const isValid = Date.now() < cacheEntry.expiresAt;
    const age = Math.floor((Date.now() - cacheEntry.timestamp) / 1000);
    
    if (isValid) {
      return { 
        status: 'valid', 
        message: `Cached ${age}s ago`,
        timeLeft: Math.floor((cacheEntry.expiresAt - Date.now()) / 1000)
      };
    } else {
      return { status: 'expired', message: 'Cache expired' };
    }
  }, [budgetCache, user, currentYear, currentMonth]);
  
  if (!cacheInfo) return null;
  
  const getStatusColor = () => {
    switch (cacheInfo.status) {
      case 'valid': return 'text-green-600 dark:text-green-400';
      case 'expired': return 'text-yellow-600 dark:text-yellow-400';
      case 'none': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  const getIcon = () => {
    switch (cacheInfo.status) {
      case 'valid': return <Database className="w-3 h-3" />;
      case 'expired': return <Clock className="w-3 h-3" />;
      case 'none': return <Database className="w-3 h-3" />;
      default: return <Database className="w-3 h-3" />;
    }
  };
  
  return (
    <div className={`flex items-center gap-1 text-xs ${getStatusColor()}`} title={`Cache status: ${cacheInfo.message}`}>
      {getIcon()}
      <span className="hidden sm:inline">{cacheInfo.message}</span>
      {cacheInfo.timeLeft && (
        <span className="hidden md:inline">({cacheInfo.timeLeft}s left)</span>
      )}
    </div>
  );
};

export default CacheStatus;