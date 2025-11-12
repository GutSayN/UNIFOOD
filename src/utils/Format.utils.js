/**
 * Utilidades de Formato
 * Funciones helper para formatear datos
 */

export const FormatUtils = {
  /**
   * Formatear precio
   */
  formatPrice(price, currency = 'MXN') {
    if (price === null || price === undefined) return '$0.00';
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) return '$0.00';

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(numPrice);
  },

  /**
   * Formatear número
   */
  formatNumber(number) {
    if (number === null || number === undefined) return '0';
    
    const numValue = typeof number === 'string' ? parseFloat(number) : number;
    
    if (isNaN(numValue)) return '0';

    return new Intl.NumberFormat('es-MX').format(numValue);
  },

  /**
   * Formatear fecha
   */
  formatDate(date, format = 'short') {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '';

    const formats = {
      short: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      },
    };

    return new Intl.DateTimeFormat('es-MX', formats[format] || formats.short)
      .format(dateObj);
  },

  /**
   * Formatear fecha relativa (hace X tiempo)
   */
  formatRelativeDate(date) {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '';

    const now = new Date();
    const diffMs = now - dateObj;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return this.formatDate(dateObj, 'short');
  },

  /**
   * Truncar texto
   */
  truncateText(text, maxLength = 50, suffix = '...') {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Capitalizar primera letra
   */
  capitalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * Capitalizar cada palabra
   */
  capitalizeWords(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .split(' ')
      .map(word => this.capitalize(word))
      .join(' ');
  },

  /**
   * Formatear teléfono
   */
  formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  },

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Formatear porcentaje
   */
  formatPercentage(value, decimals = 0) {
    if (value === null || value === undefined) return '0%';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return '0%';

    return `${numValue.toFixed(decimals)}%`;
  },

  /**
   * Generar iniciales de nombre
   */
  getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    
    const words = name.trim().split(' ').filter(w => w.length > 0);
    
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  },

  /**
   * Formatear duración en segundos a texto
   */
  formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0s';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  },

  /**
   * Pluralizar palabra
   */
  pluralize(count, singular, plural) {
    return count === 1 ? singular : (plural || `${singular}s`);
  },

  /**
   * Formatear lista de items
   */
  formatList(items, connector = 'y') {
    if (!items || !Array.isArray(items) || items.length === 0) return '';
    
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${connector} ${items[1]}`;
    
    const lastItem = items[items.length - 1];
    const restItems = items.slice(0, -1).join(', ');
    
    return `${restItems} ${connector} ${lastItem}`;
  },
};

export default FormatUtils;