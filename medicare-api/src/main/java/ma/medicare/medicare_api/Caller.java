package ma.medicare.medicare_api;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

public record Caller(String sub, String username, String role) {

    public static Caller of(Jwt jwt, Authentication auth) {
        String role = auth.getAuthorities().stream()
            .map(a -> a.getAuthority())
            .filter(a -> a.startsWith("ROLE_"))
            .map(a -> a.substring(5))
            .findFirst()
            .orElse("NONE");
        return new Caller(jwt.getSubject(), jwt.getClaimAsString("preferred_username"), role);
    }

    public boolean is(String expected) {
        return role.equals(expected);
    }
}