import '@testing-library/jest-dom';

// Suppress styled-jsx jsx attribute warning and QueryClient errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    const errorDetail = args[0]?.detail?.message || '';
    
    if (
      message.includes('Received `true` for a non-boolean attribute `jsx`') ||
      message.includes('No QueryClient set') ||
      errorDetail.includes('No QueryClient set') ||
      (typeof args[0] === 'object' && args[0]?.detail?.message?.includes('No QueryClient set'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});