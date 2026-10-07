package ma.medicare.medicare_api;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    @GetMapping("/api/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        return Map.of(
            "username", jwt.getClaimAsString("preferred_username"),
            "subject", jwt.getSubject(),
            "authorities", authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .toList()
        );
    }
}