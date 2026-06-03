package com.ecom.mapper;

import com.ecom.DTO.AddressRequestDTO;
import com.ecom.DTO.AddressResponseDTO;
import com.ecom.entity.Address;
import org.mapstruct.Mapper;



@Mapper(componentModel = "spring")

public interface AddressMapper {

        AddressResponseDTO toDTO(Address address);

        Address toEntity(AddressRequestDTO dto);



}
