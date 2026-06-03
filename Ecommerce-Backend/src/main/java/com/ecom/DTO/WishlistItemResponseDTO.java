package com.ecom.DTO;

import lombok.Data;

@Data
public class WishlistItemResponseDTO {


    private Long productId;
    private String productName;
    private Double productPrice;
}
