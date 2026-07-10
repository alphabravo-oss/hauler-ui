package auth

import (
	"net/http"
	"testing"
	"time"
)

// TestClientIP_IgnoresXFFByDefault is the security-critical case: with no
// trusted proxy configured, a spoofed X-Forwarded-For must NOT change the key,
// otherwise an attacker rotates the header to get a fresh bucket per request.
func TestClientIP_IgnoresXFFByDefault(t *testing.T) {
	t.Setenv("HAULER_UI_TRUST_PROXY", "")
	r := &http.Request{Header: http.Header{}, RemoteAddr: "203.0.113.7:5555"}
	r.Header.Set("X-Forwarded-For", "1.2.3.4")
	if got := clientIP(r); got != "203.0.113.7" {
		t.Fatalf("spoofed XFF changed the key: got %q, want the RemoteAddr host 203.0.113.7", got)
	}
}

// TestClientIP_TrustProxyUsesRightmostHop verifies that when a proxy is trusted
// we take the rightmost (proxy-appended, unspoofable) hop, not the leftmost.
func TestClientIP_TrustProxyUsesRightmostHop(t *testing.T) {
	t.Setenv("HAULER_UI_TRUST_PROXY", "true")
	r := &http.Request{Header: http.Header{}, RemoteAddr: "10.0.0.1:5555"}
	r.Header.Set("X-Forwarded-For", "1.2.3.4, 198.51.100.9") // 1.2.3.4 is client-supplied/spoofable
	if got := clientIP(r); got != "198.51.100.9" {
		t.Fatalf("want rightmost trusted hop 198.51.100.9, got %q", got)
	}
}

// TestLimiterBlocksAfterCapacity confirms the bucket blocks once its burst is
// spent and that distinct IPs get independent buckets.
func TestLimiterBlocksAfterCapacity(t *testing.T) {
	l := &loginLimiter{
		buckets:    make(map[string]*tokenBucket),
		refillRate: 0, // no refill during the test so capacity is a hard ceiling
		capacity:   3,
		ttl:        time.Hour,
	}
	for i := 0; i < 3; i++ {
		if ok, _ := l.allow("ip-a"); !ok {
			t.Fatalf("attempt %d for ip-a should be allowed within capacity", i+1)
		}
	}
	if ok, wait := l.allow("ip-a"); ok || wait <= 0 {
		t.Fatalf("ip-a should be blocked after capacity spent (ok=%v, wait=%v)", ok, wait)
	}
	// A different IP must not be affected by ip-a exhausting its bucket.
	if ok, _ := l.allow("ip-b"); !ok {
		t.Fatal("ip-b should have its own fresh bucket")
	}
}
