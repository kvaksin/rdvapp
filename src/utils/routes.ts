export const generateAdminToken = () => {
  // Generate a random 32-character string
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const generateClassToken = (classId: string) => {
  // Generate a random 16-character string and combine with classId
  const random = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${classId}-${random}`;
};

export const isValidClassToken = (token: string, classId: string) => {
  return token.startsWith(`${classId}-`);
};

export const ADMIN_TOKEN_KEY = 'rdv-admin-token';
export const CLASS_TOKEN_KEY = 'rdv-class-token';