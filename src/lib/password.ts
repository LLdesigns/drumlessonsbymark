/**
 * Generate a secure random password
 * @param length - Length of the password (default: 12)
 * @param includeSpecialChars - Include special characters (default: true)
 * @returns Generated password string
 */
export function generatePassword(
  length: number = 12,
  includeSpecialChars: boolean = true
): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  let charset = lowercase + uppercase + numbers
  if (includeSpecialChars) {
    charset += special
  }
  
  // Ensure at least one character from each category
  let password = ''
  
  // At least one lowercase
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  // At least one uppercase
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  // At least one number
  password += numbers[Math.floor(Math.random() * numbers.length)]
  // At least one special if required
  if (includeSpecialChars) {
    password += special[Math.floor(Math.random() * special.length)]
  }
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password to avoid predictable patterns
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid flag and errors array
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

