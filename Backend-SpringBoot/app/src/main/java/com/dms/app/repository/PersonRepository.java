package com.dms.app.repository;

import com.dms.app.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {

    public Person findByEmail(String email);
    public Person findByNationalId(String nationalId);

}
