package image_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	img "one-api/common/image"
)

// TestGetImageFromUrlRefusesLoopback exercises the SSRF guard (#939): an
// image_url that resolves to this instance must be refused, not fetched
// server-side.
func TestGetImageFromUrlRefusesLoopback(t *testing.T) {
	// Would serve the request if it ever went out.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("leaked"))
	}))
	defer srv.Close()

	_, _, err := img.GetImageFromUrl(srv.URL)
	if err == nil {
		t.Fatal("a loopback image_url was fetched; expected a refusal")
	}
}

// TestGetImageFromUrlRefusesLinkLocalUnicast covers the link-local form
// of the same hole.
func TestGetImageFromUrlRefusesLinkLocalUnicast(t *testing.T) {
	_, _, err := img.GetImageFromUrl("http://169.254.1.1/x")
	if err == nil {
		t.Fatal("a link-local address was fetched; expected a refusal")
	}
}

// TestGetImageFromUrlRefusesPrivateRanges covers RFC1918 targets.
func TestGetImageFromUrlRefusesPrivateRanges(t *testing.T) {
	for _, u := range []string{
		"http://10.0.0.5/x",
		"http://192.168.1.10/x",
		"http://172.16.0.9/x",
	} {
		if _, _, err := img.GetImageFromUrl(u); err == nil {
			t.Fatalf("%s was fetched; expected a refusal", u)
		}
	}
}

// TestGetImageFromUrlRefusesOtherSchemes keeps only http(s) reachable.
func TestGetImageFromUrlRefusesOtherSchemes(t *testing.T) {
	for _, u := range []string{"file:///etc/passwd", "ftp://example.com/x"} {
		if _, _, err := img.GetImageFromUrl(u); err == nil {
			t.Fatalf("%s was fetched; expected a refusal", u)
		}
	}
}

// TestGetImageFromUrlRefusesUnresolvableHost refuses a name with no
// record rather than falling back to dialing it.
func TestGetImageFromUrlRefusesUnresolvableHost(t *testing.T) {
	_, _, err := img.GetImageFromUrl("http://no-such-host.invalid/x")
	if err == nil {
		t.Fatal("an unresolvable host was dialled; expected a refusal")
	}
}

// TestGetImageFromUrlRefusesLoopbackWithoutServingIt pins which layer
// refuses: the handler must never have run — the initial URL check
// stops the fetch before anything is sent, on the first hop and in
// particular before any redirect could be followed (#939).
func TestGetImageFromUrlRefusesLoopbackWithoutServingIt(t *testing.T) {
	served := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		served = true
		http.Redirect(w, r, "http://127.0.0.1:9/leak", http.StatusFound)
	}))
	defer srv.Close()

	_, _, err := img.GetImageFromUrl(srv.URL)
	if err == nil {
		t.Fatal("a loopback image_url was fetched; expected a refusal")
	}
	if served {
		t.Fatal("the request reached the loopback server before it was refused")
	}
}
