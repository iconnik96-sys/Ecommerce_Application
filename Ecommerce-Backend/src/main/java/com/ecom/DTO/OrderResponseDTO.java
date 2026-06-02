package com.ecom.DTO;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponseDTO {
    private Long orderId;
    private Double totalAmount;
    private String status;
    private LocalDateTime orderDate;
    private List<OrderItemResponseDTO> items;
}
