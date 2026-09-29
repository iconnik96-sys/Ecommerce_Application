package com.ecom.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiGenerateRequest {

    private String productName;
    private String category;
    private double price;
    private String existingDescription;
}
