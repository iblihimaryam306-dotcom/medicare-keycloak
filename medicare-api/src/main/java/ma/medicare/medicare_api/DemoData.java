package ma.medicare.medicare_api;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class DemoData {

    public record Person(String sub, String username, String name) {}
    public record Appointment(long id, String patientSub, String doctorSub, String dateTime, String status) {}
    public record MedicalRecord(long id, String patientSub, String doctorSub, String diagnosis, String notes) {}

    public static final String PATIENT1 = "fd1eeb9e-4f6b-481b-8f2f-9a285c6a7dab";
    public static final String PATIENT2 = "133b2c02-1caa-43d9-ae1d-0d18592c5256";
    public static final String DOCTOR1 = "3116b0f0-8025-4287-afc7-eb1be07b146d";
    public static final String DOCTOR2 = "bf376d63-27b9-4e34-8423-ce4793adc926";

    private final Map<String, Person> people = Map.of(
        PATIENT1, new Person(PATIENT1, "patient1", "Amine Benali"),
        PATIENT2, new Person(PATIENT2, "patient2", "Salma Idrissi"),
        DOCTOR1, new Person(DOCTOR1, "doctor1", "Youssef Alaoui"),
        DOCTOR2, new Person(DOCTOR2, "doctor2", "Nadia Tazi"));

    // relation de soin : medecin -> ses patients
    private final Map<String, List<String>> careRelations = Map.of(
        DOCTOR1, List.of(PATIENT1),
        DOCTOR2, List.of(PATIENT2));

    private final Map<Long, Appointment> appointments = new ConcurrentHashMap<>(Map.of(
        1L, new Appointment(1, PATIENT1, DOCTOR1, "2026-10-12 09:00", "PENDING"),
        2L, new Appointment(2, PATIENT2, DOCTOR2, "2026-10-12 10:30", "PENDING"),
        3L, new Appointment(3, PATIENT1, DOCTOR1, "2026-10-19 14:00", "CONFIRMED")));

    private final Map<Long, MedicalRecord> records = Map.of(
        1L, new MedicalRecord(1, PATIENT1, DOCTOR1,
            "Hypertension legere (donnee fictive)", "Controle dans 3 mois (fictif)"),
        2L, new MedicalRecord(2, PATIENT2, DOCTOR2,
            "Allergie saisonniere (donnee fictive)", "Traitement symptomatique (fictif)"));

    public String nameOf(String sub) {
        Person p = people.get(sub);
        return p != null ? p.name() : "inconnu";
    }

    public boolean doctorFollows(String doctorSub, String patientSub) {
        return careRelations.getOrDefault(doctorSub, List.of()).contains(patientSub);
    }

    public List<Person> patientsOf(String doctorSub) {
        return careRelations.getOrDefault(doctorSub, List.of()).stream()
            .map(people::get)
            .toList();
    }

    public List<Appointment> allAppointments() {
        return appointments.values().stream()
            .sorted(Comparator.comparingLong(Appointment::id))
            .toList();
    }

    public Appointment confirm(long id) {
        return appointments.computeIfPresent(id, (key, a) ->
            new Appointment(a.id(), a.patientSub(), a.doctorSub(), a.dateTime(), "CONFIRMED"));
    }

    public MedicalRecord findRecord(long id) {
        return records.get(id);
    }

    public List<MedicalRecord> recordsOfPatient(String patientSub) {
        return records.values().stream()
            .filter(r -> r.patientSub().equals(patientSub))
            .sorted(Comparator.comparingLong(MedicalRecord::id))
            .toList();
    }
}