# User Table
- username     string
- email        string   `required` | `unique` | `email format`
- password     string   `required` | `char len min 5`
- role         string   `default Staff`
- phoneNumber  string
- address      string