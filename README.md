# Django GraphQL + React Account Admin

Dự án gồm backend Django/PostgreSQL chỉ dùng GraphQL, frontend React/Ant Design dùng Apollo Client, hỗ trợ login, đăng ký, quản lý user và upload avatar.

## Chạy môi trường dev

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- GraphQL: `http://localhost:8000/graphql/`
- Django admin: `http://localhost:8000/admin/`
- pgAdmin: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

pgAdmin mặc định:

- Email: `admin@example.com`
- Password: `Apc@12345`
- Server PostgreSQL đã được khai báo sẵn với host `db`, database `app_db`, user `app_user`.

Tạo tài khoản admin/staff:

```bash
docker compose exec backend python manage.py createsuperuser
```

Tài khoản thường có thể đăng ký ở frontend. Tài khoản staff mới xem được màn quản lý toàn bộ user.

## Backend

Backend nằm trong `backend/`.

- Framework: Django 4.2
- Database: PostgreSQL
- API: GraphQL qua endpoint `/graphql/`
- Auth: JWT qua `django-graphql-jwt`
- Upload file: GraphQL multipart qua `graphene-file-upload`

Các operation chính:

```graphql
mutation Register($username: String!, $email: String!, $password: String!) {
  register(username: $username, email: $email, password: $password) {
    user { id username email }
  }
}

mutation Login($username: String!, $password: String!) {
  tokenAuth(username: $username, password: $password) {
    token
  }
}

query Me {
  me {
    id
    username
    email
    isStaff
    profile { avatarUrl phone address }
  }
}

query Users {
  users {
    id
    username
    email
    isActive
    isStaff
  }
}
```

Khi gọi API cần gửi header:

```text
Authorization: JWT <token>
```

## Frontend

Frontend nằm trong `frontend/`.

- React + Vite
- Ant Design
- Apollo Client
- `apollo-upload-client` cho upload file GraphQL

Các màn hình đã có:

- `/login`
- `/register`
- `/accounts`
