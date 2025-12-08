// Security utilities for Mind Brother
import DOMPurify from 'dompurify';

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  // Allow most characters for journal entries and discussions
  text: /^[\s\S]*$/,
  // Basic HTML tags for rich text (if needed)
  html: /^<[^>]*>[\s\S]*<\/[^>]*>$/,
};

// Sanitization functions
export const sanitizeInput = (input: string, type: 'text' | 'html' | 'email' = 'text'): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes and control characters
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  if (type === 'html') {
    // Use DOMPurify for HTML content
    return DOMPurify.sanitize(cleaned, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: []
    });
  }
  
  if (type === 'email') {
    // Basic email sanitization
    return cleaned.toLowerCase();
  }
  
  // For text content, escape HTML entities
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validation functions
export const validateEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.email.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return VALIDATION_PATTERNS.phone.test(phone.replace(/\D/g, ''));
};

export const validateUsername = (username: string): boolean => {
  return VALIDATION_PATTERNS.username.test(username);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Content length validation
export const validateContentLength = (content: string, maxLength: number = 10000): boolean => {
  return content.length <= maxLength;
};

// Rate limiting
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  checkLimit(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Security headers
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co;"
});

// Data anonymization
export const anonymizeUserData = (data: any): any => {
  const anonymized = { ...data };
  
  if (anonymized.email) {
    const [local, domain] = anonymized.email.split('@');
    anonymized.email = `${local.substring(0, 2)}***@${domain}`;
  }
  
  if (anonymized.phone) {
    anonymized.phone = anonymized.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  if (anonymized.first_name) {
    anonymized.first_name = anonymized.first_name.substring(0, 1) + '***';
  }
  
  if (anonymized.last_name) {
    anonymized.last_name = anonymized.last_name.substring(0, 1) + '***';
  }
  
  return anonymized;
};

// Input validation for different content types
export const validateJournalEntry = (entry: {
  title?: string;
  content: string;
  mood_rating: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (entry.title && !validateContentLength(entry.title, 200)) {
    errors.push('Title must be 200 characters or less');
  }
  
  if (!validateContentLength(entry.content, 10000)) {
    errors.push('Content must be 10,000 characters or less');
  }
  
  if (entry.mood_rating < 1 || entry.mood_rating > 5) {
    errors.push('Mood rating must be between 1 and 5');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDiscussionTopic = (topic: {
  title: string;
  content: string;
  category: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!validateContentLength(topic.title, 200)) {
    errors.push('Title must be 200 characters or less');
  }
  
  if (!validateContentLength(topic.content, 5000)) {
    errors.push('Content must be 5,000 characters or less');
  }
  
  const validCategories = ['general', 'mental_health', 'relationships', 'work', 'family', 'other'];
  if (!validCategories.includes(topic.category)) {
    errors.push('Invalid category selected');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// XSS protection
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// SQL injection protection (basic)
export const sanitizeForSQL = (input: string): string => {
  return input
    .replace(/[';]/g, '') // Remove single quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment starts
    .replace(/\*\//g, ''); // Remove block comment ends
};





