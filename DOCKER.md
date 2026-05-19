# Docker MySQL

Run MySQL from this repository root:

```bash
docker compose up -d
```

The container exposes MySQL on:

```text
localhost:3306
```

It uses the same database settings as the backend local `.env`:

```text
DB_USER=root
DB_PASSWORD=1234
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=PayrollDB
```

MySQL data is stored in the named Docker volume `payroll_mysql_data`.

With this MySQL container running, start the backend locally from `../payroll-backend`:

```bash
go run .
```
