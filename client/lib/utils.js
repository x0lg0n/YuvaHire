import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Safe clipboard copy utility function that handles exceptions gracefully
 * @param {string} text - The text to copy to clipboard
 * @returns {Promise<boolean>} - Whether the copy was successful
 */
export const copyToClipboard = async (text) => {
  try {
    // Check if we're in a secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.warn('Copy to clipboard requires a secure context (HTTPS or localhost)');
      return false;
    }
    
    // Check if the Clipboard API is supported
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('Clipboard API not supported in this browser');
      
      if (typeof document === 'undefined') return false;
      
      // Fallback method using document.execCommand (deprecated but widely supported)
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed'; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
        document.body.removeChild(textArea);
        return false;
      }
    }
    
    // Use the modern Clipboard API
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    return false;
  }
};

/**
 * Helper function to safely handle API errors in form submissions
 * @param {Error} error - The error object from API call
 * @param {Function} setError - Function to set error message in form
 * @param {boolean} useToast - Whether to show a toast notification
 * @returns {string} - User-friendly error message
 */
export const handleFormError = (error, setError, useToast = false) => {
  // Default error message
  let message = "An unexpected error occurred. Please try again.";
  
  // Better handling for known error types
  if (error.isApiError) {
    // This is our enhanced API error
    message = error.message;
  } else if (error.response?.data?.message) {
    // Standard axios error with server message
    message = error.response.data.message;
  } else if (error.message?.includes('network') || error.message?.includes('connect')) {
    // Network connectivity issue
    message = "Cannot connect to the server. Please check your internet connection.";
  } else if (error.message) {
    // Use error message if available
    message = error.message;
  }
  
  // Set form error if function provided
  if (typeof setError === 'function') {
    setError(message);
  }
  
  // TODO: If toast functionality is added later, show toast here
  
  // Log detailed error for debugging
  console.error('Form submission error:', error);
  
  return message;
};