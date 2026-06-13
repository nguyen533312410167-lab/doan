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
# YÊU CẦU THỰC HIỆN DỰ ÁN

Hãy đóng vai Senior React Frontend Developer.

Nhiệm vụ của bạn là xây dựng hoàn chỉnh giao diện Frontend cho ứng dụng "Quản Lý Chi Tiêu Cá Nhân" bằng ReactJS.

QUAN TRỌNG:

* Chỉ thực hiện đúng các yêu cầu bên dưới.
* Không tự ý thêm chức năng mới.
* Không tự ý bỏ bất kỳ chức năng nào.
* Không thay đổi cấu trúc nghiệp vụ.
* Không thêm các trang ngoài yêu cầu.
* Không thêm AI Chat, Profile, Settings, Reports hoặc bất kỳ module nào khác.
* Chỉ sử dụng các chức năng đã được mô tả.

---

# CÔNG NGHỆ BẮT BUỘC

* ReactJS
* React Hooks
* Functional Components
* React Router DOM
* Ant Design (antd)
* LayoutMaster
* Responsive Design
* JavaScript (không dùng TypeScript)

---

# CẤU TRÚC THƯ MỤC BẮT BUỘC

src/

├── layouts/
│   ├── LayoutMaster.jsx
│   └── ProtectedLayout.jsx
│
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── Dashboard.jsx
│   ├── Transactions.jsx
│   └── Goals.jsx
│
├── routes/
│   └── AppRoutes.jsx
│
├── App.jsx
│
├── main.jsx

---

# ROUTES BẮT BUỘC

/login

/register

/dashboard

/transactions

/goals

---

# LAYOUTMASTER

Tạo LayoutMaster làm layout chung cho các trang sau khi đăng nhập.

Bao gồm:

* Sidebar
* Header
* Content

Sidebar gồm:

1. Dashboard
2. Quản lý giao dịch
3. Mục tiêu tiết kiệm

Header gồm:

* Avatar người dùng
* Dropdown tài khoản
* Đăng xuất

Responsive:

* Desktop hiển thị đầy đủ
* Mobile thu gọn Sidebar

---

# TRANG ĐĂNG NHẬP

Route:

/login

Gồm:

* Email
* Password
* Nút Đăng nhập
* Link chuyển sang Đăng ký

Yêu cầu:

* Validate Form bằng Ant Design
* Loading khi submit

---

# TRANG ĐĂNG KÝ

Route:

/register

Gồm:

* Họ tên
* Email
* Mật khẩu
* Xác nhận mật khẩu
* Nút Đăng ký

Yêu cầu:

* Validate Form bằng Ant Design
* Loading khi submit

---

# DASHBOARD

Route:

/dashboard

Hiển thị:

## 1. Thẻ thống kê

* Tổng thu nhập
* Tổng chi tiêu
* Số dư hiện tại

Dùng Ant Design Statistic.

---

## 2. Trợ lý AI Rule-Based

Tạo hệ thống cảnh báo dựa trên dữ liệu hiện có.

Luật 1:

Nếu chi tiêu > thu nhập

=> Alert màu đỏ

Luật 2:

Nếu chi phí ăn uống > 40% tổng chi tiêu

=> Alert màu vàng

Luật 3:

Nếu chi phí giải trí > 25% tổng chi tiêu

=> Alert màu vàng

Luật 4:

Nếu tổng tiền tiết kiệm < 10% thu nhập

=> Alert màu vàng

Luật 5:

Nếu mục tiêu tiết kiệm hoàn thành

=> Alert chúc mừng

Sử dụng Ant Design Alert.

---

## 3. Biểu đồ

Biểu đồ tròn:

Phân bổ chi tiêu theo danh mục.

Biểu đồ cột:

So sánh Thu nhập và Chi tiêu.

---

# TRANG QUẢN LÝ GIAO DỊCH

Route:

/transactions
Gồm:

## Bộ lọc

* Tìm kiếm theo ghi chú
* Tìm kiếm theo danh mục
* Lọc tất cả
* Lọc thu nhập
* Lọc chi tiêu

---

## Bảng dữ liệu

Cột:

* Ngày
* Danh mục
* Ghi chú
* Loại
* Số tiền
* Hành động

---

## CRUD

Cho phép:

* Thêm giao dịch
* Sửa giao dịch
* Xóa giao dịch

Dùng Modal Ant Design.

---

## Form giao dịch

Trường dữ liệu:

* Loại giao dịch
* Số tiền
* Danh mục
* Ngày
* Ghi chú

---

## Bảng

Cho phép:

* Sort theo ngày
* Sort theo số tiền
* Pagination

---

# TRANG MỤC TIÊU TIẾT KIỆM

Route:

/goals

Hiển thị danh sách dưới dạng Card Grid.

---

Mỗi Card gồm:

* Tên mục tiêu
* Số tiền mục tiêu
* Số tiền hiện có
* Phần trăm hoàn thành
* Ngày hết hạn

---

Progress:

Sử dụng Ant Design Progress.

---

Cho phép:

1. Tạo mục tiêu mới

Form:

* Tên mục tiêu
* Số tiền mục tiêu
* Ngày hoàn thành

2. Nạp thêm tiền vào mục tiêu

Form:

* Số tiền nạp

---

# APP.JSX

Quản lý state tập trung.

State:

transactions

goals

---

Dữ liệu giao dịch phải hỗ trợ:

* Add
* Edit
* Delete

---

Dữ liệu mục tiêu phải hỗ trợ:

* Add Goal
* Contribute Goal

---

Dashboard phải tự động cập nhật khi dữ liệu Transactions hoặc Goals thay đổi.

---

# RESPONSIVE

Tất cả giao diện phải hoạt động tốt trên:

* Mobile
* Tablet
* Desktop

---

# YÊU CẦU CODE

* Viết code hoàn chỉnh.
* Chia component rõ ràng.
* Không để TODO.
* Không viết pseudo code.
* Không giải thích.
* Xuất đầy đủ source code cho từng file.
* Tạo đúng cấu trúc thư mục yêu cầu.
* Đảm bảo project có thể chạy ngay sau khi npm install và npm run dev.