export class LoginUser {
  username: string
  password: string

  constructor(username: string = '', password: string = '') {}
}

export class RegisterUser {
  username?: string
  password?: string
  email?: string
  name?: string
  surname?: string

  constructor( ) {}
}
