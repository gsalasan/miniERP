export const AuthService = {
  async login(username: string, password: string) {
    // placeholder: replace with real auth logic
    if (username === 'admin' && password === 'password') {
      return { id: 1, username: 'admin' };
    }
    return null;
  }
};
