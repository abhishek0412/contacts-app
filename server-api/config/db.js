const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://contacts_user:contacts_pass@localhost:5432/contacts",
});

module.exports = pool;
