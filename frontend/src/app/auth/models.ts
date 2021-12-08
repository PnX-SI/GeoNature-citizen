export class RegisterUser {
    username?: string;
    password?: string;
    email?: string;
    name?: string;
    surname?: string;
    avatar?: string | ArrayBuffer;
    extention?: string;
    captchaToken?: string;

    constructor() {}
}

export interface LoginUser {
    email: string;
    password: string;
}

export interface LoginPayload {
    message: string;
    access_token?: string;
    refresh_token?: string;
    username?: string;
}

export interface LogoutPayload {
    msg: string;
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

export interface UserInfo {
    message: string;
    features?: any;
}
