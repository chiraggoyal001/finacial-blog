import DOMPurify from 'dompurify';

/**
 * Sanitizes an HTML string to prevent XSS attacks while preserving safe tags and attributes.
 * Useful for rendering content from Rich Text Editors or database fields.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'blockquote', 'a', 'img', 'span', 'div',
      'figure', 'figcaption'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class', 'style'],
  });
};
