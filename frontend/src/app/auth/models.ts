export class LoginUser {
  username: string;
  password: string;

  constructor(username: string = "", password: string = "") {}
}

export class RegisterUser {
  username?: string;
  password?: string;
  email?: string;
  name?: string;
  surname?: string;

  constructor() {}
}

export interface JWT {
  header: {
    typ: string;
    alg: string;
  };
  payload: JWTPayload;
}

export interface JWTPayload {
  iat: number;
  nbf: number;
  jti: string;
  exp: number;
  identity: string;
  fresh: boolean;
  type: string;
}

export interface TokenRefresh {
  access_token: string;
}
