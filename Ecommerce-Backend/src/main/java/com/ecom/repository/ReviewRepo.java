package com.ecom.repository;

import com.ecom.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepo extends JpaRepository<Review, Long> {

    List<Review> findByProductId(Long productId);

    Optional<Review> findByUserIdAndProductId(
            Long userId,
            Long productId
    );
}