package com.ecom.service;

import com.ecom.DTO.ReviewRequestDTO;
import com.ecom.DTO.ReviewResponseDTO;
import com.ecom.entity.Product;
import com.ecom.entity.Review;
import com.ecom.entity.User;
import com.ecom.mapper.ReviewMapper;
import com.ecom.repository.ProductRepo;
import com.ecom.repository.ReviewRepo;
import com.ecom.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepo reviewRepo;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ReviewMapper reviewMapper;

    public ReviewResponseDTO addReview(
            Long userId,
            ReviewRequestDTO requestDTO) {

        User user = userRepo.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Product product = productRepo.findById(
                        requestDTO.getProductId())
                .orElseThrow(() ->
                        new RuntimeException("Product not found"));

        if (reviewRepo.findByUserIdAndProductId(
                userId,
                requestDTO.getProductId()
        ).isPresent()) {

            throw new RuntimeException(
                    "You already reviewed this product");
        }

        Review review = new Review();

        review.setRating(requestDTO.getRating());
        review.setComment(requestDTO.getComment());
        review.setCreatedAt(LocalDateTime.now());
        review.setUser(user);
        review.setProduct(product);

        Review savedReview = reviewRepo.save(review);

        return reviewMapper.toDTO(savedReview);
    }

    public List<ReviewResponseDTO> getReviewsByProduct(
            Long productId) {

        return reviewRepo.findByProductId(productId)
                .stream()
                .map(reviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    public String deleteReview(Long reviewId) {

        Review review = reviewRepo.findById(reviewId)
                .orElseThrow(() ->
                        new RuntimeException("Review not found"));

        reviewRepo.delete(review);

        return "Review deleted successfully";
    }
}