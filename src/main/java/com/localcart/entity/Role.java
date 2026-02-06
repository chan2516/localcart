package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import com.localcart.entity.enums.RoleType;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role extends AuditableEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private RoleType name;

    @Column(length = 500)
    private String description;

    @ManyToMany(mappedBy = "roles")
    @Builder.Default
    private Set<User> users = new HashSet<>();
}
