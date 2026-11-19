package image

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/url"
	"time"
)

// SSRF guard for user-supplied image URLs: a vision chat's image_url is
// fetched server-side before it is forwarded upstream, so any token
// holder can point it at the instance's own private network unless the
// destination is checked (#939). The URL's scheme is limited and its
// host is resolved ahead of the request; only public unicast addresses
// are allowed, and the connection is pinned to a checked IP so a DNS
// rebinding between CheckRedirect rounds can't slip one through.

var errUnsafeImageURL = errors.New("image url points to a disallowed address")

// safeIP reports whether ip is a public unicast address a user's image
// fetch may be sent to.
func safeIP(ip net.IP) bool {
	return ip != nil && ip.IsGlobalUnicast() &&
		!ip.IsPrivate() && !ip.IsLoopback() && !ip.IsLinkLocalUnicast() &&
		!ip.IsLinkLocalMulticast() && !ip.IsUnspecified() && !ip.IsMulticast()
}

// checkImageURL resolves host in u and reports whether it is safe to
// fetch. The scheme must be http or https and every resolved address
// must be public; an unresolvable host is refused.
func checkImageURL(u *url.URL) error {
	if u == nil || (u.Scheme != "http" && u.Scheme != "https") {
		return errUnsafeImageURL
	}
	host := u.Hostname()
	if host == "" {
		return errUnsafeImageURL
	}
	if ip := net.ParseIP(host); ip != nil {
		if !safeIP(ip) {
			return errUnsafeImageURL
		}
		return nil
	}
	// The catalog of the resolver comes from the host's own config; an
	// error here is a refusal, not a fallback to dialing the name.
	resolver := &net.Resolver{}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	ips, err := resolver.LookupIPAddr(ctx, host)
	if err != nil || len(ips) == 0 {
		return fmt.Errorf("%w: cannot resolve host", errUnsafeImageURL)
	}
	for _, ip := range ips {
		if !safeIP(ip.IP) {
			return errUnsafeImageURL
		}
	}
	return nil
}

// safeDialer dials addr only when it is a vetted public address, or a
// name whose every record it will try is one: a private record in the
// set is skipped, not dialled, and the dial carries on down the
// candidate list when one address is unreachable, so a dual-stack host
// never falls over on its first record.
func safeDialer(ctx context.Context, network, addr string) (net.Conn, error) {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return nil, errUnsafeImageURL
	}
	if ip := net.ParseIP(host); ip != nil {
		if !safeIP(ip) {
			return nil, errUnsafeImageURL
		}
		return dialContext(ctx, network, ip, port)
	}
	// A name here was checked on the way in; resolve it again and dial
	// only the public records of it, in order. An unresolvable name is
	// a refusal, not a fallback to whatever answered last.
	resolver := &net.Resolver{}
	ips, err := resolver.LookupIPAddr(ctx, host)
	if err != nil || len(ips) == 0 {
		return nil, errUnsafeImageURL
	}
	var dialErr error
	for _, candidate := range ips {
		if !safeIP(candidate.IP) {
			continue
		}
		conn, err := dialContext(ctx, network, candidate.IP, port)
		if err == nil {
			return conn, nil
		}
		if dialErr == nil {
			dialErr = err
		}
	}
	if dialErr != nil {
		return nil, dialErr
	}
	return nil, errUnsafeImageURL
}

// dialContext dials one resolved address, keeping the transport's
// timeout rules on it.
func dialContext(ctx context.Context, network string, ip net.IP, port string) (net.Conn, error) {
	var d net.Dialer
	return d.DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
}
