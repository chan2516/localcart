package com.localcart.repository;

import com.localcart.entity.SiteContactInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SiteContactInfoRepository extends JpaRepository<SiteContactInfo, Long> {
	Optional<SiteContactInfo> findTopByOrderByIdAsc();
}
