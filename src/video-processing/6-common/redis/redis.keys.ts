/**
 * @file redis.keys.ts
 * @description Centralized management of all Redis keys.
 * Using a key factory pattern to ensure consistency and prevent typos.
 */

export const redisKeys = {
  /**
   * A Set containing all douyinSecId of users to be monitored.
   * @returns 'monitoring:users'
   */
  monitoringUsersSet: () => 'monitoring:users',

  /**
   * A Hash containing the details of a specific user account.
   * @param secUserId - The user's douyinSecId.
   * @returns 'user:${secUserId}'
   */
  userHash: (secUserId: string) => `user:${secUserId}`,

  /**
   * A List containing all task IDs for a specific user.
   * @param secUserId - The user's douyinSecId.
   * @returns 'user:${secUserId}:tasks'
   */
  userTasksList: (secUserId: string) => `user:${secUserId}:tasks`,

  /**
   * A Hash containing the details of a specific download/upload task.
   * @param taskId - The unique ID of the task (usually the BullMQ job ID).
   * @returns 'task:${taskId}'
   */
  taskHash: (taskId: string | number) => `task:${taskId}`,
};
