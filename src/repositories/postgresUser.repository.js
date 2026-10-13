function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    confirmed: row.confirmed,
    deletedAt: toIsoString(row.deleted_at),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}

const SELECT_COLUMNS = `
  id,
  email,
  password_hash,
  role,
  confirmed,
  deleted_at,
  created_at,
  updated_at
`;

export class PostgresUserRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(user) {
    const result = await this.pool.query(
      `
        INSERT INTO users (
          id,
          email,
          password_hash,
          role,
          confirmed,
          deleted_at,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING ${SELECT_COLUMNS}
      `,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.role,
        user.confirmed,
        user.deletedAt,
        user.createdAt,
        user.updatedAt
      ]
    );

    return mapUser(result.rows[0]);
  }

  async findById(id) {
    const result = await this.pool.query(
      `SELECT ${SELECT_COLUMNS}
       FROM users
       WHERE id = $1`,
      [id]
    );

    return mapUser(result.rows[0]);
  }

  async findByEmail(email) {
    const result = await this.pool.query(
      `SELECT ${SELECT_COLUMNS}
       FROM users
       WHERE email = $1`,
      [email]
    );

    return mapUser(result.rows[0]);
  }

  async findAll() {
    const result = await this.pool.query(
      `SELECT ${SELECT_COLUMNS}
       FROM users
       ORDER BY created_at ASC`
    );

    return result.rows.map(mapUser);
  }

  async update(id, changes) {
    const columnNames = {
      role: "role",
      confirmed: "confirmed",
      deletedAt: "deleted_at",
      updatedAt: "updated_at"
    };

    const entries = Object.entries(changes).filter(
      ([property]) => columnNames[property]
    );

    if (entries.length === 0) {
      return this.findById(id);
    }

    const assignments = entries.map(
      ([property], index) =>
        `${columnNames[property]} = $${index + 2}`
    );

    const values = [
      id,
      ...entries.map(([, value]) => value)
    ];

    const result = await this.pool.query(
      `
        UPDATE users
        SET ${assignments.join(", ")}
        WHERE id = $1
        RETURNING ${SELECT_COLUMNS}
      `,
      values
    );

    return mapUser(result.rows[0]);
  }
}