package com.localcart.repository;

import com.localcart.entity.AdminActionHistory;
import com.localcart.entity.enums.AdminActionTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminActionHistoryRepository extends JpaRepository<AdminActionHistory, Long> {

    Page<AdminActionHistory> findByTargetTypeOrderByCreatedAtDesc(AdminActionTargetType targetType, Pageable pageable);

    Page<AdminActionHistory> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AdminActionTargetType targetType, Long targetId, Pageable pageable);

    Page<AdminActionHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
}