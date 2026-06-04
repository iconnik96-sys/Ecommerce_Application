package com.ecom.DTO;

import lombok.Data;

@Data
public class ReviewRequestDTO {

    private Integer rating;
    private String comment;
    private Long productId;
}