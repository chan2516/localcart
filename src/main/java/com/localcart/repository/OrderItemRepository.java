package com.localcart.repository;

import com.localcart.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    List<OrderItem> findByOrderId(Long orderId);
    
    List<OrderItem> findByVendorId(Long vendorId);
    
    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.id = :orderId AND oi.vendor.id = :vendorId")
    List<OrderItem> findByOrderIdAndVendorId(@Param("orderId") Long orderId, 
                                             @Param("vendorId") Long vendorId);
}
