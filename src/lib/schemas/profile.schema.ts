import { z } from 'zod';

// Turkish phone number regex: starts with 0 or +90, followed by 5xx xxx xx xx
const phoneRegex = /^(?:\+90|0)?(5[0-9]{9})$/;

/**
 * Defines the schema for user profile validation according to .cursorrules.
 */
export const profileSchema = z.object({
  // User's full name
  name: z
    .string()
    .min(2, { message: 'İsim en az 2 karakter olmalıdır.' })
    .max(50, { message: 'İsim en fazla 50 karakter olabilir.' })
    // Regex allows Turkish characters and spaces
    .regex(/^[a-zA-Z\sçÇğĞıİöÖşŞüÜ]+$/, { message: 'İsim sadece harf ve boşluk içerebilir.' }),

  // User's email
  email: z
    .string()
    .email({ message: 'Geçersiz e-posta adresi.' }),

  // User's phone number
  phone: z
    .string()
    .regex(phoneRegex, { message: 'Geçerli bir Türk telefon numarası girin (örn: 05551234567).' }),

  // Optional user title/profession
  title: z
    .string()
    .min(2, { message: 'Ünvan en az 2 karakter olmalıdır.' })
    .max(30, { message: 'Ünvan en fazla 30 karakter olabilir.' })
    .optional()
    .or(z.literal('')), // Allows the field to be empty

  // Optional user biography
  bio: z
    .string()
    .max(200, { message: 'Bio en fazla 200 karakter olabilir.' })
    .optional()
    .or(z.literal('')), // Allows the field to be empty
});

/**
 * Represents the type of data inferred from the profile schema.
 */
export type ProfileFormData = z.infer<typeof profileSchema>;
