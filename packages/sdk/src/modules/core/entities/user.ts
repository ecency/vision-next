export interface StoringUser {
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  postingKey: null | undefined | string;
  loginType: null | undefined | string;
  index?: number; // index in a list
}
