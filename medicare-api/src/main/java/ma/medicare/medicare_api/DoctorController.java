package ma.medicare.medicare_api;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DoctorController {

    public record PatientView(String username, String name) {}

    private final DemoData data;
    private final AuditService audit;

    public DoctorController(DemoData data, AuditService audit) {
        this.data = data;
        this.audit = audit;
    }

    @GetMapping("/api/doctors/me/patients")
    public List<PatientView> myPatients(@AuthenticationPrincipal Jwt jwt, Authentication auth) {
        Caller me = Caller.of(jwt, auth);
        List<PatientView> result = data.patientsOf(me.sub()).stream()
            .map(p -> new PatientView(p.username(), p.name()))
            .toList();
        audit.log(me, "LIST_MY_PATIENTS", "patients", "ALLOWED (" + result.size() + ")");
        return result;
    }
}