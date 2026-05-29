package com.ecom.mapper;


import com.ecom.DTO.ProductRequestDTO;
import com.ecom.DTO.ProductResponseDTO;
import com.ecom.entity.Product;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    Product toEntity(ProductRequestDTO requestDTO);

    ProductResponseDTO toDTO(Product product);

}
