export class User {
  id: string;
  email: string;
  password: string; // This will store the hashed argon2 password, not the plain text
}
