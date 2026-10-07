package ma.medicare.medicare_api;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;

@Component
public class AuditService {

    public record AuditEntry(String time, String actor, String actorSub, String role,
                             String action, String resource, String outcome) {}

    private final List<AuditEntry> entries = new CopyOnWriteArrayList<>();

    public void log(Caller caller, String action, String resource, String outcome) {
        entries.add(new AuditEntry(Instant.now().toString(), caller.username(), caller.sub(),
            caller.role(), action, resource, outcome));
    }

    public List<AuditEntry> all() {
        return List.copyOf(entries);
    }
}