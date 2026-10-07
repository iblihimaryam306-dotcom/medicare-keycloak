package ma.medicare.medicare_api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class RecordController {

    public record RecordView(long id, String patient, String doctor, String diagnosis, String notes) {}

    private final DemoData data;
    private final AuditService audit;

    public RecordController(DemoData data, AuditService audit) {
        this.data = data;
        this.audit = audit;
    }

    private RecordView view(DemoData.MedicalRecord r) {
        return new RecordView(r.id(), data.nameOf(r.patientSub()), data.nameOf(r.doctorSub()),
            r.diagnosis(), r.notes());
    }

    @GetMapping("/api/records/{id}")
    public RecordView get(@PathVariable long id, @AuthenticationPrincipal Jwt jwt, Authentication auth) {
        Caller me = Caller.of(jwt, auth);
        DemoData.MedicalRecord record = data.findRecord(id);
        if (record == null) {
            audit.log(me, "READ_RECORD", "record/" + id, "NOT_FOUND");
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        // controle d'acces au niveau de l'OBJET
        boolean allowed = switch (me.role()) {
            case "PATIENT" -> record.patientSub().equals(me.sub());
            case "DOCTOR" -> data.doctorFollows(me.sub(), record.patientSub());
            default -> false;
        };
        audit.log(me, "READ_RECORD", "record/" + id, allowed ? "ALLOWED" : "DENIED");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return view(record);
    }

    @GetMapping("/api/patients/me/records")
    public List<RecordView> mine(@AuthenticationPrincipal Jwt jwt, Authentication auth) {
        Caller me = Caller.of(jwt, auth);
        List<RecordView> result = data.recordsOfPatient(me.sub()).stream().map(this::view).toList();
        audit.log(me, "LIST_OWN_RECORDS", "records", "ALLOWED (" + result.size() + ")");
        return result;
    }
}