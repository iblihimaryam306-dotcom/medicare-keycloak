package ma.medicare.medicare_api;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RoleCheckController {

    @GetMapping("/api/patient/ping")
    public Map<String, String> patient() {
        return Map.of("zone", "PATIENT");
    }

    @GetMapping("/api/doctor/ping")
    public Map<String, String> doctor() {
        return Map.of("zone", "DOCTOR");
    }

    @GetMapping("/api/secretary/ping")
    public Map<String, String> secretary() {
        return Map.of("zone", "SECRETARY");
    }

    @GetMapping("/api/admin/ping")
    public Map<String, String> admin() {
        return Map.of("zone", "ADMIN");
    }
}