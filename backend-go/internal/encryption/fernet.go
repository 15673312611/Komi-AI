package encryption

import (
	"encoding/base64"
	"errors"
	"os"
	"strings"
	"sync"

	"github.com/fernet/fernet-go"
)

var (
	keyOnce sync.Once
	key     *fernet.Key
	keyErr  error
)

// API keys in the Python service are bare Fernet tokens. ENCRYPTION_KEY is
// base64(base64(raw-fernet-key)), so decode the outer layer before handing the
// original url-safe key to fernet-go.
func loadKey() (*fernet.Key, error) {
	keyOnce.Do(func() {
		encoded := os.Getenv("ENCRYPTION_KEY")
		if encoded == "" {
			generated := new(fernet.Key)
			keyErr = generated.Generate()
			key = generated
			return
		}
		rawKey, err := base64.StdEncoding.DecodeString(encoded)
		if err != nil {
			keyErr = err
			return
		}
		key, keyErr = fernet.DecodeKey(string(rawKey))
	})
	if keyErr != nil {
		return nil, keyErr
	}
	if key == nil {
		return nil, errors.New("encryption key is not initialized")
	}
	return key, nil
}

func Encrypt(value string) (string, error) {
	key, err := loadKey()
	if err != nil {
		return "", err
	}
	token, err := fernet.EncryptAndSign([]byte(value), key)
	if err != nil {
		return "", err
	}
	return string(token), nil
}

// EncryptAtRest matches the Python EncryptedText wire format. Bare Fernet
// tokens remain reserved for API keys and connector credentials, while
// message-like text carries a key id so rotation can be introduced later.
func EncryptAtRest(value string) (string, error) {
	if strings.HasPrefix(value, "enc:v1:") {
		return value, nil
	}
	token, err := Encrypt(value)
	if err != nil {
		return "", err
	}
	return "enc:v1:" + token, nil
}

func Decrypt(value string) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", nil
	}
	// If it doesn't look like a Fernet token, return as plaintext directly
	if !strings.HasPrefix(value, "gAAAAA") && !strings.HasPrefix(value, "enc:") {
		return value, nil
	}
	key, err := loadKey()
	if err != nil {
		return "", err
	}
	decoded := fernet.VerifyAndDecrypt([]byte(value), 0, []*fernet.Key{key})
	if decoded == nil {
		return "", errors.New("failed to decrypt value")
	}
	return string(decoded), nil
}

func DecryptAtRest(value string) (string, error) {
	if !strings.HasPrefix(value, "enc:") {
		return value, nil
	}
	parts := strings.SplitN(value, ":", 3)
	if len(parts) != 3 || parts[1] != "v1" || parts[2] == "" {
		return "", errors.New("malformed encrypted value")
	}
	return Decrypt(parts[2])
}
