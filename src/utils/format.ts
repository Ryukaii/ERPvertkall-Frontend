export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  // Converte de centavos para reais
  const reais = numericValue / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
};

export const formatDate = (date: string | Date | null | undefined): string => {
  // Handle null, undefined, or empty values
  if (!date) {
    return '-';
  }
  
  let dateObj: Date;
  
  try {
    // If it's already a Date object, use it directly
    if (date instanceof Date) {
      dateObj = date;
    } else {
      // If it's a string, parse it properly to avoid timezone issues
      if (typeof date === 'string') {
        // Check if it's an ISO string from backend (like "2025-07-28T00:00:00.000Z")
        if (date.includes('T') && date.includes('Z')) {
          // Parse as UTC and create a local date with the same day
          const utcDate = new Date(date);
          dateObj = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        } else if (date.includes('-') && date.length === 10) {
          // Handle simple date format like "2025-07-28"
          const [year, month, day] = date.split('-').map(Number);
          dateObj = new Date(year, month - 1, day);
        } else {
          // Fallback to standard parsing
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('pt-BR').format(dateObj);
  } catch (error) {
    // If any error occurs during date parsing, return '-'
    return '-';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  // Handle null, undefined, or empty values
  if (!date) {
    return '-';
  }
  
  let dateObj: Date;
  
  try {
    // If it's already a Date object, use it directly
    if (date instanceof Date) {
      dateObj = date;
    } else {
      // If it's a string, parse it properly to avoid timezone issues
      if (typeof date === 'string') {
        // Check if it's an ISO string from backend (like "2025-07-28T00:00:00.000Z")
        if (date.includes('T') && date.includes('Z')) {
          // Parse as UTC and create a local date with the same day
          const utcDate = new Date(date);
          dateObj = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        } else if (date.includes('-') && date.length === 10) {
          // Handle simple date format like "2025-07-28"
          const [year, month, day] = date.split('-').map(Number);
          dateObj = new Date(year, month - 1, day);
        } else {
          // Fallback to standard parsing
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    // If any error occurs during date parsing, return '-'
    return '-';
  }
};

// Função específica para extrair data para formulários (formato YYYY-MM-DD)
// Evita problemas de fuso horário ao editar transações
export const extractDateForForm = (date: string | Date | null | undefined): string => {
  if (!date) {
    return '';
  }
  
  try {
    if (typeof date === 'string') {
      // Se é uma string ISO do backend (como "2025-07-28T00:00:00.000Z")
      if (date.includes('T')) {
        // Extrai apenas a parte da data (antes do T)
        return date.split('T')[0];
      }
      // Se já está no formato correto
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
    }
    
    // Se é um objeto Date, converte para formato YYYY-MM-DD
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Usa os valores locais para evitar conversão de fuso horário
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '';
  }
};

// Função para criar um objeto Date seguro, evitando problemas de fuso horário
// Útil para comparações de datas vindas do backend
export const parseBackendDate = (date: string | Date): Date => {
  if (date instanceof Date) {
    return date;
  }
  
  if (typeof date === 'string') {
    // Se é uma string ISO do backend (como "2025-07-28T00:00:00.000Z")
    if (date.includes('T') && date.includes('Z')) {
      // Parse como UTC e cria uma data local com os mesmos valores
      const utcDate = new Date(date);
      return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
    }
    // Se é uma string simples de data
    if (date.includes('-') && date.length === 10) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  }
  
  // Fallback para parsing padrão
  return new Date(date);
};