package ma.medicare.medicare_api;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminController {

    private final AuditService audit;

    public AdminController(AuditService audit) {
        this.audit = audit;
    }

    @GetMapping("/api/admin/audit")
    public List<AuditService.AuditEntry> auditLog(@AuthenticationPrincipal Jwt jwt, Authentication auth) {
        audit.log(Caller.of(jwt, auth), "READ_AUDIT", "audit", "ALLOWED");
        return audit.all();
    }
}