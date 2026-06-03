package com.ecom.DTO;

import lombok.Data;

@Data
public class AddressResponseDTO {


        private Long id;
        private String fullName;
        private String mobile;
        private String addressLine;
        private String city;
        private String state;
        private String pincode;
    }

