package com.localcart.repository;

import com.localcart.entity.Address;
import com.localcart.entity.User;
import com.localcart.entity.enums.AddressType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    
    List<Address> findByUser(User user);
    
    List<Address> findByUserIdAndIsDeletedFalse(Long userId);
    
    Optional<Address> findByUserAndIsDefaultTrue(User user);
    
    List<Address> findByUserAndType(User user, AddressType type);
}
