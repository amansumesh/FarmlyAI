export const getLocale = (language: string): string => {
  switch (language) {
    case 'hi':
      return 'hi-IN';
    case 'ta':
      return 'ta-IN';
    case 'ml':
      return 'ml-IN';
    case 'te':
      return 'te-IN';
    case 'kn':
      return 'kn-IN';
    case 'mr':
      return 'mr-IN';
    case 'en':
    default:
      return 'en-IN';
  }
};
