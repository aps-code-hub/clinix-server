import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashingService {
  /**
   * Hash the plain text password using Argon2id
   * @param password the plain text password string
   * @returns The hashed password string
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  /**
   * Verifies if a plain text password matches the hash
   * @param password the plain text password string
   * @param encryptedPassword the hashed password string from the db
   * @return boolean return true or false after password verification
   */
  async compare(password: string, encryptedPassword: string): Promise<boolean> {
    return argon2.verify(encryptedPassword, password);
  }
}
