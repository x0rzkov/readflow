package model

import "time"

// Category structure definition
type Category struct {
	ID        *uint      `json:"id,omitempty"`
	UserID    *uint      `json:"user_id,omitempty"`
	Title     string     `json:"title,omitempty"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}
