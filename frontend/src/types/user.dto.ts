/**
 * @file user.dto.ts
 * @description Defines data structures for user accounts for the frontend.
 */

/**
 * @interface UserAccountDto
 * @description Complete user account data structure.
 */
export interface UserAccountDto {
  id: number;
  nickName: string;
  douyinSecId: string;
  googleAccount?: string;
  youtubeApiKey?: string;
  youtubeChannel?: string;
}

/**
 * @interface CreateUserAccountDto
 * @description DTO for creating a new user. Omits the auto-generated `id`.
 */
export type CreateUserAccountDto = Omit<UserAccountDto, 'id'>;

/**
 * @interface UpdateUserAccountDto
 * @description DTO for updating a user. All fields are optional.
 */
export type UpdateUserAccountDto = Partial<CreateUserAccountDto>;
