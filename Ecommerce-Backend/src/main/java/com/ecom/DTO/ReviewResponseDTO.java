package com.ecom.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponseDTO {

    private Long reviewId;
    private Integer rating;
    private String comment;
    private String userName;
    private Long productId;
    private LocalDateTime createdAt;
}