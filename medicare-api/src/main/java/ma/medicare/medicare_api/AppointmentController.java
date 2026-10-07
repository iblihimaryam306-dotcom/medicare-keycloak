package ma.medicare.medicare_api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    public record AppointmentView(long id, String patient, String doctor, String dateTime, String status) {}

    private final DemoData data;
    private final AuditService audit;

    public AppointmentController(DemoData data, AuditService audit) {
        this.data = data;
        this.audit = audit;
    }

    private AppointmentView view(DemoData.Appointment a) {
        return new AppointmentView(a.id(), data.nameOf(a.patientSub()), data.nameOf(a.doctorSub()),
            a.dateTime(), a.status());
    }

    @GetMapping
    public List<AppointmentView> list(@AuthenticationPrincipal Jwt jwt, Authentication auth) {
        Caller me = Caller.of(jwt, auth);
        List<DemoData.Appointment> all = data.allAppointments();
        List<DemoData.Appointment> visible = switch (me.role()) {
            case "PATIENT" -> all.stream().filter(a -> a.patientSub().equals(me.sub())).toList();
            case "DOCTOR" -> all.stream().filter(a -> a.doctorSub().equals(me.sub())).toList();
            case "SECRETARY" -> all;
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        };
        audit.log(me, "LIST_APPOINTMENTS", "appointments", "ALLOWED (" + visible.size() + ")");
        return visible.stream().map(this::view).toList();
    }

    @PutMapping("/{id}/confirm")
    public AppointmentView confirm(@PathVariable long id, @AuthenticationPrincipal Jwt jwt, Authentication auth) {
        Caller me = Caller.of(jwt, auth);
        if (!me.is("SECRETARY")) {
            audit.log(me, "CONFIRM_APPOINTMENT", "appointment/" + id, "DENIED");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        DemoData.Appointment updated = data.confirm(id);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        audit.log(me, "CONFIRM_APPOINTMENT", "appointment/" + id, "ALLOWED");
        return view(updated);
    }
}