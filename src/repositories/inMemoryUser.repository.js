export class InMemoryUserRepository {
  constructor(initialUsers = []) {
    this.users = initialUsers.map((user) => ({ ...user }));
  }

  async create(user) {
    const storedUser = { ...user };
    this.users.push(storedUser);
    return { ...storedUser };
  }

  async findById(id) {
    const user = this.users.find((item) => item.id === id);
    return user ? { ...user } : null;
  }

  async findByEmail(email) {
    const user = this.users.find((item) => item.email === email);
    return user ? { ...user } : null;
  }

  async findAll() {
    return this.users.map((user) => ({ ...user }));
  }

  async update(id, changes) {
    const index = this.users.findIndex((user) => user.id === id);

    if (index === -1) {
      return null;
    }

    this.users[index] = {
      ...this.users[index],
      ...changes
    };

    return { ...this.users[index] };
  }
}