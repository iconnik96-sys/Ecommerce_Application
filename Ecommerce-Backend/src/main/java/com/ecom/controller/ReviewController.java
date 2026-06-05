package com.ecom.controller;

import com.ecom.DTO.ReviewRequestDTO;
import com.ecom.DTO.ReviewResponseDTO;
import com.ecom.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ecom/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping("/{userId}")
    public ReviewResponseDTO addReview(
            @PathVariable Long userId,
            @RequestBody ReviewRequestDTO requestDTO) {

        return reviewService.addReview(
                userId,
                requestDTO);
    }

    @GetMapping("/product/{productId}")
    public List<ReviewResponseDTO> getReviews(
            @PathVariable Long productId) {

        return reviewService.getReviewsByProduct(productId);
    }

    @DeleteMapping("/{reviewId}")
    public String deleteReview(
            @PathVariable Long reviewId) {

        return reviewService.deleteReview(reviewId);
    }
}