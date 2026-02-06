package com.localcart.repository;

import com.localcart.entity.Role;
import com.localcart.entity.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    Optional<Role> findByName(RoleType name);
    
    boolean existsByName(RoleType name);
}
