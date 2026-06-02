package com.ecom.DTO;

import lombok.Data;

@Data
public class UpdateQuantityRequestDTO {

    private Long userId;
    private Long productId;
    private int quantityChange;
}
