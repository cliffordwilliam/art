# User Table
- username     string
- email        string   `required` | `unique` | `email format`
- password     string   `required` | `char len min 5`
- role         string   `default Staff`
- phoneNumber  string
- address      string

# Art Table
- name         string    `required`
- description  string    `required`
- price        integer   `required` | `number min 100`
- stock        integer
- imgUrl       string
- TypeId       integer   `fk`
- UserId       integer   `fk`

# Type Table
- name         string    `required`

# Features
- Only Admin can add more users as Staff
- Users can login (this generate token)
- crud, and read-list for art table
- read-list for type table
- all endpoints require token, except login and public
- patch imgUrl of art table with req.file
- art has pagination, sorting (oldest) and filter (name)