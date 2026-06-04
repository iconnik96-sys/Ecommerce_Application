package com.ecom.mapper;

import com.ecom.DTO.ReviewResponseDTO;
import com.ecom.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(source = "id", target = "reviewId")
    @Mapping(source = "user.name", target = "userName")
    @Mapping(source = "product.id", target = "productId")
    ReviewResponseDTO toDTO(Review review);
}