package dbtest

import (
	"testing"

	"github.com/ncarlier/readflow/pkg/assert"
)

func TestCreateOrUpdateUser(t *testing.T) {
	teardownTestCase := setupTestCase(t)
	defer teardownTestCase(t)

	user := assertUserExists(t, "test-001")
	assert.True(t, *user.ID > 0, "user ID should be a valid integer")
	assert.True(t, !user.Enabled, "user should be disabled")
}

func TestDeleteUser(t *testing.T) {
	teardownTestCase := setupTestCase(t)
	defer teardownTestCase(t)

	username := "test-001"
	user := assertUserExists(t, username)

	err := testDB.DeleteUser(*user)
	assert.Nil(t, err, "error should be nil")

	user, err = testDB.GetUserByUsername(username)
	assert.Nil(t, err, "error should be nil")
	// assert.Nil(t, user, "user should be nil") // NOT WORKING
	assert.True(t, user == nil, "user should be nil")
}
